const db = require('../../models');
const { Op } = require('sequelize');

/**
 * CONTROLADOR: Gestión de Turnos del Paciente
 * Visualización y gestión de turnos propios
 */

// GET /paciente/turnos - Lista de todos los turnos
exports.getTurnos = async (req, res, next) => {
  try {
    const pacienteId = req.user.id;  //  ID directo del paciente
    const { estado, desde, hasta, page = 1 } = req.query;
    const limit = 10;
    const offset = (page - 1) * limit;

    // Obtener paciente
    const paciente = await db.Paciente.findByPk(pacienteId, {  // Buscar directo por PK
      attributes: ['id']
    });

    if (!paciente) {
      return res.status(404).render('error', {
        message: 'Paciente no encontrado'
      });
    }

    // Construir filtros
    const whereClause = { paciente_id: paciente.id };

    if (estado) {
      whereClause.estado = estado;
    }

    if (desde || hasta) {
      whereClause.fecha = {};
      if (desde) whereClause.fecha[Op.gte] = desde;
      if (hasta) whereClause.fecha[Op.lte] = hasta;
    }

    // Obtener turnos con paginación
    const { count, rows: turnos } = await db.Turno.findAndCountAll({
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
          model: db.Sector,
          as: 'sector',
          attributes: ['nombre', 'descripcion']
        },
        {
          model: db.TipoEstudio,
          as: 'tipo_estudio',
          attributes: ['nombre', 'categoria']
        }
      ],
      order: [['fecha', 'DESC'], ['hora_inicio', 'DESC']],
      limit,
      offset
    });

    // Calcular estadísticas
    const estadisticas = {
      total: count,
      pendientes: await db.Turno.count({
        where: { paciente_id: paciente.id, estado: 'PENDIENTE' }
      }),
      confirmados: await db.Turno.count({
        where: { paciente_id: paciente.id, estado: 'CONFIRMADO' }
      }),
      completados: await db.Turno.count({
        where: { paciente_id: paciente.id, estado: 'COMPLETADO' }
      }),
      cancelados: await db.Turno.count({
        where: { paciente_id: paciente.id, estado: 'CANCELADO' }
      })
    };

    // Próximo turno
    const proximoTurno = await db.Turno.findOne({
      where: {
        paciente_id: paciente.id,
        estado: ['CONFIRMADO', 'PENDIENTE'],
        fecha: { [Op.gte]: new Date() }
      },
      include: [
        {
          model: db.Medico,
          as: 'medico',
          include: [
            { model: db.Usuario, as: 'usuario', attributes: ['nombre', 'apellido'] },
            { model: db.Especialidad, as: 'especialidad', attributes: ['nombre'] }
          ]
        },
        { model: db.Sector, as: 'sector', attributes: ['nombre'] }
      ],
      order: [['fecha', 'ASC'], ['hora_inicio', 'ASC']]
    });

    const totalPages = Math.ceil(count / limit);

    res.render('dashboard/paciente/turnos', {
      title: 'Mis Turnos',
      user: req.user,
      turnos,
      estadisticas,
      proximoTurno,
      filtros: { estado, desde, hasta },
      paginacion: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error al obtener turnos:', error);
    next(error);
  }
};

// GET /paciente/turnos/:id - Detalle de un turno
exports.getDetalleTurno = async (req, res, next) => {
  try {
    const pacienteId = req.user.id;  // ✅ ID directo del paciente
    const turnoId = req.params.id;

    const paciente = await db.Paciente.findByPk(pacienteId, {  // ✅ Buscar directo por PK
      attributes: ['id']
    });

    if (!paciente) {
      return res.status(404).render('error', {
        message: 'Paciente no encontrado'
      });
    }

    const turno = await db.Turno.findOne({
      where: {
        id: turnoId,
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
              attributes: ['nombre', 'apellido', 'telefono', 'email']
            },
            {
              model: db.Especialidad,
              as: 'especialidad',
              attributes: ['nombre', 'descripcion']
            }
          ]
        },
        {
          model: db.Sector,
          as: 'sector',
          attributes: ['nombre', 'descripcion']
        },
        {
          model: db.TipoEstudio,
          as: 'tipo_estudio',
          attributes: ['nombre', 'categoria', 'requiere_ayuno']
        },
        {
          model: db.Admision,
          as: 'admision',
          include: [
            {
              model: db.MotivoAdmision,
              as: 'motivo',
              attributes: ['nombre']
            }
          ]
        },
        {
          model: db.EvaluacionMedica,
          as: 'evaluacion_medica',
          include: [
            {
              model: db.Diagnostico,
              as: 'diagnostico',
              attributes: ['nombre', 'codigo']
            }
          ]
        }
      ]
    });

    if (!turno) {
      return res.status(404).render('error', {
        message: 'Turno no encontrado'
      });
    }

    // Verificar si puede cancelar (solo si está pendiente o confirmado y es futuro)
    const hoy = new Date();
    const fechaTurno = new Date(turno.fecha);
    const puedeModificar = ['PENDIENTE', 'CONFIRMADO'].includes(turno.estado) && 
                           fechaTurno > hoy;

    res.render('dashboard/paciente/turno-detalle', {
      title: 'Detalle del Turno',
      user: req.user,
      turno,
      puedeModificar
    });

  } catch (error) {
    console.error('Error al obtener detalle del turno:', error);
    next(error);
  }
};

