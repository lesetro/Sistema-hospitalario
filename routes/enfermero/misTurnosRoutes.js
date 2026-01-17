const express = require('express');
const router = express.Router();
const misTurnosController = require('../../controllers/enfermero/misTurnosController');
const authMiddleware = require('../../middleware/authMiddleware');


// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================
router.use(authMiddleware);

// Rutas principales
router.get('/', misTurnosController.misTurnos);
router.get('/:id', misTurnosController.verTurno);

// API endpoints
router.get('/api/turnos-dia', misTurnosController.turnosDelDia);
router.get('/api/turnos-semana', misTurnosController.turnosSemana);
router.get('/api/exportar-calendario', misTurnosController.exportarCalendario);

module.exports = router;