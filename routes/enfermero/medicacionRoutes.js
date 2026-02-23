const express = require('express');
const router = express.Router();
const ordenesController = require('../../controllers/medico/ordenMedicacionController');
const medicacionController = require('../../controllers/enfermero/medicacionController');
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

// R - READ (ver órdenes de medicación pendientes)
router.get('/', medicacionController.listar);
router.get('/:id', ordenesController.verDetalle);

// ========================================
// ADMINISTRACIÓN DE MEDICACIÓN
// ========================================

// Formulario para administrar medicación
router.get('/:id/administrar', medicacionController.formularioAdministrar);

// Registrar administración de medicación
router.post('/:id/administrar', medicacionController.registrarAdministracion);

// ========================================
// RUTAS API Y BÚSQUEDA
// ========================================

// API: Buscar paciente para medicación
router.get('/api/buscar-paciente', medicacionController.buscarPaciente);

// API: Obtener recetas de un paciente
router.get('/api/paciente/:paciente_id/recetas', medicacionController.recetasPaciente);

// API: Verificar interacciones medicamentosas
router.post('/api/verificar-interacciones', medicacionController.verificarInteracciones);

// API: Estadísticas de medicación
router.get('/api/estadisticas', medicacionController.estadisticas);

module.exports = router;