const db = require('../../models');
const { Op } = require('sequelize');

/**
 * CONTROLADOR: Lista de Espera del Paciente
 * Visualización y gestión de solicitudes en lista de espera
 */

// GET /paciente/lista-espera - Lista completa
exports.getListaEspera = async (req, res, next) => {
  try {
    const pacienteId = req.user.id; 
    const { estado, prioridad, page = 1 } = req.query;
    const limit = 10;
    const offset = (page - 1) * limit;

    // Obtener paciente
    const paciente = await db.Paciente.findByPk(pacienteId, {  
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

    if (prioridad) {
      whereClause.prioridad = prioridad;
    }

    // Obtener listas de espera
    const { count, rows: listasEspera } = await db.ListaEspera.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: db.TipoTurno,
          as: 'tipo_turno',
          attributes: ['nombre', 'descripcion']
        },
        {
          model: db.Especialidad,
          as: 'especialidad',
          attributes: ['nombre', 'descripcion']
        },
        {
          model: db.TipoEstudio,
          as: 'tipo_estudio',
          attributes: ['nombre', 'categoria', 'requiere_ayuno']
        },
        {
          model: db.Habitacion,
          as: 'habitacion',
          attributes: ['numero', 'tipo']
        },
        {
          model: db.Turno,
          as: 'turno',
          attributes: ['id', 'fecha', 'hora_inicio', 'estado']
        }
      ],
      order: [
        ['estado', 'ASC'], // PENDIENTE primero
        ['prioridad', 'ASC'], // ALTA primero
        ['fecha_registro', 'ASC'] // Más antiguos primero
      ],
      limit,
      offset
    });

    // Calcular estadísticas
    const estadisticas = {
      total: count,
      pendientes: await db.ListaEspera.count({
        where: { paciente_id: paciente.id, estado: 'PENDIENTE' }
      }),
      asignados: await db.ListaEspera.count({
        where: { paciente_id: paciente.id, estado: 'ASIGNADO' }
      }),
      completados: await db.ListaEspera.count({
        where: { paciente_id: paciente.id, estado: 'COMPLETADO' }
      }),
      cancelados: await db.ListaEspera.count({
        where: { paciente_id: paciente.id, estado: 'CANCELADO' }
      }),
      prioridadAlta: await db.ListaEspera.count({
        where: { 
          paciente_id: paciente.id, 
          prioridad: 'ALTA',
          estado: ['PENDIENTE', 'ASIGNADO']
        }
      })
    };

    // Calcular posición en la cola para solicitudes pendientes
    for (let lista of listasEspera) {
      if (lista.estado === 'PENDIENTE') {
        const posicion = await db.ListaEspera.count({
          where: {
            tipo_turno_id: lista.tipo_turno_id,
            estado: 'PENDIENTE',
            [Op.or]: [
              { prioridad: { [Op.lt]: lista.prioridad === 'ALTA' ? 1 : lista.prioridad === 'MEDIA' ? 2 : 3 } },
              {
                prioridad: lista.prioridad,
                fecha_registro: { [Op.lt]: lista.fecha_registro }
              }
            ]
          }
        });
        lista.dataValues.posicionEnCola = posicion + 1;
      }
    }

    const totalPages = Math.ceil(count / limit);

    res.render('dashboard/paciente/lista-espera', {
      title: 'Lista de Espera',
      user: req.user,
      listasEspera,
      estadisticas,
      filtros: { estado, prioridad },
      paginacion: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error al obtener lista de espera:', error);
    next(error);
  }
};