// POST /paciente/turnos/:id/cancelar - Cancelar un turno
exports.cancelarTurno = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const pacienteId = req.user.id;  // ✅ ID directo del paciente
    const turnoId = req.params.id;
    const { motivo } = req.body;

    const paciente = await db.Paciente.findByPk(pacienteId, {  // ✅ Buscar directo por PK
      attributes: ['id'],
      transaction
    });

    if (!paciente) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    const turno = await db.Turno.findOne({
      where: {
        id: turnoId,
        paciente_id: paciente.id
      },
      transaction
    });

    if (!turno) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Turno no encontrado'
      });
    }

    // Verificar que el turno pueda ser cancelado
    if (!['PENDIENTE', 'CONFIRMADO'].includes(turno.estado)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Este turno no puede ser cancelado'
      });
    }

    // Verificar que sea un turno futuro
    const hoy = new Date();
    const fechaTurno = new Date(turno.fecha);
    if (fechaTurno <= hoy) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'No se pueden cancelar turnos pasados o del día actual'
      });
    }

    // Actualizar estado del turno
    await turno.update({
      estado: 'CANCELADO'
    }, { transaction });

    // Si hay lista de espera asociada, actualizarla
    const listaEspera = await db.ListaEspera.findOne({
      where: { turno_id: turnoId },
      transaction
    });

    if (listaEspera) {
      await listaEspera.update({
        estado: 'CANCELADO',
        turno_id: null
      }, { transaction });
    }

    // Crear notificación
    await db.Notificacion.create({
      usuario_id: req.user.usuario_id,  // ✅ Para notificaciones usamos usuario_id,
      mensaje: `Has cancelado tu turno del ${new Date(turno.fecha).toLocaleDateString('es-AR')} a las ${turno.hora_inicio}. ${motivo ? 'Motivo: ' + motivo : ''}`,
      leida: false
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Turno cancelado exitosamente'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al cancelar turno:', error);
    next(error);
  }
};

// POST /paciente/turnos/:id/confirmar - Confirmar un turno
exports.confirmarTurno = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const pacienteId = req.user.id;  // ✅ ID directo del paciente
    const turnoId = req.params.id;

    const paciente = await db.Paciente.findByPk(pacienteId, {  // ✅ Buscar directo por PK
      attributes: ['id'],
      transaction
    });

    if (!paciente) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    const turno = await db.Turno.findOne({
      where: {
        id: turnoId,
        paciente_id: paciente.id
      },
      transaction
    });

    if (!turno) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Turno no encontrado'
      });
    }

    // Verificar que el turno esté pendiente
    if (turno.estado !== 'PENDIENTE') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Este turno no puede ser confirmado'
      });
    }

    // Actualizar estado del turno
    await turno.update({
      estado: 'CONFIRMADO'
    }, { transaction });

    // Crear notificación
    await db.Notificacion.create({
      usuario_id: req.user.usuario_id, // ✅ Para notificaciones usamos usuario_id,
      mensaje: `Has confirmado tu turno del ${new Date(turno.fecha).toLocaleDateString('es-AR')} a las ${turno.hora_inicio}`,
      leida: false
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Turno confirmado exitosamente'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al confirmar turno:', error);
    next(error);
  }
};

// GET /paciente/turnos/proximos - Obtener próximos turnos (AJAX)
exports.getProximosTurnos = async (req, res, next) => {
  try {
    const pacienteId = req.user.id;  // ✅ ID directo del paciente
    const { limit = 5 } = req.query;

    const paciente = await db.Paciente.findByPk(pacienteId, {  // ✅ Buscar directo por PK
      attributes: ['id']
    });

    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    const turnos = await db.Turno.findAll({
      where: {
        paciente_id: paciente.id,
        estado: ['CONFIRMADO', 'PENDIENTE'],
        fecha: { [Op.gte]: new Date() }
      },
      include: [
        {
          model: db.Medico,
          as: 'medico',
          include: [
            { model: db.Usuario, as: 'usuario', attributes: ['nombre', 'apellido'] },
            { model: db.Especialidad, as: 'especialidad', attributes: ['nombre'] }
          ]
        },
        { model: db.Sector, as: 'sector', attributes: ['nombre'] },
        { model: db.TipoEstudio, as: 'tipo_estudio', attributes: ['nombre'] }
      ],
      order: [['fecha', 'ASC'], ['hora_inicio', 'ASC']],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      turnos
    });

  } catch (error) {
    console.error('Error al obtener próximos turnos:', error);
    next(error);
  }
};

module.exports = exports;