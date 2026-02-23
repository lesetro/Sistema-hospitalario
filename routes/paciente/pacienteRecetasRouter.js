const express = require('express');
const router = express.Router();
const pacienteRecetasController = require('../../controllers/paciente/pacienteRecetasController');
const authMiddleware = require('../../middleware/authMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================
router.use(authMiddleware);

// ========================================
// VISTAS
// ========================================
router.get('/', pacienteRecetasController.getRecetas);

// ========================================
// APIs - ESPECÍFICAS PRIMERO
// ========================================
router.get('/api/recientes', pacienteRecetasController.getRecetasRecientes);

// ========================================
// VISTAS - RUTAS DINÁMICAS AL FINAL
// ========================================
router.get('/:id', pacienteRecetasController.getDetalleReceta);

module.exports = router;