const express = require('express');
const router = express.Router();
const controlesController = require('../../controllers/enfermero/controlesController');
const authMiddleware = require('../../middleware/authMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================
router.use(authMiddleware);

//  API primero — antes de /:id
router.get('/api/evaluaciones-sin-control', controlesController.buscarEvaluacionesSinControl);
router.get('/api/calcular-imc', controlesController.calcularIMC);
router.get('/api/historial/:paciente_id', controlesController.historialPaciente);

// Rutas principales
router.get('/', controlesController.listarControles);
router.get('/nuevo', controlesController.formularioNuevoControl);
router.post('/nuevo', controlesController.crearControl);

//  /editar antes de /:id
router.get('/:id/editar', controlesController.formularioEditarControl);
router.get('/:id', controlesController.verControl);


router.post('/:id', controlesController.actualizarControl);
router.put('/:id', controlesController.actualizarControl);

module.exports = router;