// emergenciasController.js
const {
  ListaEspera,
  Paciente,
  Usuario,
  Medico,
  Sector,
  EvaluacionEnfermeria,
  EvaluacionMedica,
  Notificacion,
  Enfermero,
  ObraSocial,
  HistorialMedico,
  Diagnostico,
  Tratamiento
} = require('../../models');
const { Op } = require('sequelize');
const db = require('../../database/db');
const notificacionesService = require('../../services/notificacionesService');
// Listar emergencias
exports.listarEmergencias = async (req, res, next) => {
  try {
    const medicoId = req.user.medico_id;
    
    const emergencias = await EvaluacionEnfermeria.findAll({
      where: {
        medico_id: medicoId,
        tipo_egreso: {
          [Op.in]: ['PENDIENTE_EVALUACION', 'DERIVAR_MEDICO']
        }
      },
      include: [
        {
          model: Paciente,
          as: 'paciente',
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido', 'dni', 'fecha_nacimiento']
          }]
        },
        {
          model: Enfermero,
          as: 'enfermero',
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido']
          }]
        }
      ],
      order: [['fecha', 'DESC']]
    });

    res.render('dashboard/medico/emergencias/index', {
      title: 'Emergencias',
      user: req.user,
      emergencias
    });

  } catch (error) {
    console.error('Error al listar emergencias:', error);
    next(error);
  }
};

// Ver detalle de emergencia
exports.verEmergencia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const medicoId = req.user.medico_id;

    const emergencia = await EvaluacionEnfermeria.findOne({
      where: {
        id,
        medico_id: medicoId
      },
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
          model: Enfermero,
          as: 'enfermero',
          include: [{
            model: Usuario,
            as: 'usuario'
          }]
        }
      ]
    });

    if (!emergencia) {
      return res.status(404).render('error', {
        message: 'Emergencia no encontrada',
        user: req.user
      });
    }

    res.render('dashboard/medico/emergencias/detalle', {
      title: 'Detalle de Emergencia',
      user: req.user,
      emergencia
    });

  } catch (error) {
    console.error('Error al ver emergencia:', error);
    next(error);
  }
};

// Atender emergencia
exports.atenderEmergencia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const medicoId = req.user.medico_id;

    const emergencia = await EvaluacionEnfermeria.findOne({
      where: {
        id,
        medico_id: medicoId
      }
    });

    if (!emergencia) {
      return res.status(404).json({
        success: false,
        message: 'Emergencia no encontrada'
      });
    }

    // Cambiar estado 
    await emergencia.update({
      tipo_egreso: 'ORDEN_MEDICA',
    });

    res.json({
      success: true,
      message: 'Emergencia atendida correctamente'
    });

  } catch (error) {
    console.error('Error al atender emergencia:', error);
    res.status(500).json({
      success: false,
      message: 'Error al atender emergencia'
    });
  }
};


function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return null;
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
}

exports.renderEmergencias = async (req, res, next) => {
  try {
    const medico = await Medico.findOne({
      where: { usuario_id: req.user.usuario_id },
      include: [{ model: Sector, as: 'sector' }]
    });

    if (!medico || medico.sector?.nombre !== 'Emergencias') {
      return res.status(403).render('error', {
        title: 'Acceso Denegado',
        message: 'Solo médicos del sector Emergencias',
        user: req.user
      });
    }
    
    res.render('dashboard/medico/emergencias', {
      title: 'Atención de Emergencias',
      user: req.user,
      medico: medico
    });
  } catch (error) {
    next(error);
  }
};

