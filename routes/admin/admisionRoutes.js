const express = require('express');
const router = express.Router();
const admisionController = require('../../controllers/admin/admisionController');
const authMiddleware = require('../../middleware/authMiddleware');

// ============================================================================
// MIDDLEWARE: Todas las rutas requieren autenticación
// ============================================================================
router.use(authMiddleware);

// ============================================================================
// VISTAS - RENDERIZADO DE PÁGINAS
// ============================================================================
// GET /admisiones - Vista principal
router.get('/', admisionController.renderAdmisiones);

// GET /admisiones/lista - Lista con paginación
router.get('/lista', admisionController.renderListaAdmisiones);

// ============================================================================
// API - BÚSQUEDA DE PACIENTES
// ============================================================================
// GET /admisiones/api/buscar-paciente?dni=12345678
router.get('/api/buscar-paciente', admisionController.buscarPacientePorDNI);

// GET /admisiones/api/search-pacientes?dni=123
router.get('/api/search-pacientes', admisionController.searchPacientes);

// ============================================================================
// API - MÉDICOS
// ============================================================================
// GET /admisiones/api/medicos-por-sector?sector_id=1
router.get('/api/medicos-por-sector', admisionController.getMedicosPorSector);

// GET /admisiones/api/medicos-por-especialidad?especialidad_id=1
router.get('/api/medicos-por-especialidad', admisionController.getMedicosPorEspecialidad);

// ============================================================================
// API - HORARIOS
// ============================================================================
// GET /admisiones/api/horarios-disponibles?fecha=2025-01-15&medico_id=1
router.get('/api/horarios-disponibles', admisionController.getHorariosDisponiblesMedico);

// ============================================================================
// API - PACIENTES
// ============================================================================
// POST /admisiones/api/crear-paciente
router.post('/api/crear-paciente', admisionController.crearPaciente);

// POST /admisiones/api/generar-temporal
router.post('/api/generar-temporal', admisionController.generarPacienteTemporal);

// ============================================================================
// API - URGENCIAS
// ============================================================================
// POST /admisiones/api/urgencia
router.post('/api/urgencia', admisionController.crearAdmisionUrgencia);

// ============================================================================
// API - ADMISIONES
// ============================================================================
// POST /admisiones/api/crear-admision
router.post('/api/crear-admision', admisionController.crearAdmision);

// GET /admisiones/api?page=1&limit=10&estado=Pendiente
router.get('/api', admisionController.getAdmisiones);

// GET /admisiones/api/:id
router.get('/api/:id', admisionController.getAdmisionById);

// PATCH /admisiones/api/:id/estado
router.patch('/api/:id/estado', admisionController.updateEstadoAdmision);

module.exports = router;