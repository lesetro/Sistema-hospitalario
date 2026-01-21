const express = require('express');
const router = express.Router();
const intervencionesController = require('../../controllers/medico/intervencionesController');
const authMiddleware = require('../../middleware/authMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================
router.use(authMiddleware);

// ========================================
// VISTAS
// ========================================
router.get('/', intervencionesController.renderIntervenciones);

// ========================================
// APIs - ESPECÍFICAS PRIMERO (importantes!)
// ========================================

// Intervenciones próximas (ESPECÍFICA - ANTES de /:id)
router.get('/api/intervenciones/proximas', intervencionesController.obtenerIntervencionesProximas);

// Intervención por ID
router.get('/api/intervenciones/:id', intervencionesController.obtenerIntervencionPorId);

// Finalizar intervención (PUT específica)
router.put('/api/intervenciones/:id/finalizar', intervencionesController.finalizarIntervencion);

// ========================================
// APIs - GENÉRICAS DESPUÉS
// ========================================

// Listar todas (con filtros y paginación)
router.get('/api/intervenciones', intervencionesController.obtenerIntervenciones);

// Crear intervención
router.post('/api/intervenciones', intervencionesController.crearIntervencion);

// Actualizar intervención
router.put('/api/intervenciones/:id', intervencionesController.actualizarIntervencion);

// Habitaciones disponibles
router.get('/api/habitaciones', intervencionesController.obtenerHabitacionesDisponibles);

// Estadísticas
router.get('/api/estadisticas', intervencionesController.obtenerEstadisticas);

module.exports = router;