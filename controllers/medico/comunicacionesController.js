const {
  Notificacion,
  Noticia,
  Usuario
} = require('../../models');
const db = require('../../database/db');
const { Op, QueryTypes } = require('sequelize');

function getUsuarioId(req) {
  return req.user?.usuario_id || req.user?.id || null;
}

// ========================================
// VISTA
// ========================================

exports.renderComunicaciones = async (req, res, next) => {
  try {
    console.log('📨 renderComunicaciones - usuario_id:', req.user.usuario_id);

    const usuario = await Usuario.findByPk(req.user.usuario_id);

    if (!usuario) {
      return res.status(404).render('error', {
        title: 'Error',
        message: 'Usuario no encontrado',
        layout: 'layouts/layout'
      });
    }

    const layoutMap = {
      'MEDICO': 'layouts/layoutMedico',
      'ENFERMERO': 'layouts/layoutEnfermero',
      'ADMINISTRATIVO': 'layouts/layoutAdministrativo',
      'PACIENTE': 'layouts/layoutPaciente'
    };

    const layout = layoutMap[req.user.rol] || 'layouts/layout';

    console.log(`✅ Renderizando comunicaciones con layout: ${layout}`);

    res.render('dashboard/medico/comunicaciones', {
      title: 'Comunicaciones',
      user: usuario.toJSON(),
      rol: req.user.rol,
      rol_ruta: req.user.rol_ruta,
      layout: layout
    });
  } catch (error) {
    console.error('❌ Error al renderizar comunicaciones:', error.message);
    next(error);
  }
};

// ========================================
// NOTIFICACIONES - OBTENER (Mensajes recibidos)
// ========================================