exports.obtenerEmergencias = async (req, res, next) => {
  try {
    const medico = await Medico.findOne({
      where: { usuario_id: req.user.usuario_id },
      include: [{ model: Sector, as: 'sector' }]
    });

    if (!medico || medico.sector?.nombre !== 'Emergencias') {
      return res.status(403).json({ success: false, message: 'Acceso denegado' });
    }

    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const evaluacionesUrgentes = await EvaluacionEnfermeria.findAll({
      where: { tipo_egreso: 'DERIVACION_URGENCIA' },
      attributes: ['id', 'paciente_id', 'fecha', 'nivel_triaje', 'observaciones'],
      order: [['fecha', 'DESC']]
    });

    if (evaluacionesUrgentes.length === 0) {
      return res.json({
        success: true,
        data: [],
        pagination: { total: 0, page: parseInt(page), totalPages: 0 }
      });
    }

    const pacientesIds = evaluacionesUrgentes.map(ev => ev.paciente_id);

    const { count, rows: emergencias } = await ListaEspera.findAndCountAll({
      where: {
        paciente_id: { [Op.in]: pacientesIds },
        estado: { [Op.in]: ['PENDIENTE', 'ASIGNADO'] },
        tipo_turno_id: {
          [Op.in]: db.sequelize.literal(`(SELECT id FROM tipos_turno WHERE nombre IN ('Urgencia', 'Emergencia'))`)
        }
      },
      include: [
        {
          model: Paciente,
          as: 'paciente',
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['id', 'nombre', 'apellido', 'dni', 'telefono', 'fecha_nacimiento']
          }]
        },
        {
          model: Medico,
          as: 'medico_asignado',
          required: false,
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido']
          }]
        }
      ],
      order: [
        ['estado', 'ASC'],
        ['prioridad', 'DESC'],
        ['fecha_registro', 'ASC']
      ],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const emergenciasConEvaluacion = await Promise.all(
      emergencias.map(async (emergencia) => {
        const evaluacion = await EvaluacionEnfermeria.findOne({
          where: {
            paciente_id: emergencia.paciente_id,
            tipo_egreso: 'DERIVACION_URGENCIA'
          },
          include: [{
            model: Enfermero,
            as: 'enfermero',
            include: [{ model: Usuario, as: 'usuario' }]
          }],
          order: [['fecha', 'DESC']]
        });

        const edad = calcularEdad(emergencia.paciente?.usuario?.fecha_nacimiento);

        return {
          ...emergencia.toJSON(),
          evaluacion_enfermeria: evaluacion,
          medico: emergencia.medico_asignado,
          edad: edad
        };
      })
    );

    res.json({
      success: true,
      data: emergenciasConEvaluacion,
      pagination: {
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error:', error);
    next(error);
  }
};

exports.verificarEmergenciasPendientes = async (req, res, next) => {
  try {
    // Si no está autenticado, detener aquí
    if (!req.user || req.user.nombre === 'Guest') {
      return res.json({ success: true, hay_pendientes: false, count: 0 });
    }

    console.log('🔍 Buscando emergencias para médico:', req.user.usuario_id);

    // Buscar evaluaciones con tipo_egreso = 'DERIVACION_URGENCIA'
    const emergencias = await EvaluacionEnfermeria.findAll({
      where: { 
        tipo_egreso: 'DERIVACION_URGENCIA',
        estado: 'Pendiente'
      },
      include: [{
        model: Paciente,
        as: 'paciente',
        include: [{ model: Usuario, as: 'usuario' }]
      }],
      limit: 10
    });

    console.log('📊 Emergencias encontradas:', emergencias.length);
    console.log('🚨 Datos:', emergencias.map(e => ({
      id: e.id,
      paciente: e.paciente?.usuario?.nombre,
      tipo_egreso: e.tipo_egreso,
      estado: e.estado
    })));

    res.json({
      success: true,
      hay_pendientes: emergencias.length > 0,
      count: emergencias.length,
      data: emergencias
    });

  } catch (error) {
    console.error('❌ Error verificando emergencias:', error.message);
    res.json({ success: false, hay_pendientes: false, count: 0 });
  }
};

exports.verificarCirugiasPendientes = async (req, res, next) => {
  try {
    console.log('🔪 Verificando cirugías pendientes...');
    
    const resultado = await notificacionesService.verificarCirugiasPendientes(
      req.user.medico_id,
      req.user.usuario_id
    );

    res.json({
      success: resultado.success,
      hay_pendientes: resultado.hay_pendientes,
      count: resultado.sin_asignar || resultado.count || 0
    });

  } catch (error) {
    console.error('❌ Error al verificar cirugías:', error);
    res.json({
      success: false,
      hay_pendientes: false,
      count: 0
    });
  }
};

exports.aceptarEmergencia = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();

  try {
    const medico = await Medico.findOne({
      where: { usuario_id: req.user.usuario_id },
      include: [{ model: Sector, as: 'sector' }],
      transaction
    });

    if (!medico || medico.sector?.nombre !== 'Emergencias') {
      await transaction.rollback();
      return res.status(403).json({ success: false, message: 'Acceso denegado' });
    }

    const listaEspera = await ListaEspera.findOne({
      where: { id: req.params.id, estado: 'PENDIENTE' },
      include: [{
        model: Paciente,
        as: 'paciente',
        include: [{ model: Usuario, as: 'usuario' }]
      }],
      transaction
    });

    if (!listaEspera) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Emergencia no encontrada o ya fue aceptada' });
    }

    // Actualizar lista de espera
    await listaEspera.update({ 
      estado: 'ASIGNADO',
      tipo_egreso: 'DERIVACION_MEDICO',
      medico_id: medico.id,
      fecha_asignacion: new Date()
    }, { transaction });

    // Actualizar también la EvaluacionEnfermeria
    // para que el polling deje de encontrarla
    const evaluacionEnfermeria = await EvaluacionEnfermeria.findOne({
      where: { 
        paciente_id: listaEspera.paciente_id,
        tipo_egreso: 'DERIVACION_URGENCIA',
        estado: 'Pendiente'  // solo la que sigue pendiente
      },
      include: [{
        model: Enfermero,
        as: 'enfermero',
        include: [{ model: Usuario, as: 'usuario' }]
      }],
      order: [['fecha', 'DESC']],
      transaction
    });

    if (evaluacionEnfermeria) {
      // Cambiar estado para que el polling no la encuentre más
      await evaluacionEnfermeria.update({
        estado: 'Atendido',
        tipo_egreso: 'ORDEN_MEDICA',
        medico_id: medico.id
      }, { transaction });

      // Notificar al enfermero si existe
      if (evaluacionEnfermeria.enfermero?.usuario) {
        await Notificacion.create({
          usuario_id: evaluacionEnfermeria.enfermero.usuario.id,
          remitente_id: req.user.usuario_id,
          mensaje: `El Dr. ${req.user.nombre} ${req.user.apellido} aceptó atender a ${listaEspera.paciente.usuario.nombre} ${listaEspera.paciente.usuario.apellido}`,
          leida: false,
          tipo: 'EMERGENCIA_ACEPTADA'
        }, { transaction });
      }
    }

    await transaction.commit();

    res.json({
      success: true,
      message: 'Paciente aceptado correctamente',
      data: listaEspera
    });

  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

exports.obtenerEmergenciaPorId = async (req, res, next) => {
  try {
    const medico = await Medico.findOne({
      where: { usuario_id: req.user.usuario_id },
      include: [{ model: Sector, as: 'sector' }]
    });

    if (!medico || medico.sector?.nombre !== 'Emergencias') {
      return res.status(403).json({ success: false, message: 'Acceso denegado' });
    }

    const emergencia = await ListaEspera.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Paciente,
          as: 'paciente',
          include: [
            {
              model: Usuario,
              as: 'usuario',
              attributes: { exclude: ['password'] }
            },
            {
              model: ObraSocial,
              as: 'obraSocial',
              attributes: ['id', 'nombre'],
              required: false
            }
          ]
        },
        {
          model: Medico,
          as: 'medico_asignado',
          required: false,
          include: [{ model: Usuario, as: 'usuario' }]
        }
      ]
    });

    if (!emergencia) {
      return res.status(404).json({ success: false, message: 'Emergencia no encontrada' });
    }

    const evaluacionEnfermeria = await EvaluacionEnfermeria.findOne({
      where: {
        paciente_id: emergencia.paciente_id,
        tipo_egreso: 'DERIVACION_URGENCIA'
      },
      include: [{
        model: Enfermero,
        as: 'enfermero',
        include: [{
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nombre', 'apellido']
        }]
      }],
      order: [['fecha', 'DESC']],
      limit: 1
    });

    const edad = calcularEdad(emergencia.paciente?.usuario?.fecha_nacimiento);

    res.json({
      success: true,
      data: {
        ...emergencia.toJSON(),
        evaluacion_enfermeria: evaluacionEnfermeria,
        medico: emergencia.medico_asignado,
        edad
      }
    });

  } catch (error) {
    console.error('Error:', error);
    next(error);
  }
};

