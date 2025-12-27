const express = require('express');
const router = express.Router();
const controller = require('../controllers/mensajeriaController');

router.get('/', controller.getVistaMensajeria);
router.get('/api/estadisticas', controller.getEstadisticas);
router.get('/api/contador', controller.getContadorNoLeidos);
router.get('/api/mensajes', controller.getMensajes);
router.post('/api/enviar', controller.enviarMensaje);
router.put('/api/mensajes/:id/leer', controller.marcarComoLeido);
router.put('/api/mensajes/leer-todos', controller.marcarTodosLeidos);
router.delete('/api/mensajes/:id', controller.eliminarMensaje);
router.put('/api/mensajes/:id/restaurar', controller.restaurarMensaje);

module.exports = router;