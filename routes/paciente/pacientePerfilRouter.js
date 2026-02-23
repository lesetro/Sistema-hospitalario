const express = require('express');
const router = express.Router();
const pacientePerfilController = require('../../controllers/paciente/pacientePerfilController');
const authMiddleware = require('../../middleware/authMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================
router.use(authMiddleware);

// ========================================
// VISTAS
// ========================================
router.get('/', pacientePerfilController.getPerfil);
router.get('/datos-personales', pacientePerfilController.getDatosPersonales);

// ========================================
// APIs
// ========================================
router.post('/api/datos-personales', pacientePerfilController.postDatosPersonales);

module.exports = router;
