const express = require('express');
const router = express.Router();
const ordenesController = require('../../controllers/medico/ordenInternacionController');
const authMiddleware = require('../../middleware/authMiddleware');
const { verificarRol } = require('../../middleware/roleMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN Y ROL
// ========================================
router.use(authMiddleware);
router.use(verificarRol('MEDICO')); // Solo médicos

// Listar órdenes
router.get('/', ordenesController.listar);

// Formulario para crear orden (página completa)
router.get('/crear', ordenesController.formularioCrear);

// Ver detalle de orden
router.get('/:id', ordenesController.verDetalle);

// API: Buscar internaciones activas
router.get('/api/internaciones/buscar', ordenesController.buscarInternaciones);

// API: Obtener datos de internación para el modal
router.get('/api/internacion/:id', ordenesController.obtenerDatosInternacion);

// Crear orden (POST)
router.post('/crear', ordenesController.crear);

// Editar orden
router.put('/:id', ordenesController.editar);

// Cancelar orden
router.delete('/:id', ordenesController.eliminar);

// API: Obtener órdenes de un paciente internado
router.get('/api/paciente/:paciente_id/ordenes', ordenesController.obtenerOrdenesPaciente);

module.exports = router;