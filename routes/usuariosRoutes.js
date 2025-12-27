const express = require('express');
const router = express.Router();
const controller = require('../controllers/usuariosController');

// Vistas
router.get('/', controller.getVistaUsuarios);

// API endpoints
router.get('/api/lista', controller.getListaUsuarios);
router.get('/api/roles', controller.getRoles);
router.get('/api/:id/detalles', controller.getDetallesUsuario);
router.post('/api/crear', controller.crearUsuario);
router.put('/api/:id', controller.actualizarUsuario);
router.put('/api/:id/bloquear', controller.bloquearUsuario);
router.put('/api/:id/reset-password', controller.resetPassword);

module.exports = router;