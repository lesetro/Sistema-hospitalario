const express = require('express');
const router = express.Router();
const facturaController = require('../controllers/facturaController');
const authMiddleware = require('../middleware/authMiddleware');

// ============================================================================
// MIDDLEWARE: Todas las rutas requieren autenticación
// ============================================================================
router.use(authMiddleware);

// ============================================================================
// VISTA PRINCIPAL
// ============================================================================
router.get('/', facturaController.getVistaFacturas);

// ============================================================================
// API - CONSULTAS
// ============================================================================
router.get('/api/lista', facturaController.getListaFacturas);
router.get('/api/:id/detalles', facturaController.getDetallesFactura);
router.get('/api/paciente/:paciente_id/admisiones', facturaController.getAdmisionesPaciente);

// ============================================================================
// API - CÁLCULOS Y CREACIÓN
// ============================================================================
router.post('/api/calcular-monto', facturaController.calcularMontoFactura);
router.post('/api/crear', facturaController.crearFactura);

// ============================================================================
// API - PAGOS Y GESTIÓN
// ============================================================================
router.post('/api/:id/pago', facturaController.registrarPago);
router.put('/api/:id/anular', facturaController.anularFactura);

module.exports = router;