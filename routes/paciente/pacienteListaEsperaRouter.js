const express = require('express');
const router = express.Router();
const pacienteListaEsperaController = require('../../controllers/paciente/pacienteListaEsperaController');
const authMiddleware = require('../../middleware/authMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================
router.use(authMiddleware);

// ========================================
// VISTAS
// ========================================
router.get('/', pacienteListaEsperaController.getListaEspera);
router.get('/:id', pacienteListaEsperaController.getDetalleSolicitud);

// ========================================
// APIs
// ========================================
router.get('/api/activas', pacienteListaEsperaController.getSolicitudesActivas);
router.post('/api/:id/cancelar', pacienteListaEsperaController.cancelarSolicitud);

module.exports = router;
