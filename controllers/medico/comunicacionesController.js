const { Op } = require('sequelize');
const {
  Mensaje,
  Notificacion,
  Noticia,
  Usuario,
  sequelize
} = require('../../models');

function getUsuarioId(req) {
  return req.user?.usuario_id || req.user?.id || null;
}

// ========================================
// RENDERIZAR VISTA (CON LAYOUT DINÁMICO)
// ========================================

exports.renderComunicaciones = async (req, res) => {
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
    res.status(500).render('error', {
      title: 'Error',
      message: error.message,
      layout: 'layouts/layout'
    });
  }
};

// ========================================
// NOTIFICACIONES - OBTENER
// ========================================

/**
 * Obtener notificaciones del usuario
 */
exports.obtenerNotificaciones = async (req, res) => {
  try {
    console.log('🔔 obtenerNotificaciones');

    const usuarioId = getUsuarioId(req);
    const { page = 1, limit = 10, leida = 'TODAS' } = req.query;

    if (!usuarioId) {
      return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = { usuario_id: usuarioId };

    if (leida === 'true') {
      where.leida = true;
    } else if (leida === 'false') {
      where.leida = false;
    }

    const { count, rows } = await Notificacion.findAndCountAll({
      where,
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
        created_at: n.created_at
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
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Obtener estadísticas de notificaciones
 */
exports.obtenerEstadisticasNotificaciones = async (req, res) => {
  try {
    console.log('📊 obtenerEstadisticasNotificaciones');

    const usuarioId = getUsuarioId(req);

    if (!usuarioId) {
      return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    const ahora = new Date();
    const hace24h = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);

    const [total, noLeidas, leidas, ultimas24h] = await Promise.all([
      Notificacion.count({ where: { usuario_id: usuarioId } }),
      Notificacion.count({ where: { usuario_id: usuarioId, leida: false } }),
      Notificacion.count({ where: { usuario_id: usuarioId, leida: true } }),
      Notificacion.count({
        where: {
          usuario_id: usuarioId,
          created_at: { [Op.gte]: hace24h }
        }
      })
    ]);

    console.log('✅ Estadísticas obtenidas');

    res.json({
      success: true,
      data: {
        total,
        noLeidas,
        leidas,
        ultimas24h
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========================================
// NOTIFICACIONES - CREAR
// ========================================

/**
 * Crear/Enviar notificación
 */
exports.crearNotificacion = async (req, res) => {
  try {
    console.log('✉️ crearNotificacion');

    const { usuario_id, mensaje } = req.body;

    if (!usuario_id || !mensaje || !mensaje.trim()) {
      return res.status(400).json({
        success: false,
        message: 'usuario_id y mensaje son obligatorios'
      });
    }

    const usuario = await Usuario.findByPk(usuario_id);
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario destino no encontrado'
      });
    }

    const notificacion = await Notificacion.create({
      usuario_id: parseInt(usuario_id),
      mensaje: mensaje.trim(),
      leida: false
    });

    console.log('✅ Notificación creada:', notificacion.id);

    res.json({
      success: true,
      message: 'Notificación enviada correctamente',
      data: notificacion
    });
  } catch (error) {
    console.error('❌ Error al crear notificación:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========================================
// NOTIFICACIONES - ACTUALIZAR
// ========================================

/**
 * Marcar notificación como leída
 */
exports.marcarNotificacionLeida = async (req, res) => {
  try {
    console.log('👁️ marcarNotificacionLeida - id:', req.params.id);

    const usuarioId = getUsuarioId(req);
    const { id } = req.params;

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

    console.log('✅ Notificación marcada como leída');

    res.json({
      success: true,
      message: 'Notificación marcada como leída'
    });
  } catch (error) {
    console.error('❌ Error al marcar notificación leída:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Marcar todas las notificaciones como leídas
 */
exports.marcarTodasNotificacionesLeidas = async (req, res) => {
  try {
    console.log('👁️ marcarTodasNotificacionesLeidas');

    const usuarioId = getUsuarioId(req);

    if (!usuarioId) {
      return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    await Notificacion.update(
      { leida: true },
      { where: { usuario_id: usuarioId, leida: false } }
    );

    console.log('✅ Todas las notificaciones marcadas como leídas');

    res.json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas'
    });
  } catch (error) {
    console.error('❌ Error al marcar notificaciones leídas:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========================================
// NOTIFICACIONES - ELIMINAR
// ========================================

exports.eliminarNotificacion = async (req, res) => {
  try {
    console.log('🗑️ eliminarNotificacion - id:', req.params.id);

    const usuarioId = getUsuarioId(req);
    const { id } = req.params;

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

    console.log('✅ Notificación eliminada');

    res.json({
      success: true,
      message: 'Notificación eliminada'
    });
  } catch (error) {
    console.error('❌ Error al eliminar notificación:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========================================
// MENSAJES - OBTENER
// ========================================

/**
 * Obtener conversación entre dos usuarios
 */
exports.obtenerConversacion = async (req, res) => {
  try {
    console.log('💬 obtenerConversacion');

    const usuarioId = getUsuarioId(req);
    const { usuario_id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (!usuarioId) {
      return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Mensaje.findAndCountAll({
      where: {
        [Op.or]: [
          { remitente_id: usuarioId, destinatario_id: usuario_id },
          { remitente_id: usuario_id, destinatario_id: usuarioId }
        ]
      },
      include: [
        { model: Usuario, as: 'remitente', attributes: ['id', 'nombre', 'apellido', 'email'] },
        { model: Usuario, as: 'destinatario', attributes: ['id', 'nombre', 'apellido', 'email'] }
      ],
      order: [['created_at', 'ASC']],
      limit: parseInt(limit),
      offset: offset
    });

    console.log('✅ Conversación obtenida:', rows.length);

    res.json({
      success: true,
      data: rows.map(m => ({
        id: m.id,
        remitente_id: m.remitente_id,
        destinatario_id: m.destinatario_id,
        contenido: m.contenido,
        leido: m.leido,
        fecha_lectura: m.fecha_lectura,
        created_at: m.created_at,
        remitente: m.remitente,
        destinatario: m.destinatario
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
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Obtener lista de conversaciones (últimos mensajes con cada usuario)
 */
exports.obtenerConversaciones = async (req, res) => {
  try {
    console.log('💬 obtenerConversaciones');

    const usuarioId = getUsuarioId(req);
    if (!usuarioId) {
      return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    // Obtener usuarios con los que ha conversado
    const conversaciones = await sequelize.query(`
      SELECT DISTINCT
        CASE 
          WHEN m.remitente_id = ? THEN m.destinatario_id
          ELSE m.remitente_id
        END as otro_usuario_id,
        MAX(m.created_at) as ultima_fecha,
        (SELECT COUNT(*) FROM mensajes m2 
         WHERE m2.destinatario_id = ? 
         AND m2.remitente_id = CASE 
           WHEN m.remitente_id = ? THEN m.destinatario_id
           ELSE m.remitente_id
         END
         AND m2.leido = false) as no_leidos
      FROM mensajes m
      WHERE m.remitente_id = ? OR m.destinatario_id = ?
      GROUP BY otro_usuario_id
      ORDER BY ultima_fecha DESC
      LIMIT 50
    `, {
      replacements: [usuarioId, usuarioId, usuarioId, usuarioId, usuarioId],
      type: sequelize.QueryTypes.SELECT
    });

    // Obtener datos de usuarios
    const conversacionesData = await Promise.all(
      conversaciones.map(async (conv) => {
        const usuario = await Usuario.findByPk(conv.otro_usuario_id, {
          attributes: ['id', 'nombre', 'apellido', 'email']
        });

        const ultimoMensaje = await Mensaje.findOne({
          where: {
            [Op.or]: [
              { remitente_id: usuarioId, destinatario_id: conv.otro_usuario_id },
              { remitente_id: conv.otro_usuario_id, destinatario_id: usuarioId }
            ]
          },
          order: [['created_at', 'DESC']],
          attributes: ['id', 'contenido', 'remitente_id', 'created_at']
        });

        return {
          usuario: usuario,
          ultimo_mensaje: ultimoMensaje ? ultimoMensaje.contenido : '',
          ultima_fecha: conv.ultima_fecha,
          no_leidos: parseInt(conv.no_leidos) || 0,
          es_enviado: ultimoMensaje ? ultimoMensaje.remitente_id === usuarioId : false
        };
      })
    );

    console.log('✅ Conversaciones obtenidas:', conversacionesData.length);

    res.json({
      success: true,
      data: conversacionesData
    });
  } catch (error) {
    console.error('❌ Error al obtener conversaciones:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Obtener mensajes recibidos (bandeja de entrada)
 */
exports.obtenerMensajesRecibidos = async (req, res) => {
  try {
    console.log('📥 obtenerMensajesRecibidos');

    const usuarioId = getUsuarioId(req);
    const { page = 1, limit = 20, leido = 'TODAS' } = req.query;

    if (!usuarioId) {
      return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = { destinatario_id: usuarioId };

    if (leido === 'true') {
      where.leido = true;
    } else if (leido === 'false') {
      where.leido = false;
    }

    const { count, rows } = await Mensaje.findAndCountAll({
      where,
      include: [
        { model: Usuario, as: 'remitente', attributes: ['id', 'nombre', 'apellido', 'email'] }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    console.log('✅ Mensajes recibidos:', count);

    res.json({
      success: true,
      data: rows.map(m => ({
        id: m.id,
        remitente: m.remitente,
        contenido: m.contenido,
        leido: m.leido,
        created_at: m.created_at
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener mensajes recibidos:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Obtener mensajes enviados (bandeja de enviados)
 */
exports.obtenerMensajesEnviados = async (req, res) => {
  try {
    console.log('📤 obtenerMensajesEnviados');

    const usuarioId = getUsuarioId(req);
    const { page = 1, limit = 20 } = req.query;

    if (!usuarioId) {
      return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Mensaje.findAndCountAll({
      where: { remitente_id: usuarioId },
      include: [
        { model: Usuario, as: 'destinatario', attributes: ['id', 'nombre', 'apellido', 'email'] }
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
        destinatario: m.destinatario,
        contenido: m.contenido,
        leido: m.leido,
        created_at: m.created_at
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
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========================================
// MENSAJES - CREAR/ENVIAR
// ========================================

exports.enviarMensaje = async (req, res) => {
  try {
    console.log('✉️ enviarMensaje');

    const usuarioId = getUsuarioId(req);
    const { usuario_id, contenido } = req.body;

    if (!usuarioId) {
      return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    if (!usuario_id || !contenido || !contenido.trim()) {
      return res.status(400).json({
        success: false,
        message: 'usuario_id y contenido son obligatorios'
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

    const mensaje = await Mensaje.create({
      remitente_id: usuarioId,
      destinatario_id: parseInt(usuario_id),
      contenido: contenido.trim(),
      leido: false
    });

    console.log('✅ Mensaje enviado:', mensaje.id);

    res.json({
      success: true,
      message: 'Mensaje enviado correctamente',
      data: mensaje
    });
  } catch (error) {
    console.error('❌ Error al enviar mensaje:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========================================
// MENSAJES - ACTUALIZAR
// ========================================

/**
 * Marcar mensaje como leído
 */
exports.marcarMensajeLeido = async (req, res) => {
  try {
    console.log('👁️ marcarMensajeLeido - id:', req.params.id);

    const usuarioId = getUsuarioId(req);
    const { id } = req.params;

    const mensaje = await Mensaje.findOne({
      where: {
        id,
        destinatario_id: usuarioId
      }
    });

    if (!mensaje) {
      return res.status(404).json({
        success: false,
        message: 'Mensaje no encontrado'
      });
    }

    await mensaje.update({
      leido: true,
      fecha_lectura: new Date()
    });

    console.log('✅ Mensaje marcado como leído');

    res.json({
      success: true,
      message: 'Mensaje marcado como leído'
    });
  } catch (error) {
    console.error('❌ Error al marcar mensaje leído:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========================================
// MENSAJES - ELIMINAR
// ========================================

exports.eliminarMensaje = async (req, res) => {
  try {
    console.log('🗑️ eliminarMensaje - id:', req.params.id);

    const usuarioId = getUsuarioId(req);
    const { id } = req.params;

    const mensaje = await Mensaje.findOne({
      where: {
        id,
        [Op.or]: [
          { remitente_id: usuarioId },
          { destinatario_id: usuarioId }
        ]
      }
    });

    if (!mensaje) {
      return res.status(404).json({
        success: false,
        message: 'Mensaje no encontrado'
      });
    }

    await mensaje.destroy();

    console.log('✅ Mensaje eliminado');

    res.json({
      success: true,
      message: 'Mensaje eliminado'
    });
  } catch (error) {
    console.error('❌ Error al eliminar mensaje:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========================================
// USUARIOS - BUSCAR
// ========================================

exports.buscarUsuarios = async (req, res) => {
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
          { nombre: { [Op.iLike]: `%${search}%` } },
          { apellido: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { dni: { [Op.iLike]: `%${search}%` } }
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
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========================================
// NOTICIAS - OBTENER
// ========================================

exports.obtenerNoticias = async (req, res) => {
  try {
    console.log('📰 obtenerNoticias');

    const { page = 1, limit = 5 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Noticia.findAndCountAll({
      include: [
        { model: Usuario, as: 'autor', attributes: ['nombre', 'apellido'] }
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
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.obtenerNoticiaPorId = async (req, res) => {
  try {
    console.log('📰 obtenerNoticiaPorId - id:', req.params.id);

    const noticia = await Noticia.findByPk(req.params.id, {
      include: [
        { model: Usuario, as: 'autor', attributes: ['nombre', 'apellido'] }
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
    res.status(500).json({ success: false, message: error.message });
  }
};