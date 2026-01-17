const express = require('express');
const router = express.Router();
const controller = require('../../controllers/admin/altasMedicasController');

// Vista principal
router.get('/', controller.getVistaAltas);

// API endpoints
router.get('/api/estadisticas', controller.getEstadisticas);
router.get('/api/lista', controller.getListaAltas);
router.get('/api/detalle/:id', controller.getDetalleAlta);

module.exports = router;