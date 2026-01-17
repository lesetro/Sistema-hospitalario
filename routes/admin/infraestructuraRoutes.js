const express = require('express');
const router = express.Router();
const controller = require('../../controllers/admin/infraestructuraController');

// ============================================================================
// VISTAS
// ============================================================================

// Vista principal - Lista de sectores
router.get('/', controller.renderSectores);

// Vista de habitaciones de un sector
router.get('/sector/:sector_id/habitaciones', controller.renderHabitaciones);

// Vista de camas de una habitación
router.get('/habitacion/:habitacion_id/camas', controller.renderCamas);

// ============================================================================
// API - ESTADÍSTICAS
// ============================================================================
router.get('/api/estadisticas', controller.getEstadisticasGlobales);
router.get('/api/tipos-servicio', controller.getTiposServicio);

// ============================================================================
// API - SECTORES
// ============================================================================
router.get('/api/sector/:id', controller.getSectorById);
router.post('/api/sector', controller.crearSector);
router.put('/api/sector/:id', controller.actualizarSector);
router.delete('/api/sector/:id', controller.eliminarSector);

// ============================================================================
// API - HABITACIONES
// ============================================================================
router.get('/api/habitacion/:id', controller.getHabitacionById);
router.post('/api/habitacion', controller.crearHabitacion);
router.put('/api/habitacion/:id', controller.actualizarHabitacion);
router.delete('/api/habitacion/:id', controller.eliminarHabitacion);

// ============================================================================
// API - CAMAS
// ============================================================================
router.get('/api/cama/:id', controller.getCamaById);
router.post('/api/cama', controller.crearCama);
router.post('/api/camas/multiple', controller.crearCamasMultiples);
router.put('/api/cama/:id', controller.actualizarCama);
router.delete('/api/cama/:id', controller.eliminarCama);

module.exports = router;
