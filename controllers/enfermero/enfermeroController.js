const { Enfermero, 
  Usuario, 
  Sector, 
  EvaluacionEnfermeria, 
  Paciente, 
  ControlEnfermeria, 
  Cama, 
  Internacion, 
  ListaEspera, 
  Turno } = require('../../models');
const { Op } = require('sequelize');

// Dashboard principal
exports.dashboard = async (req, res) => {
  try {
    // ✅ CORRECCIÓN
    const enfermeroId = req.user.id;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Estadísticas del día
    const [
      evaluacionesHoy,
      pacientesTriaje,
      procedimientosPendientes,
      pacientesInternados,
      camasDisponibles,
      listaEsperaPendiente
    ] = await Promise.all([
      EvaluacionEnfermeria.count({
        where: {
          enfermero_id: enfermeroId,
          fecha: { [Op.gte]: hoy }
        }
      }),
      EvaluacionEnfermeria.count({
        where: {
          nivel_triaje: { [Op.ne]: null },
          tipo_egreso: 'PENDIENTE_EVALUACION',
          fecha: { [Op.gte]: hoy }
        }
      }),
      EvaluacionEnfermeria.count({
        where: {
          procedimiento_enfermeria_id: { [Op.ne]: null },
          tipo_egreso: 'PENDIENTE_EVALUACION'
        }
      }),
      Internacion.count({
        where: { fecha_alta: null },
        include: [{
          model: Paciente,
          as: 'paciente',
          required: true
        }]
      }),
      Cama.count({
        where: { estado: 'Libre' }
      }),
      ListaEspera.count({
        where: {
          estado: 'PENDIENTE',
          creador_tipo: 'ENFERMERO',
          // ✅ CORRECCIÓN
          creador_id: req.user.usuario_id
        }
      })
    ]);

    // Últimas evaluaciones
    const ultimasEvaluaciones = await EvaluacionEnfermeria.findAll({
      where: { enfermero_id: enfermeroId },
      include: [{
        model: Paciente,
        as: 'paciente',
        include: [{
          model: Usuario,
          as: 'usuario',
          attributes: ['nombre', 'apellido', 'dni']
        }]
      }],
      order: [['fecha', 'DESC']],
      limit: 5
    });

    // Pacientes críticos en triaje
    const pacientesCriticos = await EvaluacionEnfermeria.findAll({
      where: {
        nivel_triaje: 'Rojo',
        tipo_egreso: 'PENDIENTE_EVALUACION',
        fecha: { [Op.gte]: hoy }
      },
      include: [{
        model: Paciente,
        as: 'paciente',
        include: [{
          model: Usuario,
          as: 'usuario',
          attributes: ['nombre', 'apellido', 'dni']
        }]
      }],
      order: [['fecha', 'ASC']],
      limit: 10
    });

    // Información del enfermero
    const enfermero = await Enfermero.findByPk(enfermeroId, {
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['nombre', 'apellido', 'email', 'telefono']
        },
        {
          model: Sector,
          as: 'sector',
          attributes: ['nombre', 'descripcion']
        }
      ]
    });

    res.render('dashboard/enfermero/dashboard', {
      title: 'Dashboard Enfermería',
      user: {
        ...req.user,
        nombre: enfermero.usuario.nombre,
        apellido: enfermero.usuario.apellido,
        nivel: enfermero.nivel
      },
      estadisticas: {
        evaluacionesHoy,
        pacientesTriaje,
        procedimientosPendientes,
        pacientesInternados,
        camasDisponibles,
        listaEsperaPendiente
      },
      ultimasEvaluaciones,
      pacientesCriticos,
      enfermero
    });

  } catch (error) {
    console.error('Error en dashboard enfermero:', error);
    res.status(500).render('error', {
      message: 'Error al cargar el dashboard',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Obtener resumen de actividad
exports.getResumenActividad = async (req, res) => {
  try {
    // ✅ CORRECCIÓN
    const enfermeroId = req.user.id;
    const { fecha_inicio, fecha_fin } = req.query;

    const whereCondition = {
      enfermero_id: enfermeroId
    };

    if (fecha_inicio && fecha_fin) {
      whereCondition.fecha = {
        [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)]
      };
    }

    const evaluaciones = await EvaluacionEnfermeria.findAll({
      where: whereCondition,
      include: [{
        model: Paciente,
        as: 'paciente',
        include: [{
          model: Usuario,
          as: 'usuario',
          attributes: ['nombre', 'apellido', 'dni']
        }]
      }],
      order: [['fecha', 'DESC']]
    });

    const resumen = {
      total: evaluaciones.length,
      completados: evaluaciones.filter(e => e.tipo_egreso === 'PROCEDIMIENTO_COMPLETADO').length,
      derivados_medico: evaluaciones.filter(e => e.tipo_egreso === 'DERIVACION_MEDICO').length,
      derivados_urgencia: evaluaciones.filter(e => e.tipo_egreso === 'DERIVACION_URGENCIA').length,
      pendientes: evaluaciones.filter(e => e.tipo_egreso === 'PENDIENTE_EVALUACION').length
    };

    res.json({
      success: true,
      resumen,
      evaluaciones
    });

  } catch (error) {
    console.error('Error al obtener resumen:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen de actividad'
    });
  }
};

// Notificaciones pendientes
exports.getNotificaciones = async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const notificaciones = [];

    const triajeCritico = await EvaluacionEnfermeria.count({
      where: {
        nivel_triaje: 'Rojo',
        tipo_egreso: 'PENDIENTE_EVALUACION',
        fecha: { [Op.gte]: hoy }
      }
    });

    if (triajeCritico > 0) {
      notificaciones.push({
        tipo: 'critico',
        mensaje: `${triajeCritico} paciente(s) en triaje crítico (Rojo)`,
        url: 'dashboard/enfermero/triaje',
        icono: 'fa-exclamation-triangle',
        cantidad: triajeCritico
      });
    }

    const procedimientosPendientes = await EvaluacionEnfermeria.count({
      where: {
        procedimiento_enfermeria_id: { [Op.ne]: null },
        tipo_egreso: 'PENDIENTE_EVALUACION'
      }
    });

    if (procedimientosPendientes > 0) {
      notificaciones.push({
        tipo: 'procedimiento',
        mensaje: `${procedimientosPendientes} procedimiento(s) pendiente(s)`,
        url: 'dashboard/enfermero/procedimientos',
        icono: 'fa-syringe',
        cantidad: procedimientosPendientes
      });
    }

    const camasPorLimpiar = await Cama.count({
      where: { estado: 'EnLimpieza' }
    });

    if (camasPorLimpiar > 0) {
      notificaciones.push({
        tipo: 'limpieza',
        mensaje: `${camasPorLimpiar} cama(s) en proceso de limpieza`,
        url: 'dashboard/enfermero/camas',
        icono: 'fa-bed',
        cantidad: camasPorLimpiar
      });
    }

    res.json({
      success: true,
      notificaciones
    });

  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener notificaciones'
    });
  }
};

module.exports = exports;