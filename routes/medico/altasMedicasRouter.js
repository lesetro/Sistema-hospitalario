const express = require('express');
const router = express.Router();
const altasMedicasController = require('../../controllers/medico/altasMedicasController');
const authMiddleware = require('../../middleware/authMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================
router.use(authMiddleware);

// ========================================
// VISTAS
// ========================================
router.get('/', altasMedicasController.renderAltasMedicas);

// ========================================
// APIs - ESPECÍFICAS PRIMERO
// ========================================

// Obtener pendientes de alta
router.get('/api/altas/pendientes', altasMedicasController.obtenerPendientesAlta);

// Obtener por ID
router.get('/api/altas/:id', altasMedicasController.obtenerAltaPorId);

// ========================================
// APIs - GENÉRICAS DESPUÉS
// ========================================

// Listar altas (con filtros y paginación)
router.get('/api/altas', altasMedicasController.obtenerAltas);

// Recientes
router.get('/api/altas/recientes', altasMedicasController.obtenerAltasRecientes);

// Crear alta
router.post('/api/altas', altasMedicasController.crearAlta);

// Pacientes para filtro
router.get('/api/pacientes-filtro', altasMedicasController.obtenerPacientesParaFiltro);

// Estadísticas
router.get('/api/estadisticas', altasMedicasController.obtenerEstadisticas);

module.exports = router;