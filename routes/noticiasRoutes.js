const express = require('express');
const router = express.Router();
const controller = require('../controllers/noticiasController');

router.get('/', controller.getVistaNoticias);
router.get('/api/estadisticas', controller.getEstadisticas);
router.get('/api/lista', controller.getListaNoticias);
router.get('/api/detalle/:id', controller.getDetalleNoticia);
router.post('/api/crear', controller.crearNoticia);
router.put('/api/actualizar/:id', controller.actualizarNoticia);
router.delete('/api/eliminar/:id', controller.eliminarNoticia);
router.put('/api/restaurar/:id', controller.restaurarNoticia);

module.exports = router;