exports.completarEmergencia = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();

  try {
    const medico = await Medico.findOne({
      where: { usuario_id: req.user.usuario_id },
      include: [{ model: Sector, as: 'sector' }],
      transaction
    });

    if (!medico || medico.sector?.nombre !== 'Emergencias') {
      await transaction.rollback();
      return res.status(403).json({ success: false, message: 'Acceso denegado' });
    }

    const listaEspera = await ListaEspera.findOne({
      where: {
        id: req.params.id,
        estado: 'ASIGNADO',
        medico_id: medico.id
      },
      transaction
    });

    if (!listaEspera) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Emergencia no encontrada' });
    }

    await listaEspera.update({ 
      estado: 'COMPLETADO',
      fecha_completado: new Date()
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Atención completada',
      data: listaEspera
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

exports.crearEvaluacionMedica = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();

  try {
    const medico = await Medico.findOne({
      where: { usuario_id: req.user.usuario_id },
      transaction
    });

    if (!medico) {
      await transaction.rollback();
      return res.status(403).json({ success: false, message: 'Médico no encontrado' });
    }

    const { lista_espera_id, diagnostico, observaciones, tratamiento_id } = req.body;

    const listaEspera = await ListaEspera.findOne({
      where: {
        id: lista_espera_id,
        estado: 'ASIGNADO',
        medico_id: medico.id
      },
      transaction
    });

    if (!listaEspera) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Paciente no asignado' });
    }

    const evaluacion = await EvaluacionMedica.create({
      paciente_id: listaEspera.paciente_id,
      medico_id: medico.id,
      fecha: new Date(),
      diagnostico_id: diagnostico,
      observaciones_diagnostico: observaciones,
      tratamiento_id: tratamiento_id
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Evaluación registrada',
      data: evaluacion
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * Endpoint API para verificar emergencias pendientes
 * Utiliza el servicio de notificaciones
 * 
 * @route GET /medico/emergencias/api/verificar-pendientes
 * @access Médico autenticado
 */
exports.verificarPendientes = async (req, res, next) => {
  try {
    // Verificar que el usuario tenga el rol de médico
    if (!req.user.medico_id) {
      return res.status(403).json({
        success: false,
        message: 'Usuario no autorizado'
      });
    }

    console.log(` Verificando emergencias para médico: ${req.user.medico_id}`);

    // Usar el servicio de notificaciones
    const resultado = await notificacionesService.verificarEmergenciasPendientes(req.user.medico_id);

    console.log(` Resultado: ${resultado.count} emergencias pendientes`);

    res.json(resultado);

  } catch (error) {
    console.error('❌ Error en verificarPendientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar emergencias pendientes',
      error: error.message
    });
  }
};

module.exports = exports;