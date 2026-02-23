const db = require('../../models');
const { Op } = require('sequelize');

/**
 * CONTROLADOR: Internaciones del Paciente
 * Visualización de internaciones y hospitalizaciones
 */

// GET /paciente/internaciones - Lista de internaciones
exports.getInternaciones = async (req, res, next) => {
  try {
    const pacienteId = req.user.id;
    const { estado, page = 1 } = req.query;
    const limit = 10;
    const offset = (page - 1) * limit;

    // Obtener paciente con estado
    const paciente = await db.Paciente.findByPk(pacienteId, {
      attributes: ['id', 'estado']
    });

    if (!paciente) {
      return res.status(404).render('error', {
        message: 'Paciente no encontrado'
      });
    }

    // Construir filtros base
    const whereClause = { paciente_id: paciente.id };

    // Obtener internaciones CON altas médicas (LEFT JOIN)
    const { count, rows: internaciones } = await db.Internacion.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: db.Medico,
          as: 'medico',
          include: [
            {
              model: db.Usuario,
              as: 'usuario',
              attributes: ['nombre', 'apellido']
            },
            {
              model: db.Especialidad,
              as: 'especialidad',
              attributes: ['nombre']
            }
          ]
        },
        {
          model: db.Cama,
          as: 'cama',
          attributes: ['numero'],
          include: [{
            model: db.Habitacion,
            as: 'habitacion',
            attributes: ['numero', 'tipo']
          }]
        },
        {
          model: db.Habitacion,
          as: 'habitacion',
          attributes: ['numero', 'tipo'],
          include: [{
            model: db.Sector,
            as: 'sector',
            attributes: ['nombre']
          }]
        },
        {
          model: db.TipoInternacion,
          as: 'tipoInternacion',
          attributes: ['nombre', 'descripcion']
        },
        {
          model: db.IntervencionQuirurgica,
          as: 'intervencionQuirurgica',
          attributes: ['id', 'tipo_procedimiento', 'fecha_inicio', 'resultado_cirugia']
        },
        {
          model: db.AltaMedica,
          as: 'altasMedicas',
          attributes: ['id', 'fecha_alta', 'tipo_alta', 'estado_paciente'],
          required: false // IMPORTANTE: LEFT JOIN
        }
      ],
      order: [['fecha_inicio', 'DESC']],
      limit,
      offset
    });

    // Procesar cada internación para determinar estado real
    const internacionesProcesadas = internaciones.map(int => {
      const tieneAltaMedica = int.altasMedicas && int.altasMedicas.length > 0;
      const estaRealmenteActiva = !int.fecha_alta && !tieneAltaMedica;
      
      // Calcular duración
      const inicio = new Date(int.fecha_inicio);
      let fin;
      
      if (int.fecha_alta) {
        fin = new Date(int.fecha_alta);
      } else if (tieneAltaMedica && int.altasMedicas[0] && int.altasMedicas[0].fecha_alta) {
        fin = new Date(int.altasMedicas[0].fecha_alta);
      } else if (estaRealmenteActiva) {
        fin = new Date();
      } else {
        fin = inicio;
      }
      
      const duracion = Math.max(1, Math.floor((fin - inicio) / (1000 * 60 * 60 * 24)));
      
      // Determinar estado para mostrar
      let estadoMostrar = '';
      let estadoClase = '';
      
      if (estaRealmenteActiva) {
        estadoMostrar = 'ACTUALMENTE INTERNADO';
        estadoClase = 'bg-warning';
      } else if (tieneAltaMedica) {
        estadoMostrar = 'DADO DE ALTA';
        estadoClase = 'bg-success';
      } else if (int.fecha_alta) {
        estadoMostrar = 'FINALIZADA';
        estadoClase = 'bg-secondary';
      } else {
        estadoMostrar = 'SIN ESTADO DEFINIDO';
        estadoClase = 'bg-info';
      }
      
      return {
        ...int.toJSON(),
        dataValues: {
          ...int.dataValues,
          duracion,
          estaRealmenteActiva,
          estadoMostrar,
          estadoClase,
          tieneAltaMedica
        }
      };
    });

    // Aplicar filtro de estado después de procesar
    let internacionesFiltradas = internacionesProcesadas;
    if (estado === 'activa') {
      internacionesFiltradas = internacionesProcesadas.filter(
        i => i.dataValues.estaRealmenteActiva
      );
    } else if (estado === 'finalizada') {
      internacionesFiltradas = internacionesProcesadas.filter(
        i => !i.dataValues.estaRealmenteActiva
      );
    }

    // Estadísticas basadas en estado real
    const estadisticas = {
      total: count,
      activas: internacionesProcesadas.filter(i => i.dataValues.estaRealmenteActiva).length,
      finalizadas: internacionesProcesadas.filter(i => !i.dataValues.estaRealmenteActiva).length,
      conCirugia: internacionesProcesadas.filter(i => i.intervencionQuirurgica).length
    };

    // Internación realmente activa
    const internacionRealmenteActiva = internacionesProcesadas.find(
      i => i.dataValues.estaRealmenteActiva
    );

    const totalPages = Math.ceil(count / limit);

    res.render('dashboard/paciente/internaciones', {
      title: 'Mis Internaciones',
      user: req.user,
      pacienteEstado: paciente.estado,
      internaciones: internacionesFiltradas,
      estadisticas,
      internacionActiva: internacionRealmenteActiva,
      filtros: { estado },
      paginacion: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error al obtener internaciones:', error);
    next(error);
  }
};

