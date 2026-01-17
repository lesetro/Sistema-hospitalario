const express = require('express');
const router = express.Router();
const enfermeroController = require('../../controllers/enfermero/enfermeroController');
const authMiddleware = require('../../middleware/authMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================
router.use(authMiddleware);

// Dashboard principal
router.get('/', enfermeroController.dashboard);

// API endpoints
router.get('/api/resumen-actividad', enfermeroController.getResumenActividad);
router.get('/api/notificaciones', enfermeroController.getNotificaciones);

module.exports = router;