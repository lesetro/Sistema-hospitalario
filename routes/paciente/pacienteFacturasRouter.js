const express = require('express');
const router = express.Router();
const pacienteFacturasController = require('../../controllers/paciente/pacienteFacturasController');
const authMiddleware = require('../../middleware/authMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================
router.use(authMiddleware);

// ========================================
// VISTAS
// ========================================
router.get('/', pacienteFacturasController.getFacturas);
router.get('/:id', pacienteFacturasController.getDetalleFactura);

// ========================================
// APIs
// ========================================
router.get('/api/pendientes', pacienteFacturasController.getFacturasPendientes);

module.exports = router;
