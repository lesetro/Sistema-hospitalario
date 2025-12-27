
const express = require('express');
const router = express.Router();
const controller = require('../controllers/reclamoDerivacionController');

// Vista principal
router.get('/', controller.getVistaReclamosDerivaciones);

// ============================================================================
// RECLAMOS
// ============================================================================
router.get('/api/reclamos', controller.getListaReclamos);
router.get('/api/reclamos/estadisticas', controller.getEstadisticasReclamos);
router.put('/api/reclamos/:id/estado', controller.cambiarEstadoReclamo);

// ============================================================================
// DERIVACIONES
// ============================================================================
router.get('/api/derivaciones', controller.getListaDerivaciones);
router.get('/api/derivaciones/estadisticas', controller.getEstadisticasDerivaciones);
router.get('/api/derivaciones/:id/detalles', controller.getDetallesDerivacion);
router.put('/api/derivaciones/:id', controller.editarDerivacion);
router.put('/api/derivaciones/:id/estado', controller.cambiarEstadoDerivacion);

module.exports = router;