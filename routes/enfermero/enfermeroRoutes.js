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
// Obtener médicos del sector Urgencias
router.get('/api/medicos/urgencias', enfermeroController.obtenerMedicosUrgencias);

// Obtener horarios disponibles de un médico
router.get('/api/medicos/:medicoId/horarios', enfermeroController.obtenerHorariosMedico);

// Asignar turno desde evaluación de enfermería
router.post('/api/turnos/asignar', enfermeroController.asignarTurnoDesdeEvaluacion);

module.exports = router;