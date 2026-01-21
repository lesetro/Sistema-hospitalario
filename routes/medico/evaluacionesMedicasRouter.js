const express = require('express');
const router = express.Router();
const evaluacionesMedicasController = require('../../controllers/medico/evaluacionesMedicasController');
const authMiddleware = require('../../middleware/authMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================

router.use(authMiddleware);

// ========================================
// VISTAS (Renderizadas en servidor)
// ========================================

// Vista principal de evaluaciones
router.get('/', evaluacionesMedicasController.renderEvaluaciones);

// ========================================
// APIs - EVALUACIONES
// ========================================

// Obtener evaluaciones con filtros y paginación
router.get('/api/evaluaciones', evaluacionesMedicasController.obtenerEvaluaciones);

// Obtener una evaluación específica
router.get('/api/evaluaciones/:id', evaluacionesMedicasController.obtenerEvaluacionPorId);

// Crear nueva evaluación
router.post('/api/evaluaciones', evaluacionesMedicasController.crearEvaluacion);

// Actualizar evaluación
router.put('/api/evaluaciones/:id', evaluacionesMedicasController.actualizarEvaluacion);

// ========================================
// APIs - CATÁLOGOS
// ========================================

// Obtener diagnósticos (con búsqueda)
router.get('/api/diagnosticos', evaluacionesMedicasController.obtenerDiagnosticos);

// Obtener tratamientos (con búsqueda)
router.get('/api/tratamientos', evaluacionesMedicasController.obtenerTratamientos);

// Obtener pacientes para filtro
router.get('/api/pacientes-filtro', evaluacionesMedicasController.obtenerPacientesParaFiltro);

// ========================================
// APIs - ESTADÍSTICAS
// ========================================

// Obtener estadísticas de evaluaciones
router.get('/api/estadisticas', evaluacionesMedicasController.obtenerEstadisticas);

module.exports = router;