// GET /paciente/lista-espera/:id - Detalle de solicitud
exports.getDetalleSolicitud = async (req, res, next) => {
  try {
    const pacienteId = req.user.id; 
    const solicitudId = req.params.id;

    const paciente = await db.Paciente.findByPk(pacienteId, {  
      attributes: ['id']
    });

    if (!paciente) {
      return res.status(404).render('error', {
        message: 'Paciente no encontrado'
      });
    }

    const solicitud = await db.ListaEspera.findOne({
      where: {
        id: solicitudId,
        paciente_id: paciente.id
      },
      include: [
        {
          model: db.TipoTurno,
          as: 'tipo_turno',
          attributes: ['nombre', 'descripcion', 'requiere_especialidad', 'requiere_estudio']
        },
        {
          model: db.Especialidad,
          as: 'especialidad',
          attributes: ['nombre', 'descripcion']
        },
        {
          model: db.TipoEstudio,
          as: 'tipo_estudio',
          attributes: ['nombre', 'categoria', 'requiere_ayuno']
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
          model: db.Turno,
          as: 'turno',
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
              attributes: ['nombre']
            }
          ]
        }
      ]
    });

    if (!solicitud) {
      return res.status(404).render('error', {
        message: 'Solicitud no encontrada'
      });
    }

    // Calcular posición en cola si está pendiente
    let posicionEnCola = null;
    if (solicitud.estado === 'PENDIENTE') {
      posicionEnCola = await db.ListaEspera.count({
        where: {
          tipo_turno_id: solicitud.tipo_turno_id,
          estado: 'PENDIENTE',
          [Op.or]: [
            { prioridad: { [Op.lt]: solicitud.prioridad === 'ALTA' ? 1 : solicitud.prioridad === 'MEDIA' ? 2 : 3 } },
            {
              prioridad: solicitud.prioridad,
              fecha_registro: { [Op.lt]: solicitud.fecha_registro }
            }
          ]
        }
      }) + 1;
    }

    // Calcular tiempo de espera
    const diasEspera = Math.floor((new Date() - new Date(solicitud.fecha_registro)) / (1000 * 60 * 60 * 24));

    // Verificar si puede cancelar
    const puedeCancelar = ['PENDIENTE', 'ASIGNADO'].includes(solicitud.estado);

    res.render('dashboard/paciente/lista-espera-detalle', {
      title: 'Detalle de Solicitud',
      user: req.user,
      solicitud,
      posicionEnCola,
      diasEspera,
      puedeCancelar
    });

  } catch (error) {
    console.error('Error al obtener detalle de solicitud:', error);
    next(error);
  }
};

// POST /paciente/lista-espera/:id/cancelar - Cancelar solicitud
exports.cancelarSolicitud = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const pacienteId = req.user.id; 
    const solicitudId = req.params.id;
    const { motivo } = req.body;

    const paciente = await db.Paciente.findByPk(pacienteId, {  
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

    const solicitud = await db.ListaEspera.findOne({
      where: {
        id: solicitudId,
        paciente_id: paciente.id
      },
      transaction
    });

    if (!solicitud) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    // Verificar que pueda ser cancelada
    if (!['PENDIENTE', 'ASIGNADO'].includes(solicitud.estado)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Esta solicitud no puede ser cancelada'
      });
    }

    // Si tiene turno asignado, cancelarlo también
    if (solicitud.turno_id) {
      await db.Turno.update({
        estado: 'CANCELADO'
      }, {
        where: { id: solicitud.turno_id },
        transaction
      });
    }

    // Actualizar estado de la solicitud
    await solicitud.update({
      estado: 'CANCELADO'
    }, { transaction });

    // Crear notificación
    await db.Notificacion.create({
      usuario_id: req.user.usuario_id,  // ✅ Para notificaciones usamos usuario_id,
      mensaje: `Has cancelado tu solicitud de turno en lista de espera. ${motivo ? 'Motivo: ' + motivo : ''}`,
      leida: false
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Solicitud cancelada exitosamente'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al cancelar solicitud:', error);
    next(error);
  }
};

// GET /paciente/lista-espera/activas - Solicitudes activas (AJAX)
exports.getSolicitudesActivas = async (req, res, next) => {
  try {
    const pacienteId = req.user.id; 

    const paciente = await db.Paciente.findByPk(pacienteId, {  
      attributes: ['id']
    });

    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    const solicitudesActivas = await db.ListaEspera.findAll({
      where: {
        paciente_id: paciente.id,
        estado: ['PENDIENTE', 'ASIGNADO']
      },
      include: [
        {
          model: db.TipoTurno,
          as: 'tipo_turno',
          attributes: ['nombre']
        },
        {
          model: db.Especialidad,
          as: 'especialidad',
          attributes: ['nombre']
        },
        {
          model: db.TipoEstudio,
          as: 'tipo_estudio',
          attributes: ['nombre']
        }
      ],
      order: [
        ['prioridad', 'ASC'],
        ['fecha_registro', 'ASC']
      ]
    });

    res.json({
      success: true,
      solicitudes: solicitudesActivas,
      total: solicitudesActivas.length
    });

  } catch (error) {
    console.error('Error al obtener solicitudes activas:', error);
    next(error);
  }
};

module.exports = exports;