exports.obtenerNotificaciones = async (req, res, next) => {
  try {
    console.log('📥 obtenerNotificaciones (Mensajes recibidos)');

    const usuarioId = getUsuarioId(req);
    const { page = 1, limit = 10, leida = 'TODAS' } = req.query;

    if (!usuarioId) {
      return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = { usuario_id: usuarioId, eliminado: false };

    if (leida === 'true') {
      where.leida = true;
    } else if (leida === 'false') {
      where.leida = false;
    }

    const { count, rows } = await Notificacion.findAndCountAll({
      where,
      include: [
        { 
          model: Usuario, 
          as: 'remitente', 
          attributes: ['id', 'nombre', 'apellido', 'email', 'dni'],
          required: false
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    console.log('✅ Notificaciones obtenidas:', count);

    res.json({
      success: true,
      data: rows.map(n => ({
        id: n.id,
        mensaje: n.mensaje,
        leida: n.leida,
        remitente: n.remitente ? {
          id: n.remitente.id,
          nombre: n.remitente.nombre,
          apellido: n.remitente.apellido,
          email: n.remitente.email
        } : null,
        createdAt: n.createdAt,
        fecha_lectura: n.fecha_lectura
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener notificaciones:', error.message);
    next(error);
  }
};

// ========================================
// NOTIFICACIONES - ENVIADAS (Mensajes enviados)
// ========================================

exports.obtenerMensajesEnviados = async (req, res, next) => {
  try {
    console.log('📤 obtenerMensajesEnviados');

    const usuarioId = getUsuarioId(req);
    const { page = 1, limit = 10 } = req.query;

    if (!usuarioId) {
      return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Notificacion.findAndCountAll({
      where: { 
        remitente_id: usuarioId,
        eliminado: false
      },
      include: [
        { 
          model: Usuario, 
          as: 'destinatario', 
          attributes: ['id', 'nombre', 'apellido', 'email', 'dni']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    console.log('✅ Mensajes enviados:', count);

    res.json({
      success: true,
      data: rows.map(m => ({
        id: m.id,
        mensaje: m.mensaje,
        leida: m.leida,
        destinatario: m.destinatario ? {
          id: m.destinatario.id,
          nombre: m.destinatario.nombre,
          apellido: m.destinatario.apellido,
          email: m.destinatario.email
        } : null,
        createdAt: m.createdAt,
        fecha_lectura: m.fecha_lectura
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener mensajes enviados:', error.message);
    next(error);
  }
};

// ========================================
// CONVERSACIONES
// ========================================

exports.obtenerConversaciones = async (req, res, next) => {
  try {
    console.log(' obtenerConversaciones');

    const usuarioId = getUsuarioId(req);
    if (!usuarioId) {
      return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    const conversaciones = await db.sequelize.query(`
      SELECT DISTINCT
        CASE 
          WHEN n.remitente_id = :usuarioId THEN n.usuario_id
          ELSE n.remitente_id
        END as otro_usuario_id,
        MAX(n.created_at) as ultima_fecha,
        COUNT(CASE WHEN n.leida = false AND n.usuario_id = :usuarioId THEN 1 END) as no_leidos
      FROM notificaciones n
      WHERE (n.remitente_id = :usuarioId OR n.usuario_id = :usuarioId)
        AND n.eliminado = false
        AND (n.remitente_id IS NOT NULL)
      GROUP BY otro_usuario_id
      ORDER BY ultima_fecha DESC
    `, {
      replacements: { usuarioId },
      type: QueryTypes.SELECT  
    });

    // Obtener datos de usuarios y último mensaje
    const conversacionesData = await Promise.all(
      conversaciones.map(async (conv) => {
        const usuario = await Usuario.findByPk(conv.otro_usuario_id, {
          attributes: ['id', 'nombre', 'apellido', 'email']
        });

        const ultimaNotificacion = await Notificacion.findOne({
          where: {
            [Op.or]: [
              { remitente_id: usuarioId, usuario_id: conv.otro_usuario_id },
              { remitente_id: conv.otro_usuario_id, usuario_id: usuarioId }
            ],
            eliminado: false,
            remitente_id: { [Op.not]: null }
          },
          order: [['created_at', 'DESC']],
          attributes: ['id', 'mensaje', 'remitente_id', 'created_at']
        });

        return {
          usuario: usuario,
          ultimo_mensaje: ultimaNotificacion ? ultimaNotificacion.mensaje : '',
          ultima_fecha: conv.ultima_fecha,
          no_leidos: parseInt(conv.no_leidos) || 0,
          es_enviado: ultimaNotificacion ? ultimaNotificacion.remitente_id === usuarioId : false
        };
      })
    );

    console.log(' Conversaciones obtenidas:', conversacionesData.length);

    res.json({
      success: true,
      data: conversacionesData
    });
  } catch (error) {
    console.error('❌ Error al obtener conversaciones:', error.message);
    next(error);
  }
};

exports.obtenerConversacion = async (req, res, next) => {
  try {
    console.log(' obtenerConversacion');

    const usuarioId = getUsuarioId(req);
    const { usuario_id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (!usuarioId) {
      return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Notificacion.findAndCountAll({
      where: {
        [Op.or]: [
          { remitente_id: usuarioId, usuario_id: usuario_id },
          { remitente_id: usuario_id, usuario_id: usuarioId }
        ],
        eliminado: false,
        remitente_id: { [Op.not]: null }
      },
      include: [
        { 
          model: Usuario, 
          as: 'remitente', 
          attributes: ['id', 'nombre', 'apellido', 'email'] 
        },
        { 
          model: Usuario, 
          as: 'destinatario', 
          attributes: ['id', 'nombre', 'apellido', 'email'] 
        }
      ],
      order: [['created_at', 'ASC']],
      limit: parseInt(limit),
      offset: offset
    });

    console.log(' Conversación obtenida:', rows.length);

    res.json({
      success: true,
      data: rows.map(n => ({
        id: n.id,
        remitente_id: n.remitente_id,
        usuario_id: n.usuario_id,
        mensaje: n.mensaje,
        leida: n.leida,
        fecha_lectura: n.fecha_lectura,
        createdAt: n.createdAt,
        remitente: n.remitente,
        destinatario: n.destinatario
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener conversación:', error.message);
    next(error);
  }
};


// ========================================
// NOTIFICACIONES - ESTADÍSTICAS
// ========================================

exports.obtenerEstadisticasNotificaciones = async (req, res, next) => {
  try {
    console.log('📊 obtenerEstadisticasNotificaciones');

    const usuarioId = getUsuarioId(req);

    if (!usuarioId) {
      return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    const ahora = new Date();
    const hace24h = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);

    const [totalRecibidas, noLeidas, leidas, ultimas24h, totalEnviadas] = await Promise.all([
      Notificacion.count({ where: { usuario_id: usuarioId, eliminado: false } }),
      Notificacion.count({ where: { usuario_id: usuarioId, leida: false, eliminado: false } }),
      Notificacion.count({ where: { usuario_id: usuarioId, leida: true, eliminado: false } }),
      Notificacion.count({
        where: {
          usuario_id: usuarioId,
          createdAt: { [Op.gte]: hace24h },
          eliminado: false
        }
      }),
      Notificacion.count({ where: { remitente_id: usuarioId, eliminado: false } })
    ]);

    console.log('✅ Estadísticas obtenidas');

    res.json({
      success: true,
      data: {
        totalRecibidas,
        noLeidas,
        leidas,
        ultimas24h,
        totalEnviadas
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error.message);
    next(error);
  }
};

// ========================================
// NOTIFICACIONES - CREAR (Enviar mensaje)
// ========================================

exports.crearNotificacion = async (req, res, next) => {
  try {
    console.log('✉️ crearNotificacion (Enviar mensaje)');

    const usuarioId = getUsuarioId(req);
    const { usuario_id, mensaje } = req.body;

    if (!usuarioId) {
      return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    if (!usuario_id || !mensaje || !mensaje.trim()) {
      return res.status(400).json({
        success: false,
        message: 'usuario_id y mensaje son obligatorios'
      });
    }

    if (usuarioId === parseInt(usuario_id)) {
      return res.status(400).json({
        success: false,
        message: 'No puedes enviarte mensajes a ti mismo'
      });
    }

    const usuarioDestino = await Usuario.findByPk(usuario_id);
    if (!usuarioDestino) {
      return res.status(404).json({
        success: false,
        message: 'Usuario destino no encontrado'
      });
    }

    const notificacion = await Notificacion.create({
      usuario_id: parseInt(usuario_id), // destinatario
      remitente_id: usuarioId,          // quien envía
      mensaje: mensaje.trim(),
      leida: false,
      eliminado: false
    });

    console.log('✅ Notificación (mensaje) enviada:', notificacion.id);

    res.json({
      success: true,
      message: 'Mensaje enviado correctamente',
      data: {
        id: notificacion.id,
        mensaje: notificacion.mensaje,
        createdAt: notificacion.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Error al crear notificación:', error.message);
    next(error);
  }
};

// ========================================
// NOTIFICACIONES - ACTUALIZAR
// ========================================

exports.marcarNotificacionLeida = async (req, res, next) => {
  try {
    console.log('👁️ marcarNotificacionLeida - id:', req.params.id);

    const usuarioId = getUsuarioId(req);
    const { id } = req.params;

    const notificacion = await Notificacion.findOne({
      where: {
        id,
        usuario_id: usuarioId // Solo puede marcar como leída sus propias notificaciones
      }
    });

    if (!notificacion) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }

    await notificacion.update({ 
      leida: true,
      fecha_lectura: new Date() 
    });

    console.log('✅ Notificación marcada como leída');

    res.json({
      success: true,
      message: 'Notificación marcada como leída'
    });
  } catch (error) {
    console.error('❌ Error al marcar notificación leída:', error.message);
    next(error);
  }
};

exports.marcarTodasNotificacionesLeidas = async (req, res, next) => {
  try {
    console.log('👁️ marcarTodasNotificacionesLeidas');

    const usuarioId = getUsuarioId(req);

    if (!usuarioId) {
      return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    await Notificacion.update(
      { 
        leida: true,
        fecha_lectura: new Date() 
      },
      { 
        where: { 
          usuario_id: usuarioId, 
          leida: false,
          eliminado: false 
        } 
      }
    );

    console.log('✅ Todas las notificaciones marcadas como leídas');

    res.json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas'
    });
  } catch (error) {
    console.error('❌ Error al marcar notificaciones leídas:', error.message);
    next(error);
  }
};

// ========================================
// NOTIFICACIONES - ELIMINAR
// ========================================

exports.eliminarNotificacion = async (req, res, next) => {
  try {
    console.log('🗑️ eliminarNotificacion - id:', req.params.id);

    const usuarioId = getUsuarioId(req);
    const { id } = req.params;

    const notificacion = await Notificacion.findOne({
      where: {
        id,
        [Op.or]: [
          { usuario_id: usuarioId },  // Como destinatario
          { remitente_id: usuarioId } // Como remitente
        ]
      }
    });

    if (!notificacion) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }

    await notificacion.update({ eliminado: true });

    console.log('✅ Notificación eliminada (marcada como eliminada)');

    res.json({
      success: true,
      message: 'Notificación eliminada'
    });
  } catch (error) {
    console.error('❌ Error al eliminar notificación:', error.message);
    next(error);
  }
};

// ========================================
// USUARIOS - BUSCAR
// ========================================

exports.buscarUsuarios = async (req, res, next) => {
  try {
    console.log('🔍 buscarUsuarios');

    const { search = '', limit = 10 } = req.query;
    const usuarioId = getUsuarioId(req);

    if (!search || search.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Buscar mínimo 2 caracteres'
      });
    }

    const usuarios = await Usuario.findAll({
      where: {
        id: { [Op.ne]: usuarioId },
        [Op.or]: [
          { nombre: { [Op.like]: `%${search}%` } },
          { apellido: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { dni: { [Op.like]: `%${search}%` } }
        ]
      },
      attributes: ['id', 'nombre', 'apellido', 'email', 'dni'],
      limit: parseInt(limit)
    });

    console.log('✅ Usuarios encontrados:', usuarios.length);

    res.json({
      success: true,
      data: usuarios
    });
  } catch (error) {
    console.error('❌ Error al buscar usuarios:', error.message);
    next(error);
  }
};

// ========================================
// NOTICIAS - OBTENER
// ========================================

exports.obtenerNoticias = async (req, res, next) => {
  try {
    console.log('📰 obtenerNoticias');

    const { page = 1, limit = 5 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Noticia.findAndCountAll({
      include: [
        { 
          model: Usuario, 
          as: 'autor', 
          attributes: ['nombre', 'apellido'] 
        }
      ],
      order: [['fecha', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      success: true,
      data: rows.map(n => ({
        id: n.id,
        titulo: n.titulo,
        texto: n.texto,
        fecha: n.fecha,
        autor: n.autor
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener noticias:', error.message);
    next(error);
  }
};

exports.obtenerNoticiaPorId = async (req, res, next) => {
  try {
    console.log('📰 obtenerNoticiaPorId - id:', req.params.id);

    const noticia = await Noticia.findByPk(req.params.id, {
      include: [
        { 
          model: Usuario, 
          as: 'autor', 
          attributes: ['nombre', 'apellido'] 
        }
      ]
    });

    if (!noticia) {
      return res.status(404).json({
        success: false,
        message: 'Noticia no encontrada'
      });
    }

    res.json({
      success: true,
      data: {
        id: noticia.id,
        titulo: noticia.titulo,
        texto: noticia.texto,
        fecha: noticia.fecha,
        autor: noticia.autor
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener noticia:', error.message);
    next(error);
  }
};