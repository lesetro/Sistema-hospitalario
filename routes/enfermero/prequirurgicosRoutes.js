const express = require('express');
const router = express.Router();
const ordenesController = require('../../controllers/medico/ordenPrequirurgicoController');
const prequirurgicosController = require('../../controllers/enfermero/prequirurgicosController');
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

// R - READ (ver órdenes pre-quirúrgicas pendientes)
router.get('/', ordenesController.listar);
router.get('/:id', ordenesController.verDetalle);

// ========================================
// EJECUCIÓN DE PREPARACIÓN PRE-QUIRÚRGICA
// ========================================

// Formulario para completar preparación
router.get('/:id/completar', prequirurgicosController.formularioCompletar);

// Completar preparación pre-quirúrgica (checklist)
router.post('/:id/completar', prequirurgicosController.completarPrequirurgico);

// Registrar complicación pre-quirúrgica
router.post('/:id/complicacion', prequirurgicosController.registrarComplicacion);

// ========================================
// RUTAS API
// ========================================

// API: Obtener preparaciones pendientes
router.get('/api/pendientes', prequirurgicosController.pendientes);

// API: Obtener checklist estándar
router.get('/api/checklist', prequirurgicosController.checklistEstandar);

module.exports = router;