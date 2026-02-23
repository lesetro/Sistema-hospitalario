const express = require('express');
const router = express.Router();
const internadosController = require('../../controllers/enfermero/internadosController');
const ordenesInternacionController = require('../../controllers/medico/ordenInternacionController');
const authMiddleware = require('../../middleware/authMiddleware');
const { verificarRol } = require('../../middleware/roleMiddleware');

router.use(authMiddleware);
router.use(verificarRol('ENFERMERO'));

// ========================================
// APIs PRIMERO (antes que /:id)
// ========================================
router.get('/api/estadisticas', internadosController.estadisticas);
router.get('/api/buscar', internadosController.buscarInternado);
router.get('/api/sector/:sector_id', internadosController.pacientesPorSector);
// ========================================
// ÓRDENES ESPECÍFICAS
// ========================================
router.get('/paciente/:paciente_id/ordenes', ordenesInternacionController.listarOrdenesPaciente);
router.get('/orden/:id', ordenesInternacionController.verDetalle);
router.post('/orden/:id/ejecutar', ordenesInternacionController.ejecutarOrden);

// ========================================
// INTERNACIONES GENERALES (AL FINAL)
// ========================================
router.get('/', internadosController.listarInternados);
router.get('/:id/controles', internadosController.verControles);
router.get('/:id', internadosController.verInternacion); // ← Al final para no capturar otras rutas
router.post('/:id/actualizar-estado', internadosController.actualizarEstadoPaciente);
router.post('/:id/registrar-evolucion', internadosController.registrarEvolucion);

module.exports = router;