const express = require('express');
const router = express.Router();
const controlesController = require('../../controllers/enfermero/controlesController');
const authMiddleware = require('../../middleware/authMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================
router.use(authMiddleware);

// Rutas principales
router.get('/', controlesController.listarControles);
router.get('/nuevo', controlesController.formularioNuevoControl);
router.post('/nuevo', controlesController.crearControl);
router.get('/:id', controlesController.verControl);
router.put('/:id', controlesController.actualizarControl);

// API endpoints
router.get('/api/evaluaciones-sin-control', controlesController.buscarEvaluacionesSinControl);
router.get('/api/calcular-imc', controlesController.calcularIMC);
router.get('/api/historial/:paciente_id', controlesController.historialPaciente);

module.exports = router;