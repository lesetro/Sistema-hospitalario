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
// Creación de personal
router.get('/api/crear/datos', controller.getDatosCreacion);
router.post('/api/crear', controller.crearPersonal);

// Gestión
router.put('/api/:tipo/:id/asignar-sector', controller.asignarSector);
router.post('/api/turno', controller.gestionarTurno);
router.post('/api/cambio-turno', controller.solicitarCambioTurno);
router.post('/api/asignar-limpieza', controller.asignarLimpieza);
router.put('/api/:tipo/:id/baja', controller.bajaEmpleado);
router.get('/api/:tipo/:id/editar', controller.getDatosEdicion);
router.put('/api/:tipo/:id/editar', controller.editarEmpleado);


module.exports = router;