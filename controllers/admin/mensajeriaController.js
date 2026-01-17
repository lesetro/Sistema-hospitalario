const { Op } = require('sequelize');
const { Notificacion, Usuario, Rol, Paciente, Medico, Enfermero, Administrativo } = require('../../models');

// Helper para obtener usuario de sesión
function getUsuarioSesion(req) {
  return req.user || req.session.user || req.session.usuario || {};
}

function getUsuarioId(req) {
  const usuario = getUsuarioSesion(req);
  return usuario.usuario_id || usuario.id || null;
}

/**
 * Vista principal de mensajería
 */
const getVistaMensajeria = async (req, res) => {
  try {
    const usuarioActual = getUsuarioSesion(req);
    const usuarioId = getUsuarioId(req);

    if (!usuarioId) {
      return res.status(401).render('error', { 
        message: 'Sesión inválida',
        user: usuarioActual
      });
    }

    // Obtener usuarios para enviar mensajes (excluyendo al usuario actual)
    const usuarios = await Usuario.findAll({
      where: {
        id: { [Op.ne]: usuarioId },
        estado: 'Activo'
      },
      include: [
        {
          model: Rol,
          as: 'rol_principal',
          attributes: ['nombre']
        }
      ],
      attributes: ['id', 'nombre', 'apellido', 'dni'],
      order: [['nombre', 'ASC']]
    });

    res.render('dashboard/admin/mensajeria/inbox', {
      title: 'Comunicación',
      user: usuarioActual,
      usuarios
    });

  } catch (error) {
    console.error('Error al cargar mensajería:', error);
    res.status(500).render('error', { 
      message: 'Error al cargar la página',
      user: getUsuarioSesion(req)
    });
  }
};

/**
 * Obtener estadísticas de mensajes
 */
const getEstadisticas = async (req, res) => {
  try {
    const usuarioId = getUsuarioId(req);

    if (!usuarioId) {
      return res.json({ success: false, message: 'No autorizado' });
    }

    const [recibidos, enviados, noLeidos, eliminados] = await Promise.all([
      Notificacion.count({
        where: { usuario_id: usuarioId }
      }),
      Notificacion.count({
        where: { 
          remitente_id: usuarioId 
        }
      }),
      Notificacion.count({
        where: { 
          usuario_id: usuarioId,
          leida: false
        }
      }),
      Notificacion.count({
        where: {
          [Op.or]: [
            { usuario_id: usuarioId },
            { remitente_id: usuarioId }
          ],
          eliminado: true
        }
      })
    ]);

    res.json({
      success: true,
      estadisticas: {
        recibidos,
        enviados,
        no_leidos: noLeidos,
        eliminados
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
  }
};

/**
 * Obtener contador de mensajes no leídos
 */
const getContadorNoLeidos = async (req, res) => {
  try {
    const usuarioId = getUsuarioId(req);

    if (!usuarioId) {
      return res.json({ success: true, contador: 0 });
    }

    const noLeidos = await Notificacion.count({
      where: {
        usuario_id: usuarioId,
        leida: false,
        eliminado: false
      }
    });

    res.json({
      success: true,
      contador: noLeidos
    });

  } catch (error) {
    res.json({ success: true, contador: 0 });
  }
};

/**
 * Obtener mensajes según tipo (recibidos, enviados, eliminados)
 */
const getMensajes = async (req, res) => {
  try {
    const usuarioId = getUsuarioId(req);
    const { 
      page = 1, 
      limit = 20, 
      tipo = 'recibidos', // recibidos, enviados, eliminados
      solo_no_leidos = false 
    } = req.query;

    if (!usuarioId) {
      return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = {};
    let include = [];

    // Construir query según tipo
    switch (tipo) {
      case 'enviados':
        where = { 
          remitente_id: usuarioId,
          eliminado: false
        };
        include = [
          {
            model: Usuario,
            as: 'destinatario',
            attributes: ['id', 'nombre', 'apellido', 'email'],
            include: [
              {
                model: Rol,
                as: 'rol_principal',
                attributes: ['nombre']
              }
            ]
          }
        ];
        break;

      case 'eliminados':
        where = {
          [Op.or]: [
            { usuario_id: usuarioId },
            { remitente_id: usuarioId }
          ],
          eliminado: true
        };
        include = [
          {
            model: Usuario,
            as: 'destinatario',
            attributes: ['nombre', 'apellido']
          },
          {
            model: Usuario,
            as: 'remitente',
            attributes: ['nombre', 'apellido'],
            required: false
          }
        ];
        break;

      default: // recibidos
        where = { 
          usuario_id: usuarioId,
          eliminado: false
        };
        
        if (solo_no_leidos === 'true') {
          where.leida = false;
        }

        include = [
          {
            model: Usuario,
            as: 'remitente',
            attributes: ['id', 'nombre', 'apellido', 'email'],
            include: [
              {
                model: Rol,
                as: 'rol_principal',
                attributes: ['nombre']
              }
            ],
            required: false
          }
        ];
        break;
    }

    const { count, rows: mensajes } = await Notificacion.findAndCountAll({
      where,
      include,
      limit: parseInt(limit),
      offset: offset,
      order: [['created_at', 'DESC']]
    });

    // Formatear mensajes
    const mensajesFormateados = mensajes.map(m => {
      let remitente = 'Sistema';
      let destinatario = '';
      let rol = '';

      if (tipo === 'enviados') {
        destinatario = m.destinatario ? 
          `${m.destinatario.nombre} ${m.destinatario.apellido}` : 
          'Usuario eliminado';
        rol = m.destinatario?.rol_principal?.nombre || '';
      } else {
        remitente = m.remitente ? 
          `${m.remitente.nombre} ${m.remitente.apellido}` : 
          'Sistema';
        rol = m.remitente?.rol_principal?.nombre || '';
      }

      return {
        id: m.id,
        mensaje: m.mensaje,
        leida: m.leida,
        fecha: m.created_at,
        remitente,
        destinatario,
        rol,
        tipo_mensaje: tipo
      };
    });

    res.json({
      success: true,
      mensajes: mensajesFormateados,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener mensajes',
      error: error.message
    });
  }
};

/**
 * Enviar mensaje
 */
const enviarMensaje = async (req, res) => {
  try {
    const { destinatario_id, mensaje } = req.body;
    const remitenteId = getUsuarioId(req);
    const remitente = getUsuarioSesion(req);

    if (!remitenteId) {
      return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    if (!destinatario_id || !mensaje || !mensaje.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Destinatario y mensaje son obligatorios'
      });
    }

    // Verificar destinatario
    const destinatario = await Usuario.findByPk(destinatario_id);
    
    if (!destinatario) {
      return res.status(404).json({
        success: false,
        message: 'Destinatario no encontrado'
      });
    }

    // Crear mensaje
    await Notificacion.create({
      usuario_id: destinatario_id,
      remitente_id: remitenteId,
      mensaje: mensaje.trim(),
      leida: false,
      eliminado: false
    });

    res.json({
      success: true,
      message: 'Mensaje enviado correctamente'
    });

  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar mensaje'
    });
  }
};

/**
 * Marcar como leído
 */
const marcarComoLeido = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = getUsuarioId(req);

    const mensaje = await Notificacion.findOne({
      where: { id, usuario_id: usuarioId }
    });

    if (!mensaje) {
      return res.status(404).json({ success: false, message: 'Mensaje no encontrado' });
    }

    await mensaje.update({ leida: true });

    res.json({ success: true, message: 'Mensaje marcado como leído' });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar' });
  }
};

