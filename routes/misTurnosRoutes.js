const express = require('express');
const router = express.Router();
const turnosController = require('../controllers/misTurnosController');

// Vista principal de turnos
router.get('/', turnosController.misTurnos);

// API para próximas fechas (NUEVA)
router.get('/api/proximas-fechas/:id', turnosController.getProximasFechas);

// API endpoints (para AJAX) - YA EXISTENTES
router.get('/api/turnos-del-dia', turnosController.turnosDelDia);
router.get('/api/turnos-semana', turnosController.turnosSemana);
router.get('/api/exportar-calendario', turnosController.exportarCalendario);

module.exports = router;