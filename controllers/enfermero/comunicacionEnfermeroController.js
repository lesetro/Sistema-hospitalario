const { Notificacion, 
    Usuario, 
    Enfermero, 
    Medico, 
    Administrativo } = require('../../models');
const { Op } = require('sequelize');
const db = require('../../database/db');

// Listar notificaciones/mensajes
exports.listarComunicaciones = async (req, res, next) => {
  try {
    // usar req.user.usuario_id para notificaciones
    const usuarioId = req.user.usuario_id;
    const { tipo, leida } = req.query;

    const whereCondition = {
      usuario_id: usuarioId
    };

    if (leida) {
      whereCondition.leida = leida === 'true';
    }

    const notificaciones = await Notificacion.findAll({
      where: whereCondition,
      order: [['created_at', 'DESC']],
      limit: 100
    });

    // Estadísticas
    const estadisticas = {
      total: notificaciones.length,
      no_leidas: notificaciones.filter(n => !n.leida).length,
      leidas: notificaciones.filter(n => n.leida).length,
      hoy: notificaciones.filter(n => {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fechaNotif = new Date(n.created_at);
        fechaNotif.setHours(0, 0, 0, 0);
        return fechaNotif.getTime() === hoy.getTime();
      }).length
    };

    res.render('dashboard/enfermero/comunicaciones', {
      title: 'Comunicaciones',
      user: req.user,
      notificaciones,
      estadisticas,
      filtros: { tipo, leida }
    });

  } catch (error) {
    console.error('Error al listar comunicaciones:', error);
    next(error);
  }
};

// Marcar notificación como leída
exports.marcarLeida = async (req, res, next) => {
  try {
    const { id } = req.params;
   
    const usuarioId = req.user.usuario_id;

    const notificacion = await Notificacion.findOne({
      where: {
        id,
        usuario_id: usuarioId
      }
    });

    if (!notificacion) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }

    await notificacion.update({ leida: true });

    res.json({
      success: true,
      message: 'Notificación marcada como leída'
    });

  } catch (error) {
    console.error('Error al marcar como leída:', error);
    next(error);
  }
};

// Marcar todas como leídas
exports.marcarTodasLeidas = async (req, res, next) => {
  try {
    
    const usuarioId = req.user.usuario_id;

    await Notificacion.update(
      { leida: true },
      {
        where: {
          usuario_id: usuarioId,
          leida: false
        }
      }
    );

    res.json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas'
    });

  } catch (error) {
    console.error('Error al marcar todas como leídas:', error);
    next(error);
  }
};

// Eliminar notificación
exports.eliminarNotificacion = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const usuarioId = req.user.usuario_id;

    const notificacion = await Notificacion.findOne({
      where: {
        id,
        usuario_id: usuarioId
      }
    });

    if (!notificacion) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }

    await notificacion.destroy();

    res.json({
      success: true,
      message: 'Notificación eliminada'
    });

  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    next(error);
  }
};

// Obtener notificaciones no leídas (para badge en header)
exports.contadorNoLeidas = async (req, res, next) => {
  try {
   
    const usuarioId = req.user.usuario_id;

    const count = await Notificacion.count({
      where: {
        usuario_id: usuarioId,
        leida: false
      }
    });

    res.json({
      success: true,
      count
    });

  } catch (error) {
    console.error('Error al contar no leídas:', error);
    next(error);
  }
};

// Obtener últimas notificaciones (para dropdown en header)
exports.ultimasNotificaciones = async (req, res, next) => {
  try {
   
    const usuarioId = req.user.usuario_id;

    const notificaciones = await Notificacion.findAll({
      where: {
        usuario_id: usuarioId
      },
      order: [['created_at', 'DESC']],
      limit: 5
    });

    res.json({
      success: true,
      notificaciones: notificaciones.map(n => ({
        id: n.id,
        mensaje: n.mensaje,
        leida: n.leida,
        fecha: n.created_at
      }))
    });

  } catch (error) {
    console.error('Error al obtener últimas notificaciones:', error);
    next(error);
  }
};

