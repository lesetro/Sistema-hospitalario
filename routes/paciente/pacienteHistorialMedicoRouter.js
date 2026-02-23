const express = require('express');
const router = express.Router();
const pacienteHistorialMedicoController = require('../../controllers/paciente/pacienteHistorialMedicoController');
const authMiddleware = require('../../middleware/authMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================
router.use(authMiddleware);

// ========================================
// VISTAS
// ========================================
router.get('/', pacienteHistorialMedicoController.getHistorialMedico);
router.get('/timeline', pacienteHistorialMedicoController.getTimeline);

// ========================================
// APIs
// ========================================
router.get('/api/resumen', pacienteHistorialMedicoController.getResumen);

module.exports = router;
