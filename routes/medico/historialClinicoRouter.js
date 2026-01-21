const express = require('express');
const router = express.Router();
const historialClinicoController = require('../../controllers/medico/historialClinicoController');
const authMiddleware = require('../../middleware/authMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================
router.use(authMiddleware);

// ========================================
// VISTAS
// ========================================
router.get('/', historialClinicoController.renderHistorialClinico);

// ========================================
// APIs - ESPECÍFICAS PRIMERO
// ========================================

// Línea de tiempo (específica)
router.get('/api/paciente/:pacienteId/linea-tiempo', historialClinicoController.obtenerLineaTiempo);

// Resumen (específica)
router.get('/api/paciente/:pacienteId/resumen', historialClinicoController.obtenerResumenHistorial);

// Info del paciente (específica)
router.get('/api/paciente/:pacienteId/info', historialClinicoController.obtenerInfoPaciente);

// Historial (específica)
router.get('/api/paciente/:pacienteId/historial', historialClinicoController.obtenerHistorialPaciente);

// ========================================
// APIs - GENÉRICAS DESPUÉS
// ========================================

// Crear entrada
router.post('/api/historial', historialClinicoController.crearEntradaHistorial);

module.exports = router;