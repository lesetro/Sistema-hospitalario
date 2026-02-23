const express = require('express');
const router = express.Router();
const altasMedicasController = require('../../controllers/medico/altasMedicasController');
const authMiddleware = require('../../middleware/authMiddleware');

// Aplicar middleware de autenticación y verificación de rol
router.use(authMiddleware);

// ========================================
// RUTAS DE VISTAS
// ========================================
// GET - Renderizar vista principal de altas médicas
router.get('/', altasMedicasController.renderAltasMedicas);

// ========================================
// RUTAS DE API - ESTADÍSTICAS
// ========================================
// GET - Obtener estadísticas de altas
router.get('/estadisticas', altasMedicasController.obtenerEstadisticas);

// ========================================
// RUTAS DE API - ALTAS
// ========================================
// GET - Obtener listado de altas con filtros y paginación
router.get('/altas', altasMedicasController.obtenerAltas);

// GET - Obtener altas recientes
router.get('/altas/recientes', altasMedicasController.obtenerAltasRecientes);

// GET - Obtener alta específica por ID
router.get('/altas/:id', altasMedicasController.obtenerAltaPorId);

// POST - Crear nueva alta médica
router.post('/altas', altasMedicasController.crearAlta);

// ========================================
// RUTAS DE API - PENDIENTES
// ========================================
// GET - Obtener pendientes de alta (internaciones, admisiones, solicitudes)
router.get('/pendientes', altasMedicasController.obtenerPendientesAlta);

// ========================================
// RUTAS DE API - SOLICITUDES DE ENFERMERÍA
// ========================================
// POST - Crear alta desde solicitud de enfermería
router.post('/solicitud', altasMedicasController.crearAltaDesdeSolicitud);

// ========================================
// RUTAS DE API - UTILIDADES
// ========================================
// GET - Obtener pacientes para filtro
router.get('/pacientes/filtro', altasMedicasController.obtenerPacientesParaFiltro);

module.exports = router;