const db = require('../../models');

/**
 * CONTROLADOR: Reclamos y Sugerencias del Paciente
 */

// GET /paciente/reclamos - Lista de reclamos
exports.getReclamos = async (req, res, next) => {
  try {
    const usuarioId = req.user.usuario_id;  // ✅ Para reclamos usamos usuario_id
    const { page = 1 } = req.query;
    const limit = 10;
    const offset = (page - 1) * limit;

    const { count, rows: reclamos } = await db.Reclamo.findAndCountAll({
      where: { usuario_id: usuarioId },
      order: [['fecha', 'DESC']],
      limit,
      offset
    });

    const estadisticas = {
      total: count,
      pendientes: await db.Reclamo.count({ 
        where: { 
          usuario_id: usuarioId, 
          estado: 'Pendiente' 
        } 
      }),
      resueltos: await db.Reclamo.count({ 
        where: { 
          usuario_id: usuarioId, 
          estado: 'Resuelto' 
        } 
      })
    };

    const totalPages = Math.ceil(count / limit);

    res.render('dashboard/paciente/reclamos', {
      title: 'Reclamos y Sugerencias',
      user: req.user,
      reclamos,
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
    console.error('Error al obtener reclamos:', error);
    next(error);
  }
};

// POST /paciente/reclamos - Crear reclamo
exports.postReclamo = async (req, res, next) => {
  try {
    const usuarioId = req.user.usuario_id;  // ✅ Para reclamos usamos usuario_id
    const { texto } = req.body;

    if (!texto || texto.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'El reclamo debe tener al menos 10 caracteres' });
    }

    await db.Reclamo.create({
      usuario_id: usuarioId,
      texto: texto.trim(),
      fecha: new Date(),
      estado: 'Pendiente'
    });

    res.json({ success: true, message: 'Reclamo enviado exitosamente' });
  } catch (error) {
    console.error('Error al crear reclamo:', error);
    next(error);
  }
};

module.exports = exports;