const express = require('express');
const router = express.Router();
const prequirurgicosController = require('../../controllers/enfermero/prequirurgicosController');
const authMiddleware = require('../../middleware/authMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================
router.use(authMiddleware);

// Rutas principales
router.get('/', prequirurgicosController.listarPrequirurgicos);
router.get('/:id', prequirurgicosController.verPrequirurgico);
router.get('/:id/completar', prequirurgicosController.formularioCompletar);
router.post('/:id/completar', prequirurgicosController.completarPrequirurgico);
router.post('/:id/complicacion', prequirurgicosController.registrarComplicacion);

// API endpoints
router.get('/api/checklist', prequirurgicosController.checklistEstandar);
router.get('/api/pendientes', prequirurgicosController.pendientes);

module.exports = router;