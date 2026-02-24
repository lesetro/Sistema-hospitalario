const express = require('express');
const router = express.Router();
const ordenesController = require('../../controllers/medico/ordenPrequirurgicoController');
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
router.put('/:id', ordenesController.editar);

// D - DELETE (Cancelar)
router.delete('/:id', ordenesController.eliminar);

// Enviar a cirugía
router.post('/:id/enviar-cirugia', ordenesController.enviarACirugia);


// ========================================
// RUTAS API
// ========================================

// API: Obtener órdenes pre-quirúrgicas de un paciente
router.get('/api/paciente/:paciente_id/ordenes', ordenesController.obtenerOrdenesPaciente);
router.get('/api/buscar-paciente', ordenesController.buscarPacienteConEvaluaciones);
// Obtener quirófanos disponibles
router.get('/api/quirofanos-disponibles', ordenesController.obtenerQuirofanosDisponibles);

module.exports = router;