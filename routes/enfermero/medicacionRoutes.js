const express = require('express');
const router = express.Router();
const medicacionController = require('../../controllers/enfermero/medicacionController');
const authMiddleware = require('../../middleware/authMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================
router.use(authMiddleware);

// Rutas principales
router.get('/', medicacionController.listarRecetas);
router.get('/:id', medicacionController.verReceta);
router.get('/:id/administrar', medicacionController.formularioAdministrar);
router.post('/:id/administrar', medicacionController.registrarAdministracion);

// API endpoints
router.get('/api/buscar-paciente', medicacionController.buscarPaciente);
router.get('/api/recetas/:paciente_id', medicacionController.recetasPaciente);
router.post('/api/verificar-interacciones', medicacionController.verificarInteracciones);
router.get('/api/estadisticas', medicacionController.estadisticas);

module.exports = router;