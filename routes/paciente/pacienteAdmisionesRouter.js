const express = require('express');
const router = express.Router();
const pacienteAdmisionesController = require('../../controllers/paciente/pacienteAdmisionesController');
const authMiddleware = require('../../middleware/authMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================
router.use(authMiddleware);

// ========================================
// VISTAS
// ========================================
router.get('/', pacienteAdmisionesController.getAdmisiones);
router.get('/:id', pacienteAdmisionesController.getDetalleAdmision);

// ========================================
// APIs
// ========================================
router.get('/api/recientes', pacienteAdmisionesController.getAdmisionesRecientes);

module.exports = router;
