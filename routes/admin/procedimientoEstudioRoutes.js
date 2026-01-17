
const express = require('express');
const router = express.Router();
const controller = require('../../controllers/admin/procedimientoEstudioController');

// Vista principal
router.get('/', controller.getVistaProcedimientosEstudios);

// Búsqueda de paciente
router.get('/api/buscar-paciente', controller.buscarPacientePorDNI);

// Datos del paciente
router.get('/api/paciente/:id/estudios', controller.getEstudiosPaciente);
router.get('/api/paciente/:id/evaluaciones', controller.getEvaluacionesPaciente);
router.get('/api/paciente/:id/procedimientos-prequirurgicos', controller.getProcedimientosPreQuirurgicos);
router.get('/api/paciente/:id/procedimientos-enfermeria', controller.getProcedimientosEnfermeria);
router.get('/api/paciente/:id/intervenciones', controller.getIntervencionesPaciente);
router.get('/api/paciente/:id/timeline', controller.getTimelinePaciente);

module.exports = router;