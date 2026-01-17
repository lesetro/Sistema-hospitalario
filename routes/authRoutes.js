const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// ==========================================
// RUTAS PÚBLICAS (sin autenticación)
// ==========================================

// Login
router.get('/login', authController.getLogin);
router.post('/login', authController.login);

// Registro
router.get('/register', authController.getRegister);
router.post('/register', authController.register);

// Recuperar contraseña
router.get('/recuperar-contrasena', authController.getRecuperarContrasena);
router.post('/recuperar-contrasena', authController.postRecuperarContrasena);

// Logout (puede ser GET o POST)
router.get('/logout', authController.logout);
router.post('/logout', authController.logout);

// ==========================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ==========================================

router.use(authMiddleware);

// Verificar token
router.get('/verify', authController.verifyToken);

// ========================================
// PERFIL DEL USUARIO (CENTRALIZADO)
// ========================================
// Se renderiza con el layout correcto según el rol del usuario

// Vista principal del perfil (GET)
// El layout se asigna automáticamente en el controller según el rol
router.get('/perfil', authController.renderPerfil);

// APIs de perfil
router.get('/api/perfil', authController.obtenerPerfil);
router.put('/api/perfil', authController.actualizarPerfil);

// Cambiar contraseña
router.put('/api/cambiar-password', authController.cambiarPassword);

module.exports = router;