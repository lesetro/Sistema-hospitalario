const express = require('express');
const router = express.Router();
const internadosController = require('../../controllers/enfermero/internadosController');
const authMiddleware = require('../../middleware/authMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================
router.use(authMiddleware);

// Rutas principales
router.get('/', internadosController.listarInternados);
router.get('/:id', internadosController.verInternacion);
router.post('/:id/actualizar-estado', internadosController.actualizarEstadoPaciente);
router.post('/:id/evolucion', internadosController.registrarEvolucion);

// API endpoints
router.get('/api/estadisticas', internadosController.estadisticas);
router.get('/api/buscar', internadosController.buscarInternado);
router.get('/api/sector/:sector_id', internadosController.pacientesPorSector);

module.exports = router;