// Crear mensaje interno (comunicación entre personal)
exports.enviarMensajeInterno = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const remitente = req.user;
    const { destinatario_tipo, destinatario_id, mensaje } = req.body;

    if (!destinatario_tipo || !destinatario_id || !mensaje) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }

    // Obtener usuario destinatario según tipo
    let usuarioDestinatario;
    
    switch (destinatario_tipo) {
      case 'medico':
        const medico = await Medico.findByPk(destinatario_id, {
          include: [{
            model: Usuario,
            as: 'usuario'
          }],
          transaction
        });
        usuarioDestinatario = medico ? medico.usuario : null;
        break;
      
      case 'enfermero':
        const enfermero = await Enfermero.findByPk(destinatario_id, {
          include: [{
            model: Usuario,
            as: 'usuario'
          }],
          transaction
        });
        usuarioDestinatario = enfermero ? enfermero.usuario : null;
        break;
      
      case 'administrativo':
        const administrativo = await Administrativo.findByPk(destinatario_id, {
          include: [{
            model: Usuario,
            as: 'usuario'
          }],
          transaction
        });
        usuarioDestinatario = administrativo ? administrativo.usuario : null;
        break;
      
      default:
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Tipo de destinatario no válido'
        });
    }

    if (!usuarioDestinatario) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Destinatario no encontrado'
      });
    }

    // Crear notificación para el destinatario
    await Notificacion.create({
      usuario_id: usuarioDestinatario.id,
      mensaje: `Mensaje de ${remitente.nombre} ${remitente.apellido}: ${mensaje}`,
      leida: false
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Mensaje enviado correctamente'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al enviar mensaje:', error);
    next(error);
  }
};

// Buscar personal para enviar mensaje
exports.buscarPersonal = async (req, res, next) => {
  try {
    const { busqueda, tipo } = req.query;

    if (!busqueda || busqueda.length < 2) {
      return res.json({
        success: false,
        message: 'Ingrese al menos 2 caracteres'
      });
    }

    const whereCondition = {
      [Op.or]: [
        { nombre: { [Op.like]: `%${busqueda}%` } },
        { apellido: { [Op.like]: `%${busqueda}%` } }
      ]
    };

    let resultados = [];

    // Buscar según tipo
    if (!tipo || tipo === 'medico') {
      const medicos = await Medico.findAll({
        include: [{
          model: Usuario,
          as: 'usuario',
          attributes: ['nombre', 'apellido', 'email'],
          where: whereCondition
        }],
        limit: 5
      });

      resultados = resultados.concat(medicos.map(m => ({
        id: m.id,
        tipo: 'medico',
        nombre: `Dr. ${m.usuario.nombre} ${m.usuario.apellido}`,
        email: m.usuario.email
      })));
    }

    if (!tipo || tipo === 'enfermero') {
      const enfermeros = await Enfermero.findAll({
        include: [{
          model: Usuario,
          as: 'usuario',
          attributes: ['nombre', 'apellido', 'email'],
          where: whereCondition
        }],
        limit: 5
      });

      resultados = resultados.concat(enfermeros.map(e => ({
        id: e.id,
        tipo: 'enfermero',
        nombre: `Enf. ${e.usuario.nombre} ${e.usuario.apellido}`,
        email: e.usuario.email
      })));
    }

    if (!tipo || tipo === 'administrativo') {
      const administrativos = await Administrativo.findAll({
        include: [{
          model: Usuario,
          as: 'usuario',
          attributes: ['nombre', 'apellido', 'email'],
          where: whereCondition
        }],
        limit: 5
      });

      resultados = resultados.concat(administrativos.map(a => ({
        id: a.id,
        tipo: 'administrativo',
        nombre: `${a.usuario.nombre} ${a.usuario.apellido} (Admin)`,
        email: a.usuario.email
      })));
    }

    res.json({
      success: true,
      personal: resultados.slice(0, 10)
    });

  } catch (error) {
    console.error('Error al buscar personal:', error);
    next(error);
  }
};

module.exports = exports;