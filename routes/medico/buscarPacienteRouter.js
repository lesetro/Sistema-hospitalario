const express = require('express');
const router = express.Router();
const buscarPacienteController = require('../../controllers/medico/buscarPacienteController');
const authMiddleware = require('../../middleware/authMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================
router.use(authMiddleware);

// ========================================
// VISTAS
// ========================================
router.get('/', buscarPacienteController.renderBuscarPaciente);

// ========================================
// APIs - ESPECÍFICAS PRIMERO
// ========================================

// Búsqueda rápida (autocompletado)
router.get('/api/busqueda-rapida', buscarPacienteController.busquedaRapida);

// Obtener por ID
router.get('/api/paciente/:id', buscarPacienteController.obtenerDetallePaciente);
router.get('/api/paciente/:id/evaluaciones', buscarPacienteController.obtenerEvaluacionesPaciente);
router.get('/api/paciente/:id/turnos', buscarPacienteController.obtenerTurnosPaciente);
router.get('/api/paciente/:id/internaciones', buscarPacienteController.obtenerInternacionesPaciente);
router.get('/api/paciente/:id/historial', buscarPacienteController.obtenerHistorialPaciente);
router.get('/api/paciente/:id/recetas-certificados', buscarPacienteController.obtenerRecetasCertificadosPaciente);

// ========================================
// APIs - GENÉRICAS DESPUÉS
// ========================================

// Búsqueda
router.get('/api/buscar', buscarPacienteController.buscarPacientes);

// Catálogos
router.get('/api/obras-sociales', buscarPacienteController.obtenerObrasSociales);

module.exports = router;