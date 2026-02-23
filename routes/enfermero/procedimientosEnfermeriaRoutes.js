const express = require('express');
const router = express.Router();
const ordenesController = require('../../controllers/medico/ordenProcedimientoController');
const procedimientosController = require('../../controllers/enfermero/procedimientosEnfermeriaController');
const authMiddleware = require('../../middleware/authMiddleware');
const { verificarRol } = require('../../middleware/roleMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN Y ROL
// ========================================
router.use(authMiddleware);
router.use(verificarRol('ENFERMERO')); // Solo enfermeros

// ========================================
// RUTAS DEL ENFERMERO - SOLO LECTURA + EJECUCIÓN
// ========================================

// R - READ (ver órdenes pendientes)
router.get('/', ordenesController.listar);
router.get('/:id', ordenesController.verDetalle);

// ========================================
// EJECUCIÓN DE PROCEDIMIENTOS
// ========================================

// Formulario para ejecutar
router.get('/:id/ejecutar', procedimientosController.formularioEjecutar);

// Ejecutar procedimiento (crear evaluación de enfermería)
router.post('/:id/ejecutar', procedimientosController.ejecutarProcedimiento);

// Registrar complicación durante ejecución
router.post('/:id/complicacion', procedimientosController.registrarComplicacion);

// Cancelar procedimiento (con justificación)
router.post('/:id/cancelar', procedimientosController.cancelarProcedimiento);

// ========================================
// RUTAS API
// ========================================

// API: Obtener procedimientos pendientes (para dashboard)
router.get('/api/pendientes', procedimientosController.procedimientosPendientes);

// API: Obtener tipos de procedimientos comunes
router.get('/api/tipos', procedimientosController.tiposProcedimientos);

module.exports = router;