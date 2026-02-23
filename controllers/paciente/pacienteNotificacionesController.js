const db = require('../../models');

/**
 * CONTROLADOR: Notificaciones del Paciente
 */

// GET /paciente/notificaciones - Lista de notificaciones
exports.getNotificaciones = async (req, res, next) => {
  try {
    const usuarioId = req.user.usuario_id;  // ✅ Para notificaciones usamos usuario_id
    const { page = 1 } = req.query;
    const limit = 20;
    const offset = (page - 1) * limit;

    const { count, rows: notificaciones } = await db.Notificacion.findAndCountAll({
      where: { usuario_id: usuarioId },
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    const estadisticas = {
      total: count,
      noLeidas: await db.Notificacion.count({ 
        where: { 
          usuario_id: usuarioId, 
          leida: false 
        } 
      })
    };

    const totalPages = Math.ceil(count / limit);

    res.render('dashboard/paciente/notificaciones', {
      title: 'Notificaciones',
      user: req.user,
      notificaciones,
      estadisticas,
      paginacion: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    next(error);
  }
};

// POST /paciente/notificaciones/:id/marcar-leida - Marcar como leída
exports.marcarLeida = async (req, res, next) => {
  try {
    const usuarioId = req.user.usuario_id;  // ✅ Para notificaciones usamos usuario_id
    const notificacionId = req.params.id;

    const notificacion = await db.Notificacion.findOne({
      where: { 
        id: notificacionId, 
        usuario_id: usuarioId 
      }
    });

    if (!notificacion) {
      return res.status(404).json({ success: false, message: 'Notificación no encontrada' });
    }

    await notificacion.update({ leida: true });

    res.json({ success: true, message: 'Notificación marcada como leída' });
  } catch (error) {
    console.error('Error al marcar notificación:', error);
    next(error);
  }
};

// POST /paciente/notificaciones/marcar-todas-leidas - Marcar todas como leídas
exports.marcarTodasLeidas = async (req, res, next) => {
  try {
    const usuarioId = req.user.usuario_id;  // ✅ Para notificaciones usamos usuario_id

    await db.Notificacion.update(
      { leida: true },
      { 
        where: { 
          usuario_id: usuarioId, 
          leida: false 
        } 
      }
    );

    res.json({ success: true, message: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    console.error('Error al marcar todas:', error);
    next(error);
  }
};

module.exports = exports;
