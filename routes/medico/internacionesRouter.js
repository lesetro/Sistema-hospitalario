const express = require('express');
const router = express.Router();
const internacionesController = require('../../controllers/medico/internacionesController');
const authMiddleware = require('../../middleware/authMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================
router.use(authMiddleware);

// ========================================
// VISTAS
// ========================================
router.get('/', internacionesController.renderInternaciones);

// ========================================
// APIs - ESPECÍFICAS PRIMERO
// ========================================

// Internaciones activas
router.get('/api/internaciones/activas', internacionesController.obtenerInternacionesActivas);

// Internación por ID
router.get('/api/internaciones/:id', internacionesController.obtenerInternacionPorId);

// Actualizar estado
router.put('/api/internaciones/:id/estado', internacionesController.actualizarEstado);

// ========================================
// APIs - GENÉRICAS DESPUÉS
// ========================================

// Listar internaciones (con filtros y paginación)
router.get('/api/internaciones', internacionesController.obtenerInternaciones);

// Tipos de internación
router.get('/api/tipos-internacion', internacionesController.obtenerTiposInternacion);

// Pacientes para filtro
router.get('/api/pacientes-filtro', internacionesController.obtenerPacientesParaFiltro);

// Estadísticas
router.get('/api/estadisticas', internacionesController.obtenerEstadisticas);

module.exports = router;