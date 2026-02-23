const express = require('express');
const router = express.Router();
const pacienteEstudiosController = require('../../controllers/paciente/pacienteEstudiosController');
const authMiddleware = require('../../middleware/authMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================
router.use(authMiddleware);

// ========================================
// VISTAS
// ========================================
router.get('/', pacienteEstudiosController.getEstudios);
router.get('/:id', pacienteEstudiosController.getDetalleEstudio);

// ========================================
// APIs
// ========================================
router.get('/api/pendientes', pacienteEstudiosController.getEstudiosPendientes);

module.exports = router;
