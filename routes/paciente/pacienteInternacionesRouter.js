const express = require('express');
const router = express.Router();
const pacienteInternacionesController = require('../../controllers/paciente/pacienteInternacionesController');
const authMiddleware = require('../../middleware/authMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================
router.use(authMiddleware);

// ========================================
// VISTAS
// ========================================
router.get('/', pacienteInternacionesController.getInternaciones);
router.get('/:id', pacienteInternacionesController.getDetalleInternacion);

// ========================================
// APIs
// ========================================
router.get('/api/activa', pacienteInternacionesController.getInternacionActiva);
router.get('/:id/estado', pacienteInternacionesController.getEstadoInternacion);

module.exports = router;