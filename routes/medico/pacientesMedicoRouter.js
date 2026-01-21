const express = require('express');
const router = express.Router();
const pacientesMedicoController = require('../../controllers/medico/pacientesMedicoController');
const authMiddleware = require('../../middleware/authMiddleware');

// ✅ Middleware de autenticación y rol
router.use(authMiddleware);

// ✅ Vista principal
router.get('/', pacientesMedicoController.renderPacientes);

// ✅ APIs
router.get('/api/pacientes', pacientesMedicoController.obtenerPacientes);
router.get('/api/pacientes/:id', pacientesMedicoController.obtenerPacienteDetalle);
router.get('/api/pacientes/:pacienteId/historial', pacientesMedicoController.obtenerHistorialPaciente);
router.get('/api/pacientes/:pacienteId/evaluaciones', pacientesMedicoController.obtenerEvaluacionesPaciente);
router.get('/api/obras-sociales', pacientesMedicoController.obtenerObrasSociales);
router.get('/api/estadisticas', pacientesMedicoController.obtenerEstadisticasPacientes);

module.exports = router;