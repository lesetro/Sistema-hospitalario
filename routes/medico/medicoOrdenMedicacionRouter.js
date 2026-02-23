const express = require('express');
const router = express.Router();
const ordenesController = require('../../controllers/medico/ordenMedicacionController');
const authMiddleware = require('../../middleware/authMiddleware');
const { verificarRol } = require('../../middleware/roleMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN Y ROL
// ========================================
router.use(authMiddleware);
router.use(verificarRol('MEDICO')); // Solo médicos

// ========================================
// RUTAS DEL MÉDICO - CRUD COMPLETO
// ========================================

// C - CREATE
router.get('/crear', ordenesController.formularioCrear);
router.post('/crear', ordenesController.crear);

// R - READ
router.get('/', ordenesController.listar);
router.get('/:id', ordenesController.verDetalle);

// U - UPDATE
router.get('/:id/editar', ordenesController.formularioEditar);
router.post('/:id', ordenesController.editar);

// D - DELETE (Cancelar)
router.delete('/:id', ordenesController.eliminar);

// ========================================
// RUTAS API
// ========================================
router.get('/api/buscar-paciente', ordenesController.buscarPacienteParaMedicacion);

// API: Obtener órdenes de medicación de un paciente
router.get('/api/paciente/:paciente_id/ordenes', ordenesController.obtenerOrdenesPaciente);

module.exports = router;