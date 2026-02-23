const express = require('express');
const router = express.Router();
const pacienteTurnosController = require('../../controllers/paciente/pacienteTurnosController');
const authMiddleware = require('../../middleware/authMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================
router.use(authMiddleware);

// ========================================
// VISTAS
// ========================================
router.get('/', pacienteTurnosController.getTurnos);
router.get('/:id', pacienteTurnosController.getDetalleTurno);

// ========================================
// APIs
// ========================================
router.get('/api/proximos', pacienteTurnosController.getProximosTurnos);
router.post('/api/:id/confirmar', pacienteTurnosController.confirmarTurno);
router.post('/api/:id/cancelar', pacienteTurnosController.cancelarTurno);

module.exports = router;
