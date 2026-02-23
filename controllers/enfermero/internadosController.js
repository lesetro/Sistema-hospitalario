const { Internacion, 
    Paciente, 
    Usuario, 
    Medico, 
    Cama, 
    Habitacion, 
    TipoInternacion, 
    Sector, 
    EvaluacionEnfermeria, 
    EvaluacionMedica,
    Enfermero, 
    Especialidad,
    ControlEnfermeria, 
    AltaMedica } = require('../../models');
const { Op } = require('sequelize');
const db = require('../../database/db');

// Listar pacientes internados
exports.listarInternados = async (req, res, next) => {
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

    // Para cada internación, obtener última evaluación de enfermería y calcular días
    for (let internacion of internaciones) {
      // Calcular días de internación de forma segura
      if (internacion.fecha_inicio) {
        const fechaInicio = new Date(internacion.fecha_inicio);
        const ahora = new Date();
        const diasInternado = Math.floor((ahora - fechaInicio) / (1000 * 60 * 60 * 24));
        internacion.dataValues.dias_internado = diasInternado;
      } else {
        internacion.dataValues.dias_internado = 0;
      }

      //  Obtener última evaluación con manejo seguro
      try {
        const ultimaEvaluacion = await EvaluacionEnfermeria.findOne({
          where: { paciente_id: internacion.paciente_id },
          order: [['fecha', 'DESC']],
          include: [{
            model: Enfermero,
            as: 'enfermero',
            required: false,  // ← No requerir enfermero
            include: [{
              model: Usuario,
              as: 'usuario',
              attributes: ['nombre', 'apellido']
            }]
          }]
        });
        
        internacion.dataValues.ultima_evaluacion = ultimaEvaluacion;
      } catch (err) {
        console.log('Error al obtener última evaluación:', err.message);
        internacion.dataValues.ultima_evaluacion = null;
      }
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
    next(error);
  }
};

// Ver detalle de internación
exports.verInternacion = async (req, res, next) => {
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
        message: 'Internación no encontrada',
        user: req.user
      });
    }

    // Controles de enfermería
    let controles = [];
    try {
      controles = await ControlEnfermeria.findAll({
        include: [{
          model: EvaluacionEnfermeria,
          as: 'evaluacion',
          where: { paciente_id: internacion.paciente_id },
          required: true,
          include: [{
            model: Enfermero,
            as: 'enfermero',
            required: false,
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
    } catch (err) {
      console.log('Error al obtener controles:', err.message);
    }

    // Calcular días internado
    let diasInternado = 0;
    if (internacion.fecha_inicio) {
      diasInternado = Math.floor((new Date() - new Date(internacion.fecha_inicio)) / (1000 * 60 * 60 * 24));
    }

    // ✅ SIMPLE: No parseamos nada, el PUG muestra internacion.observaciones directo
    res.render('dashboard/enfermero/internados-detalle', {
      title: 'Detalle de Internación',
      user: req.user,
      internacion,
      controles,
      diasInternado
    });

  } catch (error) {
    console.error('Error al ver internación:', error);
    next(error);
  }
};

// ============================================
// REGISTRAR EVOLUCIÓN
// ============================================
exports.registrarEvolucion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { observaciones, signos_vitales, procedimientos_realizados, medicacion_administrada, cambios_notables } = req.body;
    
    const nombreEnfermero = `${req.user.nombre} ${req.user.apellido}`;
    const fechaActual = new Date().toLocaleString('es-AR');

    console.log(' Registrando evolución para internación:', id);

    const internacion = await Internacion.findByPk(id);
    if (!internacion) {
      return res.status(404).json({
        success: false,
        message: 'Internación no encontrada'
      });
    }

    //  Construir texto con TODO lo que venga del formulario
    let textoEvolucion = `\n════════════════════════════════════════════════════\n`;
    textoEvolucion += `📅 ${fechaActual} | Enf. ${nombreEnfermero}\n`;
    textoEvolucion += `════════════════════════════════════════════════════\n`;
    
    if (signos_vitales && signos_vitales.trim()) {
      textoEvolucion += ` Signos Vitales: ${signos_vitales.trim()}\n`;
    }
    
    if (observaciones && observaciones.trim()) {
      textoEvolucion += ` Observaciones: ${observaciones.trim()}\n`;
    }
    
    if (procedimientos_realizados && procedimientos_realizados.trim()) {
      textoEvolucion += ` Procedimientos: ${procedimientos_realizados.trim()}\n`;
    }
    
    if (medicacion_administrada && medicacion_administrada.trim()) {
      textoEvolucion += ` Medicación: ${medicacion_administrada.trim()}\n`;
    }
    
    if (cambios_notables && cambios_notables.trim()) {
      textoEvolucion += ` Cambios Notables: ${cambios_notables.trim()}\n`;
    }

    // Verificar que haya algo para guardar
    if (textoEvolucion.split('\n').filter(l => l.includes(':')).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe ingresar al menos un campo'
      });
    }

    // Concatenar a las observaciones existentes
    const observacionesActuales = internacion.observaciones || '';
    const observacionesActualizadas = observacionesActuales + textoEvolucion;

    await internacion.update({ 
      observaciones: observacionesActualizadas 
    });

    console.log(' Evolución registrada correctamente');

    res.json({
      success: true,
      message: 'Evolución registrada correctamente'
    });

  } catch (error) {
    console.error('❌ Error al registrar evolución:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar la evolución',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


// ============================================
// ACTUALIZAR ESTADO DEL PACIENTE
// ============================================
exports.actualizarEstadoPaciente = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado_paciente, observaciones } = req.body;

    const estadosValidos = ['Estable', 'Grave', 'Critico', 'Fallecido', 'Sin_Evaluar'];
    if (!estadosValidos.includes(estado_paciente)) {
      return res.status(400).json({
        success: false,
        message: `Estado inválido. Valores aceptados: ${estadosValidos.join(', ')}`
      });
    }

    const internacion = await Internacion.findByPk(id);
    if (!internacion) {
      return res.status(404).json({
        success: false,
        message: 'Internación no encontrada'
      });
    }

    const estadoAnterior = internacion.estado_paciente;
    
    // Si hay observaciones, agregarlas al historial
    if (observaciones && observaciones.trim()) {
      const nombreEnfermero = `${req.user.nombre} ${req.user.apellido}`;
      const fechaActual = new Date().toLocaleString('es-AR');
      const nuevaEvolucion = `\n[${fechaActual}] - Enf. ${nombreEnfermero}:\nCambio de estado: ${estadoAnterior} → ${estado_paciente}\nMotivo: ${observaciones.trim()}\n${'─'.repeat(50)}`;
      
      const observacionesActuales = internacion.observaciones || '';
      await internacion.update({ 
        estado_paciente,
        observaciones: observacionesActuales + nuevaEvolucion
      });
    } else {
      await internacion.update({ estado_paciente });
    }

    console.log(` Estado actualizado: ${estadoAnterior} → ${estado_paciente}`);

    // Si es crítico, notificar al médico
    if (estado_paciente === 'Critico') {
      console.log('⚠️ NOTIFICACIÓN: Paciente en estado crítico - notificar al médico');
    }

    res.json({
      success: true,
      message: 'Estado actualizado correctamente',
      nuevo_estado: estado_paciente
    });

  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el estado'
    });
  }
};

