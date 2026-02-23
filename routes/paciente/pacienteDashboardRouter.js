const express = require('express');
const router = express.Router();
const pacienteDashboardController = require('../../controllers/paciente/pacienteDashboardController');
const authMiddleware = require('../../middleware/authMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================
router.use(authMiddleware);

// ========================================
// VISTAS
// ========================================
router.get('/', pacienteDashboardController.getDashboard);

// ========================================
// APIs
// ========================================
router.get('/resumen-rapido', pacienteDashboardController.getResumenRapido);

module.exports = router;
