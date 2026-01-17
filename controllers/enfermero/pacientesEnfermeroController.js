const { Paciente, 
    Usuario, 
    ObraSocial, 
    Administrativo, 
    EvaluacionEnfermeria, 
    Enfermero, 
    Internacion, 
    Cama, 
    Habitacion, 
    ControlEnfermeria } = require('../../models');
const { Op } = require('sequelize');
const db = require('../../database/db');

// Listar pacientes atendidos por el enfermero
exports.listarMisPacientes = async (req, res) => {
  try {
    // ✅ CORRECCIÓN
    const enfermeroId = req.user.id;
    const { busqueda, fecha_desde, fecha_hasta, estado } = req.query;

    const whereEvaluacion = {
      enfermero_id: enfermeroId
    };

    if (fecha_desde && fecha_hasta) {
      whereEvaluacion.fecha = {
        [Op.between]: [new Date(fecha_desde), new Date(fecha_hasta)]
      };
    }

    const evaluaciones = await EvaluacionEnfermeria.findAll({
      where: whereEvaluacion,
      include: [{
        model: Paciente,
        as: 'paciente',
        include: [{
          model: Usuario,
          as: 'usuario',
          attributes: ['nombre', 'apellido', 'dni', 'fecha_nacimiento', 'sexo', 'telefono', 'email'],
          where: busqueda ? {
            [Op.or]: [
              { nombre: { [Op.like]: `%${busqueda}%` } },
              { apellido: { [Op.like]: `%${busqueda}%` } },
              { dni: { [Op.like]: `%${busqueda}%` } }
            ]
          } : {}
        }],
        where: estado ? { estado } : {}
      }],
      order: [['fecha', 'DESC']]
    });

    const pacientesMap = new Map();
    
    for (const evaluacion of evaluaciones) {
      const pacienteId = evaluacion.paciente.id;
      
      if (!pacientesMap.has(pacienteId)) {
        const totalEvaluaciones = evaluaciones.filter(e => e.paciente.id === pacienteId).length;
        
        const internacion = await Internacion.findOne({
          where: {
            paciente_id: pacienteId,
            fecha_alta: null
          },
          include: [{
            model: Cama,
            as: 'cama',
            include: [{
              model: Habitacion,
              as: 'habitacion'
            }]
          }]
        });

        pacientesMap.set(pacienteId, {
          paciente: evaluacion.paciente,
          ultima_evaluacion: evaluacion,
          total_evaluaciones: totalEvaluaciones,
          internacion: internacion
        });
      }
    }

    const pacientes = Array.from(pacientesMap.values());

    const estadisticas = {
      total: pacientes.length,
      internados: pacientes.filter(p => p.internacion).length,
      evaluaciones_total: evaluaciones.length,
      activos: pacientes.filter(p => p.paciente.estado === 'Activo').length
    };

    res.render('dashboard/enfermero/pacientes', {
      title: 'Mis Pacientes',
      user: req.user,
      pacientes,
      estadisticas,
      filtros: { busqueda, fecha_desde, fecha_hasta, estado }
    });

  } catch (error) {
    console.error('Error al listar pacientes:', error);
    res.status(500).render('error', {
      message: 'Error al cargar pacientes',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Ver ficha completa de paciente
exports.verPaciente = async (req, res) => {
  try {
    // ✅ CORRECCIÓN
    const enfermeroId = req.user.id;
    const { id } = req.params;

    const paciente = await Paciente.findByPk(id, {
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['nombre', 'apellido', 'dni', 'fecha_nacimiento', 'sexo', 'telefono', 'email']
        },
        {
          model: ObraSocial,
          as: 'obraSocial',
          required: false
        },
        {
          model: Administrativo,
          as: 'administrativo',
          required: false,
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido']
          }]
        }
      ]
    });

    if (!paciente) {
      return res.status(404).render('error', {
        message: 'Paciente no encontrado'
      });
    }

    const evaluacionPrevia = await EvaluacionEnfermeria.findOne({
      where: {
        paciente_id: id,
        enfermero_id: enfermeroId
      }
    });

    if (!evaluacionPrevia) {
      return res.status(403).render('error', {
        message: 'No tiene acceso a este paciente'
      });
    }

    const evaluaciones = await EvaluacionEnfermeria.findAll({
      where: {
        paciente_id: id,
        enfermero_id: enfermeroId
      },
      order: [['fecha', 'DESC']],
      limit: 10
    });

    const controles = await ControlEnfermeria.findAll({
      include: [{
        model: EvaluacionEnfermeria,
        as: 'evaluacion',
        where: {
          paciente_id: id,
          enfermero_id: enfermeroId
        }
      }],
      order: [['created_at', 'DESC']],
      limit: 5
    });

    const internacion = await Internacion.findOne({
      where: {
        paciente_id: id,
        fecha_alta: null
      },
      include: [{
        model: Cama,
        as: 'cama',
        include: [{
          model: Habitacion,
          as: 'habitacion'
        }]
      }]
    });

    res.render('dashboard/enfermero/pacientes-detalle', {
      title: 'Ficha del Paciente',
      user: req.user,
      paciente,
      evaluaciones,
      controles,
      internacion
    });

  } catch (error) {
    console.error('Error al ver paciente:', error);
    res.status(500).render('error', {
      message: 'Error al cargar el paciente',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Historial completo de evaluaciones
exports.historialEvaluaciones = async (req, res) => {
  try {
    // ✅ CORRECCIÓN
    const enfermeroId = req.user.id;
    const { id } = req.params;

    const paciente = await Paciente.findByPk(id, {
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['nombre', 'apellido', 'dni']
      }]
    });

    if (!paciente) {
      return res.status(404).render('error', {
        message: 'Paciente no encontrado'
      });
    }

    const evaluaciones = await EvaluacionEnfermeria.findAll({
      where: {
        paciente_id: id,
        enfermero_id: enfermeroId
      },
      order: [['fecha', 'DESC']]
    });

    res.render('dashboard/enfermero/pacientes-historial', {
      title: 'Historial de Evaluaciones',
      user: req.user,
      paciente,
      evaluaciones
    });

  } catch (error) {
    console.error('Error al ver historial:', error);
    res.status(500).render('error', {
      message: 'Error al cargar el historial',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Búsqueda rápida de pacientes
exports.busquedaRapida = async (req, res) => {
  try {
    // ✅ CORRECCIÓN
    const enfermeroId = req.user.id;
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json({
        success: false,
        message: 'Ingrese al menos 2 caracteres'
      });
    }

    const evaluaciones = await EvaluacionEnfermeria.findAll({
      where: { enfermero_id: enfermeroId },
      attributes: ['paciente_id'],
      group: ['paciente_id']
    });

    const pacientesIds = evaluaciones.map(e => e.paciente_id);

    const pacientes = await Paciente.findAll({
      where: {
        id: { [Op.in]: pacientesIds }
      },
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['nombre', 'apellido', 'dni'],
        where: {
          [Op.or]: [
            { nombre: { [Op.like]: `%${q}%` } },
            { apellido: { [Op.like]: `%${q}%` } },
            { dni: { [Op.like]: `%${q}%` } }
          ]
        }
      }],
      limit: 10
    });

    res.json({
      success: true,
      pacientes: pacientes.map(p => ({
        id: p.id,
        nombre: `${p.usuario.nombre} ${p.usuario.apellido}`,
        dni: p.usuario.dni,
        estado: p.estado
      }))
    });

  } catch (error) {
    console.error('Error en búsqueda rápida:', error);
    res.status(500).json({
      success: false,
      message: 'Error en la búsqueda'
    });
  }
};

// Obtener resumen de paciente
exports.resumenPaciente = async (req, res) => {
  try {
    // ✅ CORRECCIÓN
    const enfermeroId = req.user.id;
    const { id } = req.params;

    const evaluacionPrevia = await EvaluacionEnfermeria.findOne({
      where: {
        paciente_id: id,
        enfermero_id: enfermeroId
      }
    });

    if (!evaluacionPrevia) {
      return res.status(403).json({
        success: false,
        message: 'No tiene acceso a este paciente'
      });
    }

    const paciente = await Paciente.findByPk(id, {
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['nombre', 'apellido', 'dni', 'fecha_nacimiento', 'sexo']
      }]
    });

    const ultimaEvaluacion = await EvaluacionEnfermeria.findOne({
      where: {
        paciente_id: id,
        enfermero_id: enfermeroId
      },
      order: [['fecha', 'DESC']]
    });

    const ultimoControl = await ControlEnfermeria.findOne({
      include: [{
        model: EvaluacionEnfermeria,
        as: 'evaluacion',
        where: {
          paciente_id: id,
          enfermero_id: enfermeroId
        }
      }],
      order: [['created_at', 'DESC']]
    });

    const internacion = await Internacion.findOne({
      where: {
        paciente_id: id,
        fecha_alta: null
      },
      include: [{
        model: Cama,
        as: 'cama',
        include: [{
          model: Habitacion,
          as: 'habitacion'
        }]
      }]
    });

    res.json({
      success: true,
      paciente: {
        id: paciente.id,
        nombre: `${paciente.usuario.nombre} ${paciente.usuario.apellido}`,
        dni: paciente.usuario.dni,
        edad: Math.floor((new Date() - new Date(paciente.usuario.fecha_nacimiento)) / (1000 * 60 * 60 * 24 * 365)),
        sexo: paciente.usuario.sexo
      },
      ultima_evaluacion: ultimaEvaluacion ? {
        fecha: ultimaEvaluacion.fecha,
        signos_vitales: ultimaEvaluacion.signos_vitales,
        tipo_egreso: ultimaEvaluacion.tipo_egreso
      } : null,
      ultimo_control: ultimoControl ? {
        fecha: ultimoControl.created_at,
        peso: ultimoControl.peso,
        altura: ultimoControl.altura,
        presion_arterial: ultimoControl.presion_arterial
      } : null,
      internacion: internacion ? {
        habitacion: internacion.cama.habitacion.numero,
        cama: internacion.cama.numero,
        fecha_inicio: internacion.fecha_inicio
      } : null
    });

  } catch (error) {
    console.error('Error al obtener resumen:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen'
    });
  }
};

