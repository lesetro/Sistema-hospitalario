const express = require('express');
const router = express.Router();
const pacienteReclamosController = require('../../controllers/paciente/pacienteReclamosController');
const authMiddleware = require('../../middleware/authMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================
router.use(authMiddleware);

// ========================================
// VISTAS
// ========================================
router.get('/', pacienteReclamosController.getReclamos);

// ========================================
// APIs
// ========================================
router.post('/api/reclamos', pacienteReclamosController.postReclamo);

module.exports = router;
