const { Internacion, 
    Paciente, 
    Usuario, 
    Medico, 
    Cama, 
    Habitacion, 
    TipoInternacion, 
    Sector, 
    EvaluacionEnfermeria, 
    Enfermero, 
    ControlEnfermeria, 
    AltaMedica } = require('../../models');
const { Op } = require('sequelize');
const db = require('../../database/db');

// Listar pacientes internados
exports.listarInternados = async (req, res) => {
  try {
    const { sector, estado_paciente, habitacion, busqueda } = req.query;
    
    const whereCondition = {
      fecha_alta: null // Solo internaciones activas
    };

    if (estado_paciente) {
      whereCondition.estado_paciente = estado_paciente;
    }

    if (habitacion) {
      whereCondition.habitacion_id = habitacion;
    }

    const internaciones = await Internacion.findAll({
      where: whereCondition,
      include: [
        {
          model: Paciente,
          as: 'paciente',
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido', 'dni', 'fecha_nacimiento', 'sexo'],
            where: busqueda ? {
              [Op.or]: [
                { nombre: { [Op.like]: `%${busqueda}%` } },
                { apellido: { [Op.like]: `%${busqueda}%` } },
                { dni: { [Op.like]: `%${busqueda}%` } }
              ]
            } : {}
          }]
        },
        {
          model: Medico,
          as: 'medico',
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido']
          }]
        },
        {
          model: Cama,
          as: 'cama',
          include: [{
            model: Habitacion,
            as: 'habitacion',
            include: [{
              model: Sector,
              as: 'sector'
            }],
            where: sector ? { sector_id: sector } : {}
          }]
        },
        {
          model: TipoInternacion,
          as: 'tipoInternacion'
        }
      ],
      order: [
        ['estado_paciente', 'ASC'], // Críticos primero
        ['fecha_inicio', 'DESC']
      ],
      subQuery: false
    });

    // Para cada internación, obtener última evaluación de enfermería
    for (let internacion of internaciones) {
      const ultimaEvaluacion = await EvaluacionEnfermeria.findOne({
        where: { paciente_id: internacion.paciente_id },
        order: [['fecha', 'DESC']],
        include: [{
          model: Enfermero,
          as: 'enfermero',
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido']
          }]
        }]
      });
      
      internacion.dataValues.ultima_evaluacion = ultimaEvaluacion;
      
      // Calcular días de internación
      const diasInternado = Math.floor((new Date() - new Date(internacion.fecha_inicio)) / (1000 * 60 * 60 * 24));
      internacion.dataValues.dias_internado = diasInternado;
    }

    // Obtener sectores para filtro
    const sectores = await Sector.findAll({
      attributes: ['id', 'nombre'],
      order: [['nombre', 'ASC']]
    });

    // Obtener habitaciones para filtro
    const habitaciones = await Habitacion.findAll({
      attributes: ['id', 'numero'],
      include: [{
        model: Sector,
        as: 'sector',
        attributes: ['nombre']
      }],
      order: [['numero', 'ASC']]
    });

    // Estadísticas
    const estadisticas = {
      total: internaciones.length,
      criticos: internaciones.filter(i => i.estado_paciente === 'Critico').length,
      graves: internaciones.filter(i => i.estado_paciente === 'Grave').length,
      estables: internaciones.filter(i => i.estado_paciente === 'Estable').length,
      prequirurgicos: internaciones.filter(i => i.estado_operacion === 'Prequirurgico').length
    };

    res.render('dashboard/enfermero/internados', {
      title: 'Pacientes Internados',
      user: req.user,
      internaciones,
      sectores,
      habitaciones,
      estadisticas,
      filtros: { sector, estado_paciente, habitacion, busqueda }
    });

  } catch (error) {
    console.error('Error al listar internados:', error);
    res.status(500).render('error', {
      message: 'Error al cargar pacientes internados',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Ver detalle de internación
exports.verInternacion = async (req, res) => {
  try {
    const { id } = req.params;

    const internacion = await Internacion.findByPk(id, {
      include: [
        {
          model: Paciente,
          as: 'paciente',
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido', 'dni', 'fecha_nacimiento', 'sexo', 'telefono']
          }]
        },
        {
          model: Medico,
          as: 'medico',
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido']
          }]
        },
        {
          model: Cama,
          as: 'cama',
          include: [{
            model: Habitacion,
            as: 'habitacion',
            include: [{
              model: Sector,
              as: 'sector'
            }]
          }]
        },
        {
          model: TipoInternacion,
          as: 'tipoInternacion'
        },
        {
          model: EvaluacionMedica,
          as: 'evaluacionMedica',
          required: false
        }
      ]
    });

    if (!internacion) {
      return res.status(404).render('error', {
        message: 'Internación no encontrada'
      });
    }

    // Historial de evaluaciones de enfermería
    const evaluacionesEnfermeria = await EvaluacionEnfermeria.findAll({
      where: { paciente_id: internacion.paciente_id },
      include: [{
        model: Enfermero,
        as: 'enfermero',
        include: [{
          model: Usuario,
          as: 'usuario',
          attributes: ['nombre', 'apellido']
        }]
      }],
      order: [['fecha', 'DESC']],
      limit: 10
    });

    // Controles de enfermería
    const controles = await ControlEnfermeria.findAll({
      include: [{
        model: EvaluacionEnfermeria,
        as: 'evaluacion',
        where: { paciente_id: internacion.paciente_id },
        include: [{
          model: Enfermero,
          as: 'enfermero',
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido']
          }]
        }]
      }],
      order: [['created_at', 'DESC']],
      limit: 5
    });

    // Calcular días internado
    const diasInternado = Math.floor((new Date() - new Date(internacion.fecha_inicio)) / (1000 * 60 * 60 * 24));

    res.render('dashboard/enfermero/internados-detalle', {
      title: 'Detalle de Internación',
      user: req.user,
      internacion,
      evaluacionesEnfermeria,
      controles,
      diasInternado
    });

  } catch (error) {
    console.error('Error al ver internación:', error);
    res.status(500).render('error', {
      message: 'Error al cargar el detalle',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Actualizar estado del paciente
exports.actualizarEstadoPaciente = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const enfermeroId = req.user.enfermero.id;
    const { id } = req.params;
    const { estado_paciente, observaciones } = req.body;

    const internacion = await Internacion.findByPk(id, { transaction });
    
    if (!internacion) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Internación no encontrada'
      });
    }

    if (internacion.fecha_alta) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Esta internación ya tiene alta'
      });
    }

    // Actualizar estado
    const estadoAnterior = internacion.estado_paciente;
    await internacion.update({
      estado_paciente
    }, { transaction });

    // Registrar cambio en evaluación de enfermería
    await EvaluacionEnfermeria.create({
      paciente_id: internacion.paciente_id,
      enfermero_id: enfermeroId,
      medico_id: internacion.medico_id,
      fecha: new Date(),
      observaciones: `
=== CAMBIO DE ESTADO DEL PACIENTE ===
Estado anterior: ${estadoAnterior}
Estado nuevo: ${estado_paciente}

${observaciones || 'Sin observaciones adicionales'}
      `.trim(),
      tipo_egreso: estado_paciente === 'Critico' ? 'DERIVACION_URGENCIA' : 'PROCEDIMIENTO_COMPLETADO'
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Estado del paciente actualizado',
      redirect: `dashboard/enfermero/internados/${id}`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al actualizar estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el estado',
      error: error.message
    });
  }
};