// Obtener estadísticas de internaciones
exports.estadisticas = async (req, res, next) => {
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
    next(error);
  }
};

// Buscar paciente internado
exports.buscarInternado = async (req, res, next) => {
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
    next(error);
  }
};

// Pacientes por sector
exports.pacientesPorSector = async (req, res, next) => {
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
    next(error);
  }
};

// ============================================
// VER TODOS LOS CONTROLES DE UN INTERNADO
// ============================================
exports.verControles = async (req, res, next) => {
  try {
    const { id } = req.params;

    const internacion = await Internacion.findByPk(id, {
      include: [
        {
          model: Paciente,
          as: 'paciente',
          include: [{
            model: Usuario,
            as: 'usuario'
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
        }
      ]
    });

    if (!internacion) {
      return res.status(404).render('error', {
        message: 'Internación no encontrada',
        user: req.user
      });
    }

    console.log(' Buscando controles para paciente:', internacion.paciente_id);

    // Obtener TODOS los controles del paciente
    let controlesFiltrados = [];
    try {
      const controles = await ControlEnfermeria.findAll({
        include: [
          {
            model: EvaluacionEnfermeria,
            as: 'evaluacion',  
            include: [
              {
                model: Paciente,
                as: 'paciente'
              },
              {
                model: Enfermero,
                as: 'enfermero',
                required: false,
                include: [{
                  model: Usuario,
                  as: 'usuario',
                  attributes: ['nombre', 'apellido']
                }]
              }
            ]
          }
        ],
        order: [['createdAt', 'DESC']],
        subQuery: false,
        raw: false
      });

      // Filtrar en JavaScript - solo controles de este paciente
      controlesFiltrados = controles.filter(c => 
        c.evaluacion && c.evaluacion.paciente_id === internacion.paciente_id
      );
    } catch (err) {
      console.log('Error al obtener controles:', err.message);
    }

    console.log(` Controles encontrados: ${controlesFiltrados.length}`);

    res.render('dashboard/enfermero/internados-controles', {
      title: 'Controles de Enfermería',
      user: req.user,
      internacion,
      controles: controlesFiltrados
    });

  } catch (error) {
    console.error('❌ Error al ver controles:', error.message);
    res.status(500).render('error', {
      message: 'Error al cargar los controles',
      user: req.user,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


module.exports = exports;