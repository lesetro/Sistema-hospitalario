const express = require('express');
const router = express.Router();
const procedimientosController = require('../../controllers/enfermero/procedimientosEnfermeriaController');
const authMiddleware = require('../../middleware/authMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================
router.use(authMiddleware);

// Rutas principales
router.get('/', procedimientosController.listarProcedimientos);
router.get('/:id', procedimientosController.verProcedimiento);
router.get('/:id/ejecutar', procedimientosController.formularioEjecutar);
router.post('/:id/ejecutar', procedimientosController.ejecutarProcedimiento);
router.post('/:id/complicacion', procedimientosController.registrarComplicacion);
router.post('/:id/cancelar', procedimientosController.cancelarProcedimiento);

// API endpoints
router.get('/api/pendientes', procedimientosController.procedimientosPendientes);
router.get('/api/tipos', procedimientosController.tiposProcedimientos);

module.exports = router;