// Registrar evolución de enfermería
exports.registrarEvolucion = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const enfermeroId = req.user.enfermero.id;
    const { id } = req.params;
    const {
      signos_vitales,
      observaciones,
      procedimientos_realizados,
      medicacion_administrada,
      cambios_notables
    } = req.body;

    const internacion = await Internacion.findByPk(id, { transaction });
    
    if (!internacion) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Internación no encontrada'
      });
    }

    // Crear evaluación de enfermería con evolución
    const evolucion = `
=== EVOLUCIÓN DE ENFERMERÍA ===
Fecha y hora: ${new Date().toLocaleString('es-AR')}
Enfermero: ${req.user.nombre} ${req.user.apellido}

=== SIGNOS VITALES ===
${signos_vitales}

${procedimientos_realizados ? `\n=== PROCEDIMIENTOS REALIZADOS ===\n${procedimientos_realizados}\n` : ''}

${medicacion_administrada ? `\n=== MEDICACIÓN ADMINISTRADA ===\n${medicacion_administrada}\n` : ''}

${cambios_notables ? `\n=== CAMBIOS NOTABLES ===\n${cambios_notables}\n` : ''}

=== OBSERVACIONES ===
${observaciones || 'Ninguna'}
    `.trim();

    await EvaluacionEnfermeria.create({
      paciente_id: internacion.paciente_id,
      enfermero_id: enfermeroId,
      medico_id: internacion.medico_id,
      fecha: new Date(),
      signos_vitales,
      observaciones: evolucion,
      tipo_egreso: cambios_notables ? 'DERIVACION_MEDICO' : 'PROCEDIMIENTO_COMPLETADO'
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Evolución registrada correctamente',
      redirect: `dashboard/enfermero/internados/${id}`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al registrar evolución:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar la evolución',
      error: error.message
    });
  }
};

