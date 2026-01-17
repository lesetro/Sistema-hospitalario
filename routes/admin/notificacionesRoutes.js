const express = require('express');
const router = express.Router();
const { Notificacion } = require('../../models');

/**
 * Obtener notificaciones del usuario
 * GET /api/notifications
 */
router.get('/', async (req, res) => {
  try {
    const usuarioId = (req.user || req.session.user || req.session.usuario)?.usuario_id || 
                      (req.user || req.session.user || req.session.usuario)?.id;
    
    const { limit = 10 } = req.query;

    if (!usuarioId) {
      return res.json({ success: true, notifications: [] });
    }

    const notificaciones = await Notificacion.findAll({
      where: {
        usuario_id: usuarioId,
        eliminado: false
      },
      limit: parseInt(limit),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      notifications: notificaciones.map(n => ({
        id: n.id,
        mensaje: n.mensaje,
        leida: n.leida,
        fecha: n.created_at
      }))
    });

  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.json({ success: true, notifications: [] });
  }
});

/**
 * Marcar notificación como leída
 * PUT /api/notifications/:id/read
 */
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = (req.user || req.session.user || req.session.usuario)?.usuario_id || 
                      (req.user || req.session.user || req.session.usuario)?.id;

    const notificacion = await Notificacion.findOne({
      where: { id, usuario_id: usuarioId }
    });

    if (!notificacion) {
      return res.status(404).json({ success: false, message: 'No encontrada' });
    }

    await notificacion.update({ leida: true });

    res.json({ success: true });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar' });
  }
});

module.exports = router;