// GET /paciente/internaciones/:id - Detalle de internación
exports.getDetalleInternacion = async (req, res, next) => {
  try {
    const pacienteId = req.user.id;
    const internacionId = req.params.id;

    const paciente = await db.Paciente.findByPk(pacienteId, {
      attributes: ['id', 'estado']
    });

    if (!paciente) {
      return res.status(404).render('error', {
        message: 'Paciente no encontrado'
      });
    }

    const internacion = await db.Internacion.findOne({
      where: {
        id: internacionId,
        paciente_id: paciente.id
      },
      include: [
        {
          model: db.Medico,
          as: 'medico',
          include: [
            {
              model: db.Usuario,
              as: 'usuario',
              attributes: ['nombre', 'apellido', 'telefono']
            },
            {
              model: db.Especialidad,
              as: 'especialidad',
              attributes: ['nombre', 'descripcion']
            }
          ]
        },
        {
          model: db.Cama,
          as: 'cama',
          attributes: ['numero', 'estado'],
          include: [{
            model: db.Habitacion,
            as: 'habitacion',
            attributes: ['numero', 'tipo']
          }]
        },
        {
          model: db.Habitacion,
          as: 'habitacion',
          attributes: ['numero', 'tipo'],
          include: [{
            model: db.Sector,
            as: 'sector',
            attributes: ['nombre', 'descripcion']
          }]
        },
        {
          model: db.TipoInternacion,
          as: 'tipoInternacion',
          attributes: ['nombre', 'descripcion', 'estado_paciente']
        },
        {
          model: db.Administrativo,
          as: 'administrativo',
          include: [{
            model: db.Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido']
          }]
        },
        {
          model: db.EvaluacionMedica,
          as: 'evaluacionMedica',
          include: [
            {
              model: db.Diagnostico,
              as: 'diagnostico',
              attributes: ['nombre', 'codigo', 'descripcion']
            },
            {
              model: db.Tratamiento,
              as: 'tratamiento',
              attributes: ['nombre', 'descripcion']
            }
          ]
        },
        {
          model: db.IntervencionQuirurgica,
          as: 'intervencionQuirurgica',
          include: [{
            model: db.Habitacion,
            as: 'habitacion',
            attributes: ['numero', 'tipo']
          }]
        },
        {
          model: db.AltaMedica,
          as: 'altasMedicas',
          include: [{
            model: db.Medico,
            as: 'medico',
            include: [{
              model: db.Usuario,
              as: 'usuario',
              attributes: ['nombre', 'apellido']
            }]
          }]
        },
        {
          model: db.Admision,
          as: 'admision',
          attributes: ['id', 'fecha', 'estado'],
          include: [{
            model: db.MotivoAdmision,
            as: 'motivo',
            attributes: ['nombre']
          }]
        }
      ]
    });

    if (!internacion) {
      return res.status(404).render('error', {
        message: 'Internación no encontrada'
      });
    }

    // Lógica CORRECTA para determinar estado
    const tieneAltaMedica = internacion.altasMedicas && 
                           internacion.altasMedicas.length > 0;
    const estaRealmenteActiva = !internacion.fecha_alta && !tieneAltaMedica;
    
    // Calcular duración
    const inicio = new Date(internacion.fecha_inicio);
    let fin;
    
    if (internacion.fecha_alta) {
      fin = new Date(internacion.fecha_alta);
    } else if (tieneAltaMedica && internacion.altasMedicas[0] && internacion.altasMedicas[0].fecha_alta) {
      fin = new Date(internacion.altasMedicas[0].fecha_alta);
    } else if (estaRealmenteActiva) {
      fin = new Date();
    } else {
      fin = inicio;
    }
    
    const duracion = Math.max(1, Math.floor((fin - inicio) / (1000 * 60 * 60 * 24)));

    res.render('dashboard/paciente/internacion-detalle', {
      title: 'Detalle de Internación',
      user: req.user,
      internacion,
      duracion,
      estaActiva: estaRealmenteActiva,
      tieneAltaMedica,
      pacienteEstado: paciente.estado,
      pacienteId: paciente.id,
      internacionId: internacion.id
    });

  } catch (error) {
    console.error('Error al obtener detalle de internación:', error);
    next(error);
  }
};

