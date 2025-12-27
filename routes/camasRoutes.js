const express = require('express');
const router = express.Router();
const { 
  finalizarLimpiezaCama, 
  getEstadoCamasPorSector 
} = require('../controllers/camasController');

// Obtener estado de todas las camas por sector
router.get('/estado-por-sector', getEstadoCamasPorSector);

// Finalizar limpieza de cama específica 
router.post('/:cama_id/finalizar-limpieza', finalizarLimpiezaCama);

// Obtener estado de una cama específica
router.get('/:cama_id', async (req, res) => {
  try {
    const { cama_id } = req.params;
    const { Cama, Habitacion, Sector } = require('../models');
    
    const cama = await Cama.findByPk(cama_id, {
      include: [{
        model: Habitacion,
        as: 'habitacion',
        include: [{
          model: Sector,
          as: 'sector',
          attributes: ['id', 'nombre']
        }],
        attributes: ['id', 'numero', 'tipo', 'sexo_permitido']
      }],
      attributes: ['id', 'numero', 'estado', 'sexo_ocupante', 'fecha_fin_limpieza', 'created_at', 'updated_at']
    });

    if (!cama) {
      return res.status(404).json({ message: 'Cama no encontrada' });
    }

    res.json({ cama });
  } catch (error) {
    console.error('Error al obtener cama:', error);
    res.status(500).json({ 
      message: 'Error al obtener información de la cama', 
      error: error.message 
    });
  }
});

module.exports = router;