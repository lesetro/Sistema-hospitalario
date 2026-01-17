const express = require('express');
const router = express.Router();
const evaluacionesController = require('../../controllers/enfermero/evaluacionesEnfermeriaController');
const authMiddleware = require('../../middleware/authMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================
router.use(authMiddleware);

// Rutas principales
router.get('/', evaluacionesController.listarEvaluaciones);
router.get('/nueva', evaluacionesController.formularioNuevaEvaluacion);
router.post('/nueva', evaluacionesController.crearEvaluacion);
router.get('/:id', evaluacionesController.verEvaluacion);
router.put('/:id', evaluacionesController.actualizarEvaluacion);
router.post('/:id/completar', evaluacionesController.completarEvaluacion);
router.post('/:id/derivar-medico', evaluacionesController.derivarMedico);

// API endpoints
router.get('/api/medicos', evaluacionesController.buscarMedicos);
router.post('/api/exportar-pdf', evaluacionesController.exportarPDF);

module.exports = router;