// GET /paciente/internaciones/activa - Internación activa (AJAX)
exports.getInternacionActiva = async (req, res, next) => {
  try {
    const pacienteId = req.user.id;

    const paciente = await db.Paciente.findByPk(pacienteId, {
      attributes: ['id', 'estado']
    });

    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    const internacion = await db.Internacion.findOne({
      where: {
        paciente_id: paciente.id,
        fecha_alta: null
      },
      include: [
        {
          model: db.AltaMedica,
          as: 'altasMedicas',
          required: false
        },
        {
          model: db.Cama,
          as: 'cama',
          attributes: ['numero'],
          include: [{
            model: db.Habitacion,
            as: 'habitacion',
            attributes: ['numero', 'tipo']
          }]
        },
        {
          model: db.Habitacion,
          as: 'habitacion',
          include: [{
            model: db.Sector,
            as: 'sector',
            attributes: ['nombre']
          }]
        },
        {
          model: db.Medico,
          as: 'medico',
          include: [{
            model: db.Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido']
          }]
        }
      ]
    });

    if (!internacion) {
      return res.json({
        success: true,
        tieneInternacionActiva: false
      });
    }

    // Verificar si realmente está activa
    const tieneAltaMedica = internacion.altasMedicas && 
                           internacion.altasMedicas.length > 0;
    const estaRealmenteActiva = !tieneAltaMedica;

    // Calcular duración
    const inicio = new Date(internacion.fecha_inicio);
    const ahora = new Date();
    const duracion = Math.floor((ahora - inicio) / (1000 * 60 * 60 * 24));

    res.json({
      success: true,
      tieneInternacionActiva: estaRealmenteActiva,
      internacion: {
        ...internacion.toJSON(),
        duracion,
        estaRealmenteActiva
      }
    });

  } catch (error) {
    console.error('Error al obtener internación activa:', error);
    next(error);
  }
};

// GET /paciente/internaciones/:id/estado - Consultar estado (AJAX)
exports.getEstadoInternacion = async (req, res, next) => {
  try {
    const pacienteId = req.user.id;
    const internacionId = req.params.id;

    const paciente = await db.Paciente.findByPk(pacienteId, {
      attributes: ['id', 'estado']
    });

    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    const internacion = await db.Internacion.findOne({
      where: {
        id: internacionId,
        paciente_id: paciente.id
      },
      include: [{
        model: db.AltaMedica,
        as: 'altasMedicas',
        required: false
      }]
    });

    if (!internacion) {
      return res.status(404).json({
        success: false,
        message: 'Internación no encontrada'
      });
    }

    // Lógica para determinar estado
    const tieneAltaMedica = internacion.altasMedicas && 
                           internacion.altasMedicas.length > 0;
    const estaRealmenteActiva = !internacion.fecha_alta && !tieneAltaMedica;

    // Calcular duración
    const inicio = new Date(internacion.fecha_inicio);
    let fin;
    
    if (internacion.fecha_alta) {
      fin = new Date(internacion.fecha_alta);
    } else if (tieneAltaMedica && internacion.altasMedicas[0] && internacion.altasMedicas[0].fecha_alta) {
      fin = new Date(internacion.altasMedicas[0].fecha_alta);
    } else if (estaRealmenteActiva) {
      fin = new Date();
    } else {
      fin = inicio;
    }
    
    const duracion = Math.max(1, Math.floor((fin - inicio) / (1000 * 60 * 60 * 24)));

    res.json({
      success: true,
      estaActiva: estaRealmenteActiva,
      tieneAltaMedica,
      fechaAlta: internacion.fecha_alta,
      fechaAltaMedica: tieneAltaMedica && internacion.altasMedicas[0] ? internacion.altasMedicas[0].fecha_alta : null,
      duracion,
      estadoPaciente: paciente.estado,
      fechaConsulta: new Date()
    });

  } catch (error) {
    console.error('Error al obtener estado:', error);
    next(error);
  }
};