// Obtener estadísticas de internaciones
exports.estadisticas = async (req, res) => {
  try {
    const [
      totalInternados,
      criticos,
      graves,
      prequirurgicos,
      camasOcupadas,
      camasDisponibles
    ] = await Promise.all([
      Internacion.count({
        where: { fecha_alta: null }
      }),
      Internacion.count({
        where: {
          fecha_alta: null,
          estado_paciente: 'Critico'
        }
      }),
      Internacion.count({
        where: {
          fecha_alta: null,
          estado_paciente: 'Grave'
        }
      }),
      Internacion.count({
        where: {
          fecha_alta: null,
          estado_operacion: 'Prequirurgico'
        }
      }),
      Cama.count({
        where: { estado: 'Ocupada' }
      }),
      Cama.count({
        where: { estado: 'Libre' }
      })
    ]);

    res.json({
      success: true,
      estadisticas: {
        total_internados: totalInternados,
        criticos,
        graves,
        prequirurgicos,
        camas_ocupadas: camasOcupadas,
        camas_disponibles: camasDisponibles,
        porcentaje_ocupacion: camasOcupadas + camasDisponibles > 0 
          ? Math.round((camasOcupadas / (camasOcupadas + camasDisponibles)) * 100) 
          : 0
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
};

// Buscar paciente internado
exports.buscarInternado = async (req, res) => {
  try {
    const { busqueda } = req.query;

    if (!busqueda || busqueda.length < 2) {
      return res.json({
        success: false,
        message: 'Ingrese al menos 2 caracteres'
      });
    }

    const internaciones = await Internacion.findAll({
      where: { fecha_alta: null },
      include: [
        {
          model: Paciente,
          as: 'paciente',
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido', 'dni'],
            where: {
              [Op.or]: [
                { nombre: { [Op.like]: `%${busqueda}%` } },
                { apellido: { [Op.like]: `%${busqueda}%` } },
                { dni: { [Op.like]: `%${busqueda}%` } }
              ]
            }
          }]
        },
        {
          model: Cama,
          as: 'cama',
          include: [{
            model: Habitacion,
            as: 'habitacion'
          }]
        }
      ],
      limit: 10
    });

    res.json({
      success: true,
      internaciones: internaciones.map(i => ({
        id: i.id,
        paciente: {
          id: i.paciente.id,
          nombre: `${i.paciente.usuario.nombre} ${i.paciente.usuario.apellido}`,
          dni: i.paciente.usuario.dni
        },
        habitacion: i.cama.habitacion.numero,
        cama: i.cama.numero,
        estado_paciente: i.estado_paciente
      }))
    });

  } catch (error) {
    console.error('Error al buscar internado:', error);
    res.status(500).json({
      success: false,
      message: 'Error en la búsqueda'
    });
  }
};

// Pacientes por sector
exports.pacientesPorSector = async (req, res) => {
  try {
    const { sector_id } = req.params;

    const internaciones = await Internacion.findAll({
      where: { fecha_alta: null },
      include: [
        {
          model: Paciente,
          as: 'paciente',
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido', 'dni']
          }]
        },
        {
          model: Cama,
          as: 'cama',
          include: [{
            model: Habitacion,
            as: 'habitacion',
            where: { sector_id }
          }]
        }
      ],
      order: [['estado_paciente', 'ASC']]
    });

    res.json({
      success: true,
      total: internaciones.length,
      internaciones: internaciones.map(i => ({
        id: i.id,
        paciente: `${i.paciente.usuario.nombre} ${i.paciente.usuario.apellido}`,
        habitacion: i.cama.habitacion.numero,
        cama: i.cama.numero,
        estado: i.estado_paciente
      }))
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pacientes del sector'
    });
  }
};

module.exports = exports;