
const express = require('express');
const router = express.Router();
const pacienteController = require('../../controllers/admin/pacienteController');
const authMiddleware = require('../../middleware/authMiddleware');

// ============================================================================
// MIDDLEWARE: Todas las rutas requieren autenticación
// ============================================================================
router.use(authMiddleware);

// ============================================================================
// VISTA PRINCIPAL
// ============================================================================
router.get('/', pacienteController.getVistaPacientes);

// ============================================================================
// API - CONSULTAS
// ============================================================================
router.get('/api/lista', pacienteController.getListaPacientes);
router.get('/api/:id/detalles', pacienteController.getDetallesPaciente);

// ============================================================================
// API - ACTUALIZACIÓN Y GESTIÓN
// ============================================================================
router.put('/api/:id', pacienteController.actualizarPaciente);
router.put('/api/:id/baja', pacienteController.bajaPaciente);
router.put('/api/:id/reactivar', pacienteController.reactivarPaciente);

module.exports = router;