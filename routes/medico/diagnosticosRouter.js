const express = require('express');
const router = express.Router();
const diagnosticosController = require('../../controllers/medico/diagnosticosController');
const authMiddleware = require('../../middleware/authMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================
router.use(authMiddleware);

// ========================================
// VISTAS
// ========================================
router.get('/', diagnosticosController.renderDiagnosticos);

// ========================================
// APIs - ESPECÍFICAS PRIMERO
// ========================================

// Búsqueda rápida
router.get('/api/buscar', diagnosticosController.buscarDiagnosticos);

// Diagnósticos más utilizados
router.get('/api/diagnosticos/mas-utilizados', diagnosticosController.obtenerDiagnosticosMasUtilizados);

// Diagnósticos recientes
router.get('/api/diagnosticos/recientes', diagnosticosController.obtenerDiagnosticosRecientes);

// Diagnóstico por ID
router.get('/api/diagnosticos/:id', diagnosticosController.obtenerDiagnosticoPorId);

// Pacientes con diagnóstico
router.get('/api/diagnosticos/:id/pacientes', diagnosticosController.obtenerPacientesConDiagnostico);

// ========================================
// APIs - GENÉRICAS DESPUÉS
// ========================================

// Listar todos (con filtros y paginación)
router.get('/api/diagnosticos', diagnosticosController.obtenerDiagnosticos);

// Tipos de diagnóstico
router.get('/api/tipos-diagnostico', diagnosticosController.obtenerTiposDiagnostico);

// Estadísticas
router.get('/api/estadisticas', diagnosticosController.obtenerEstadisticas);

module.exports = router;