const express = require('express');
const router = express.Router();
const estudiosSolicitadosController = require('../../controllers/medico/estudiosSolicitadosController');
const authMiddleware = require('../../middleware/authMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================
// ✅ CRÍTICO: authMiddleware DEBE estar aquí
router.use(authMiddleware);

// ========================================
// VISTAS (Renderizadas en servidor)
// ========================================

// Vista principal de estudios solicitados
router.get('/', estudiosSolicitadosController.renderEstudiosSolicitados);

// ========================================
// APIs - ESTUDIOS PRINCIPALES
// ========================================

// ✅ ORDEN: Rutas específicas PRIMERO, genéricas DESPUÉS

// Obtener tipos de estudio
router.get('/api/tipos-estudio', estudiosSolicitadosController.obtenerTiposEstudio);

// Obtener distribución por categoría
router.get('/api/por-categoria', estudiosSolicitadosController.obtenerEstudiosPorCategoria);

// Obtener estudio específico por ID
router.get('/api/estudios/:id', estudiosSolicitadosController.obtenerEstudioPorId);

// Cancelar estudio específico
router.delete('/api/estudios/:id/cancelar', estudiosSolicitadosController.cancelarEstudio);

// Obtener todos los estudios (con filtros y paginación)
router.get('/api/estudios', estudiosSolicitadosController.obtenerEstudios);

// Crear nuevo estudio
router.post('/api/estudios', estudiosSolicitadosController.crearEstudio);

// Actualizar estudio
router.put('/api/estudios/:id', estudiosSolicitadosController.actualizarEstudio);

// ========================================
// APIs - ESTADÍSTICAS
// ========================================

// Obtener estadísticas de estudios
router.get('/api/estadisticas', estudiosSolicitadosController.obtenerEstadisticas);

module.exports = router;