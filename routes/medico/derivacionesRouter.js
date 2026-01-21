const express = require('express');
const router = express.Router();
const derivacionesController = require('../../controllers/medico/derivacionesController');
const authMiddleware = require('../../middleware/authMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================
router.use(authMiddleware);

// ========================================
// VISTAS
// ========================================
router.get('/', derivacionesController.renderDerivaciones);

// ========================================
// APIs - ESPECÍFICAS PRIMERO
// ========================================

// Obtener derivaciones pendientes (debe ir ANTES de /:id)
router.get('/api/derivaciones/pendientes', derivacionesController.obtenerDerivacionesPendientes);

// Obtener por ID
router.get('/api/derivaciones/:id', derivacionesController.obtenerDerivacionPorId);

// Actualizar estado (específica)
router.put('/api/derivaciones/:id/estado', derivacionesController.actualizarEstado);

// ========================================
// APIs - GENÉRICAS DESPUÉS
// ========================================

// Listar derivaciones (con filtros y paginación)
router.get('/api/derivaciones', derivacionesController.obtenerDerivaciones);

// Crear derivación
router.post('/api/derivaciones', derivacionesController.crearDerivacion);

// Catálogos
router.get('/api/sectores', derivacionesController.obtenerSectores);
router.get('/api/pacientes-filtro', derivacionesController.obtenerPacientesParaFiltro);

// Estadísticas
router.get('/api/estadisticas', derivacionesController.obtenerEstadisticas);

module.exports = router;