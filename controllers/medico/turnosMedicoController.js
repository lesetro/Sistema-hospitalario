const { 
  Turno, 
  Paciente, 
  Usuario, 
  Medico,
  Sector,
  TipoEstudio,
  EvaluacionMedica,
  Notificacion
} = require('../../models');
const { Op } = require('sequelize');
const db = require('../../database/db');

// ========================================
// RENDERIZAR VISTA DE TURNOS
// ========================================
exports.renderMisTurnos = async (req, res, next) => {
  try {
    console.log('🔍 renderMisTurnos - usuario_id:', req.user.usuario_id);
    
    const usuario = await Usuario.findByPk(req.user.usuario_id, {
      include: [
        {
          model: Medico,
          as: 'medico',
          include: [
            { model: require('../../models').Especialidad, as: 'especialidad' }
          ]
        }
      ]
    });

    if (!usuario || !usuario.medico) {
      console.error('❌ Usuario o Medico no encontrado');
      return res.status(404).render('error', {
        title: 'Error',
        message: 'No tienes permisos de médico'
      });
    }

    console.log('✅ Renderizando vista de turnos...');
    
    res.render('dashboard/medico/turnos', {
      title: 'Mis Turnos',
      user: {
        ...usuario.toJSON(),
        especialidad: usuario.medico?.especialidad?.nombre
      }
    });
  } catch (error) {
    console.error('❌ Error al renderizar turnos:', error);
    next(error);
  }
};

