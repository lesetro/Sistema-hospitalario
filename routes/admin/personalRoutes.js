const express = require('express');
const router = express.Router();
const controller = require('../../controllers/admin/personalController');

// Vista principal
router.get('/', controller.getVistaPersonal);

// Estadísticas
router.get('/api/estadisticas', controller.getEstadisticas);

// Búsqueda y consultas
router.get('/api/buscar', controller.buscarPersonal);
router.get('/api/:tipo/:id/detalles', controller.getDetallesEmpleado);

// Gestión
router.put('/api/:tipo/:id/asignar-sector', controller.asignarSector);
router.post('/api/turno', controller.gestionarTurno);
router.post('/api/cambio-turno', controller.solicitarCambioTurno);
router.post('/api/asignar-limpieza', controller.asignarLimpieza);
router.put('/api/:tipo/:id/baja', controller.bajaEmpleado);

module.exports = router;