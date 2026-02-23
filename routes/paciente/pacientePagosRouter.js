const express = require('express');
const router = express.Router();
const pacientePagosController = require('../../controllers/paciente/pacientePagosController');
const authMiddleware = require('../../middleware/authMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================
router.use(authMiddleware);

// ========================================
// VISTAS
// ========================================
router.get('/', pacientePagosController.getPagos);
// RUTAS DE PAGOS
// ========================================
router.get('/pagos', pacientePagosController.getPagos);
router.get('/factura/:id', pacientePagosController.getDetalleFactura);
router.get('/pagos/:id/comprobante', pacientePagosController.getComprobantePago);

module.exports = router;
