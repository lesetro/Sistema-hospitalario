const express = require('express');
const router = express.Router();
const recetasCertificadosController = require('../../controllers/medico/recetasCertificadosController');
const authMiddleware = require('../../middleware/authMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================
router.use(authMiddleware);

// ========================================
// VISTAS
// ========================================
router.get('/', recetasCertificadosController.renderRecetasCertificados);

// ========================================
// APIs - ESPECÍFICAS PRIMERO
// ========================================

// Generar PDF
router.get('/api/items/:id/pdf', recetasCertificadosController.generarPDF);

// Obtener por ID
router.get('/api/items/:id', recetasCertificadosController.obtenerPorId);

// ========================================
// APIs - GENÉRICAS DESPUÉS
// ========================================

// Listar items (con filtros y paginación)
router.get('/api/items', recetasCertificadosController.obtenerRecetasCertificados);

// Recientes
router.get('/api/items/recientes', recetasCertificadosController.obtenerRecientes);

// Crear item
router.post('/api/items', recetasCertificadosController.crear);

// Actualizar item
router.put('/api/items/:id', recetasCertificadosController.actualizar);

// Eliminar item
router.delete('/api/items/:id', recetasCertificadosController.eliminar);

// Pacientes para filtro
router.get('/api/pacientes-filtro', recetasCertificadosController.obtenerPacientesParaFiltro);

// Estadísticas
router.get('/api/estadisticas', recetasCertificadosController.obtenerEstadisticas);

module.exports = router;