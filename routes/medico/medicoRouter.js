const express = require('express');
const router = express.Router();
const medicoController = require('../../controllers/medico/medicoController');
const authMiddleware = require('../../middleware/authMiddleware');

// Todas las rutas requieren autenticación y rol de médico
router.use(authMiddleware);

// Dashboard
router.get('/', medicoController.renderDashboard);

// APIs para el dashboard
router.get('/api/estadisticas', medicoController.obtenerEstadisticas);
router.get('/api/turnos-proximos', medicoController.obtenerTurnosProximos);
router.get('/api/pacientes-recientes', medicoController.obtenerPacientesRecientes);
router.get('/api/internaciones-en-curso', medicoController.obtenerInternacionesEnCurso);
router.get('/api/actividad-reciente', medicoController.obtenerActividadReciente);

module.exports = router;