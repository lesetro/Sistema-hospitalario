const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Vista de login
router.get('/login', authController.getLogin);

// Procesar login
router.post('/login', authController.login);

// Vista de registro
router.get('/register', authController.getRegister);

// Procesar registro
router.post('/register', authController.register);

// Vista de recuperar contraseña
router.get('/recuperar-contrasena', authController.getRecuperarContrasena);



// Procesar solicitud de recuperación
router.post('/recuperar-contrasena', authController.postRecuperarContrasena);

// Verificar token (API)
router.get('/verify', authMiddleware, authController.verifyToken);

// Logout
router.get('/logout', authController.logout);
router.post('/logout', authController.logout);



module.exports = router;