const express = require('express');
const router = express.Router();
const estudiosSolicitadosController = require('../../controllers/medico/estudiosSolicitadosController');
const authMiddleware = require('../../middleware/authMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN Y AUTORIZACIÓN
// ========================================
router.use(authMiddleware);

// Vista principal de estudios solicitados
router.get('/', estudiosSolicitadosController.renderEstudiosSolicitados);

// ========================================
// APIs - ESTUDIOS PRINCIPALES
// ========================================

// 1. Obtener tipos de estudio (para formularios)
router.get('/api/tipos-estudio', estudiosSolicitadosController.obtenerTiposEstudio);

// 2. Obtener distribución por categoría (para gráficos)
router.get('/api/por-categoria', estudiosSolicitadosController.obtenerEstudiosPorCategoria);

// 3. Obtener estadísticas (para dashboard)
router.get('/api/estadisticas', estudiosSolicitadosController.obtenerEstadisticas);

// 4. Obtener todos los estudios (con filtros y paginación)
router.get('/api/estudios', estudiosSolicitadosController.obtenerEstudios);

// 5. Crear nuevo estudio
router.post('/api/estudios', estudiosSolicitadosController.crearEstudio);

// ========================================
// APIs - OPERACIONES SOBRE UN ESTUDIO ESPECÍFICO
// ========================================

router.get('/api/estudios/:id', estudiosSolicitadosController.obtenerEstudioPorId);

router.put('/api/estudios/:id', estudiosSolicitadosController.actualizarEstudio);

// 8. Cancelar estudio (PUT /:id/cancelar)
router.put('/api/estudios/:id/cancelar', estudiosSolicitadosController.cancelarEstudio);

// 9. Completar estudio (PUT /:id/completar)
router.put('/api/estudios/:id/completar', estudiosSolicitadosController.completarEstudio);

// Buscar pacientes por DNI o nombre
router.get('/api/buscar-pacientes', estudiosSolicitadosController.buscarPacientes);

// Obtener evaluaciones de un paciente específico
router.get('/api/paciente/:pacienteId/evaluaciones', estudiosSolicitadosController.obtenerEvaluacionesPaciente);


module.exports = router;