const express = require('express');
const router = express.Router();
const ordenesController = require('../../controllers/medico/ordenProcedimientoController');
const authMiddleware = require('../../middleware/authMiddleware');
const { verificarRol } = require('../../middleware/roleMiddleware');
const { route } = require('../homeRoutes');
// ========================================
// MIDDLEWARE DE AUTENTICACIÓN Y ROL
// ========================================
router.use(authMiddleware);
router.use(verificarRol('MEDICO')); // Solo médicos

// ========================================
// RUTAS DEL MÉDICO - CRUD 
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
//obtener las principal

// ========================================
// RUTAS API
// ========================================

//APi: consulta de paciente 
router.get('/api/pacientes/buscar-con-evaluaciones', ordenesController.buscarPacienteConEvaluaciones);
           

// API: Obtener órdenes de un paciente específico (para modales, formularios)
router.get('/api/paciente/:paciente_id/ordenes', ordenesController.obtenerOrdenesPaciente);


module.exports = router;