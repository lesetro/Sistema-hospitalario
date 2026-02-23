const express = require('express');
const router = express.Router();
const pacienteNotificacionesController = require('../../controllers/paciente/pacienteNotificacionesController');
const authMiddleware = require('../../middleware/authMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================
router.use(authMiddleware);

// ========================================
// VISTAS
// ========================================
router.get('/', pacienteNotificacionesController.getNotificaciones);

// ========================================
// APIs
// ========================================
router.post('/:id/marcar-leida', pacienteNotificacionesController.marcarLeida);
router.post('/marcar-todas-leidas', pacienteNotificacionesController.marcarTodasLeidas);

module.exports = router;