/**
 * Marcar todos como leídos
 */
const marcarTodosLeidos = async (req, res) => {
  try {
    const usuarioId = getUsuarioId(req);

    await Notificacion.update(
      { leida: true },
      {
        where: {
          usuario_id: usuarioId,
          leida: false,
          eliminado: false
        }
      }
    );

    res.json({ success: true, message: 'Todos marcados como leídos' });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar' });
  }
};

/**
 * Eliminar mensaje 
 */
const eliminarMensaje = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = getUsuarioId(req);

    const mensaje = await Notificacion.findOne({
      where: {
        id,
        [Op.or]: [
          { usuario_id: usuarioId },
          { remitente_id: usuarioId }
        ]
      }
    });

    if (!mensaje) {
      return res.status(404).json({ success: false, message: 'Mensaje no encontrado' });
    }

    await mensaje.update({ eliminado: true });

    res.json({ success: true, message: 'Mensaje eliminado' });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar' });
  }
};

/**
 * Restaurar mensaje eliminado
 */
const restaurarMensaje = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = getUsuarioId(req);

    const mensaje = await Notificacion.findOne({
      where: {
        id,
        [Op.or]: [
          { usuario_id: usuarioId },
          { remitente_id: usuarioId }
        ],
        eliminado: true
      }
    });

    if (!mensaje) {
      return res.status(404).json({ success: false, message: 'Mensaje no encontrado' });
    }

    await mensaje.update({ eliminado: false });

    res.json({ success: true, message: 'Mensaje restaurado' });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al restaurar' });
  }
};

module.exports = {
  getVistaMensajeria,
  getEstadisticas,
  getContadorNoLeidos,
  getMensajes,
  enviarMensaje,
  marcarComoLeido,
  marcarTodosLeidos,
  eliminarMensaje,
  restaurarMensaje
};