// ========================================
// OBTENER TURNOS FILTRADOS
// ========================================
exports.obtenerTurnos = async (req, res, next) => {
  try {
    console.log('📅 obtenerTurnos - usuario_id:', req.user.usuario_id);
    
    
    const medico = await Medico.findOne({
      where: { usuario_id: req.user.usuario_id }
    });

    if (!medico) {
      console.error('❌ Médico no encontrado');
      return res.status(404).json({ 
        success: false,
        message: 'Médico no encontrado' 
      });
    }

    console.log('✅ Médico encontrado:', medico.id);

    const { fecha, estado, paciente, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Construir filtros
    const whereClause = { medico_id: medico.id };

    if (fecha) {
      whereClause.fecha = fecha;
      console.log('🔍 Filtrando por fecha:', fecha);
    }

    if (estado && estado !== 'TODOS') {
      whereClause.estado = estado;
      console.log('🔍 Filtrando por estado:', estado);
    }

    const includeClause = [
      {
        model: Paciente,
        as: 'paciente',
        include: [
          {
            model: Usuario,
            as: 'usuario',
            attributes: ['id', 'nombre', 'apellido', 'dni', 'telefono', 'email'],
            where: paciente ? {
              [Op.or]: [
                { nombre: { [Op.like]: `%${paciente}%` } },
                { apellido: { [Op.like]: `%${paciente}%` } },
                { dni: { [Op.like]: `%${paciente}%` } }
              ]
            } : undefined
          }
        ]
      },
      {
        model: Sector,
        as: 'sector',
        attributes: ['id', 'nombre']
      },
      {
        model: TipoEstudio,
        as: 'tipo_estudio',
        attributes: ['id', 'nombre'],
        required: false
      },
      {
        model: EvaluacionMedica,
        as: 'evaluacion_medica',
        attributes: ['id'],
        required: false
      }
    ];

    console.log('🔍 Buscando turnos...');
    const { count, rows: turnos } = await Turno.findAndCountAll({
      where: whereClause,
      include: includeClause,
      order: [
        ['fecha', 'DESC'],
        ['hora_inicio', 'ASC']
      ],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    console.log('✅ Turnos encontrados:', count);

    res.json({
      success: true,
      data: turnos,
      pagination: {
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener turnos:', error.message);
    next(error);
  }
};

// ========================================
// OBTENER TURNO POR ID
// ========================================
exports.obtenerTurnoPorId = async (req, res, next) => {
  try {
    console.log('🔍 obtenerTurnoPorId - usuario_id:', req.user.usuario_id);
    
    
    const medico = await Medico.findOne({
      where: { usuario_id: req.user.usuario_id }
    });

    if (!medico) {
      console.error('❌ Médico no encontrado');
      return res.status(404).json({ 
        success: false,
        message: 'Médico no encontrado' 
      });
    }

    const turno = await Turno.findOne({
      where: {
        id: req.params.id,
        medico_id: medico.id
      },
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
              model: require('../../models').ObraSocial,
              as: 'obraSocial',
              attributes: ['id', 'nombre']
            }
          ]
        },
        {
          model: Sector,
          as: 'sector'
        },
        {
          model: TipoEstudio,
          as: 'tipo_estudio',
          required: false
        },
        {
          model: EvaluacionMedica,
          as: 'evaluacion_medica',
          required: false
        }
      ]
    });

    if (!turno) {
      console.error('❌ Turno no encontrado');
      return res.status(404).json({ 
        success: false,
        message: 'Turno no encontrado' 
      });
    }

    console.log('✅ Turno encontrado:', turno.id);

    res.json({
      success: true,
      data: turno
    });
  } catch (error) {
    console.error('❌ Error al obtener turno:', error.message);
    next(error);
  }
};

// ========================================
// CONFIRMAR TURNO
// ========================================
exports.confirmarTurno = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();

  try {
    console.log('✅ confirmarTurno - usuario_id:', req.user.usuario_id);
    
    
    const medico = await Medico.findOne({
      where: { usuario_id: req.user.usuario_id }
    });

    if (!medico) {
      await transaction.rollback();
      console.error('❌ Médico no encontrado');
      return res.status(404).json({ 
        success: false,
        message: 'Médico no encontrado' 
      });
    }

    const turno = await Turno.findOne({
      where: {
        id: req.params.id,
        medico_id: medico.id,
        estado: 'PENDIENTE'
      },
      transaction
    });

    if (!turno) {
      await transaction.rollback();
      console.error('❌ Turno no encontrado o no está pendiente');
      return res.status(404).json({ 
        success: false,
        message: 'Turno no encontrado o no está pendiente' 
      });
    }

    await turno.update({ estado: 'CONFIRMADO' }, { transaction });
    console.log('✅ Turno actualizado a CONFIRMADO');

    // Crear notificación al paciente
    if (turno.paciente_id) {
      const paciente = await Paciente.findByPk(turno.paciente_id, { transaction });
      if (paciente) {
        await Notificacion.create({
          usuario_id: paciente.usuario_id,
          mensaje: `Su turno para el ${turno.fecha} a las ${turno.hora_inicio} ha sido confirmado`,
          leida: false
        }, { transaction });
        console.log('✅ Notificación creada');
      }
    }

    await transaction.commit();

    res.json({
      success: true,
      message: 'Turno confirmado correctamente',
      data: turno
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al confirmar turno:', error.message);
    next(error);
  }
};

// ========================================
// CANCELAR TURNO
// ========================================
exports.cancelarTurno = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();

  try {
    console.log('❌ cancelarTurno - usuario_id:', req.user.usuario_id);
    
    
    const medico = await Medico.findOne({
      where: { usuario_id: req.user.usuario_id }
    });

    if (!medico) {
      await transaction.rollback();
      console.error('❌ Médico no encontrado');
      return res.status(404).json({ 
        success: false,
        message: 'Médico no encontrado' 
      });
    }

    const { motivo } = req.body;

    if (!motivo) {
      await transaction.rollback();
      console.error('❌ Motivo no proporcionado');
      return res.status(400).json({ 
        success: false,
        message: 'Debe proporcionar un motivo de cancelación' 
      });
    }

    const turno = await Turno.findOne({
      where: {
        id: req.params.id,
        medico_id: medico.id,
        estado: { [Op.in]: ['PENDIENTE', 'CONFIRMADO'] }
      },
      transaction
    });

    if (!turno) {
      await transaction.rollback();
      console.error('❌ Turno no encontrado');
      return res.status(404).json({ 
        success: false,
        message: 'Turno no encontrado o ya está completado/cancelado' 
      });
    }

    await turno.update({ estado: 'CANCELADO' }, { transaction });
    console.log('✅ Turno cancelado');

    // Crear notificación al paciente
    if (turno.paciente_id) {
      const paciente = await Paciente.findByPk(turno.paciente_id, { transaction });
      if (paciente) {
        await Notificacion.create({
          usuario_id: paciente.usuario_id,
          mensaje: `Su turno para el ${turno.fecha} ha sido cancelado. Motivo: ${motivo}`,
          leida: false
        }, { transaction });
        console.log('✅ Notificación de cancelación creada');
      }
    }

    await transaction.commit();

    res.json({
      success: true,
      message: 'Turno cancelado correctamente'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al cancelar turno:', error.message);
    next(error);
  }
};

// ========================================
// COMPLETAR TURNO
// ========================================
exports.completarTurno = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();

  try {
    console.log('✅ completarTurno - usuario_id:', req.user.usuario_id);
    
    
    const medico = await Medico.findOne({
      where: { usuario_id: req.user.usuario_id }
    });

    if (!medico) {
      await transaction.rollback();
      console.error('❌ Médico no encontrado');
      return res.status(404).json({ 
        success: false,
        message: 'Médico no encontrado' 
      });
    }

    const turno = await Turno.findOne({
      where: {
        id: req.params.id,
        medico_id: medico.id,
        estado: 'CONFIRMADO'
      },
      transaction
    });

    if (!turno) {
      await transaction.rollback();
      console.error('❌ Turno no encontrado o no está confirmado');
      return res.status(404).json({ 
        success: false,
        message: 'Turno no encontrado o no está confirmado' 
      });
    }

    await turno.update({ 
      estado: 'COMPLETADO',
      hora_fin: new Date()
    }, { transaction });

    console.log('✅ Turno completado');

    await transaction.commit();

    res.json({
      success: true,
      message: 'Turno completado correctamente',
      data: turno
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al completar turno:', error.message);
    next(error);
  }
};

// ========================================
// OBTENER ESTADÍSTICAS DE TURNOS
// ========================================
exports.obtenerEstadisticasTurnos = async (req, res, next) => {
  try {
    console.log('📊 obtenerEstadisticasTurnos - usuario_id:', req.user.usuario_id);
    
    const medico = await Medico.findOne({
      where: { usuario_id: req.user.usuario_id }
    });

    if (!medico) {
      console.error('❌ Médico no encontrado');
      return res.status(404).json({ 
        success: false,
        message: 'Médico no encontrado' 
      });
    }

    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    console.log('🔍 Obteniendo turnos del mes...');
    
    // filtro para tomar los turnos del mes actual
    // lo comento para despues utilizarlo como tengo pocos datos no pondre este filtro y asi se ven todos los turnos
    // const turnos = await Turno.findAll({
    //   where: {
    //     medico_id: medico.id,
    //     fecha: {
    //       [Op.gte]: inicioMes
    //     }
    //   },
    //   attributes: ['estado'],
    //   raw: true
    // });
       const turnos = await Turno.findAll({
        where: { medico_id: medico.id },  // SOLO médico
        attributes: ['estado', 'medico_id', 'fecha'],  // agrega estos para debug
        raw: true,
        limit: 5  // solo 5 para ver
      });

    

    console.log('✅ Turnos obtenidos:', turnos.length);

    //  Agrupar manualmente en JavaScript (como hace pacientes)
    const result = {
      PENDIENTE: 0,
      CONFIRMADO: 0,
      COMPLETADO: 0,
      CANCELADO: 0
    };

    turnos.forEach(turno => {
      if (result.hasOwnProperty(turno.estado)) {
        result[turno.estado]++;
      }
    });

    console.log('✅ Estadísticas calculadas:', result);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error.message);
    next(error);
  }
};