// Estadísticas del enfermero
exports.misEstadisticas = async (req, res) => {
  try {
    // ✅ CORRECCIÓN
    const enfermeroId = req.user.id;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const [
      totalPacientes,
      evaluacionesHoy,
      pacientesInternados,
      controlesRealizados
    ] = await Promise.all([
      EvaluacionEnfermeria.count({
        where: { enfermero_id: enfermeroId },
        distinct: true,
        col: 'paciente_id'
      }),
      
      EvaluacionEnfermeria.count({
        where: {
          enfermero_id: enfermeroId,
          fecha: { [Op.gte]: hoy }
        }
      }),
      
      db.sequelize.query(`
        SELECT COUNT(DISTINCT i.paciente_id) as count
        FROM internaciones i
        INNER JOIN evaluacionesenfermeria ee ON ee.paciente_id = i.paciente_id
        WHERE ee.enfermero_id = ${enfermeroId}
        AND i.fecha_alta IS NULL
      `, { type: db.sequelize.QueryTypes.SELECT }),
      
      db.sequelize.query(`
        SELECT COUNT(*) as count
        FROM controlesenfermeria ce
        INNER JOIN evaluacionesenfermeria ee ON ee.id = ce.evaluacion_enfermeria_id
        WHERE ee.enfermero_id = ${enfermeroId}
      `, { type: db.sequelize.QueryTypes.SELECT })
    ]);

    res.json({
      success: true,
      estadisticas: {
        total_pacientes: totalPacientes,
        evaluaciones_hoy: evaluacionesHoy,
        pacientes_internados: pacientesInternados[0].count,
        controles_realizados: controlesRealizados[0].count
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

module.exports = exports;