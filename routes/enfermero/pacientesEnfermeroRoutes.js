const express = require('express');
const router = express.Router();
const pacientesController = require('../../controllers/enfermero/pacientesEnfermeroController');
const authMiddleware = require('../../middleware/authMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================
router.use(authMiddleware);

// Rutas principales
router.get('/', pacientesController.listarMisPacientes);
router.get('/:id', pacientesController.verPaciente);
router.get('/:id/historial', pacientesController.historialEvaluaciones);

// API endpoints
router.get('/api/busqueda', pacientesController.busquedaRapida);
router.get('/api/resumen/:id', pacientesController.resumenPaciente);
router.get('/api/estadisticas', pacientesController.misEstadisticas);

module.exports = router;