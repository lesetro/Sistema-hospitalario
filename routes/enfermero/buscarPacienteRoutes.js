const express = require('express');
const router = express.Router();
const buscarPacienteController = require('../../controllers/enfermero/buscarPacienteEnfermeroController');
const authMiddleware = require('../../middleware/authMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================
router.use(authMiddleware);

// Rutas principales
router.get('/', buscarPacienteController.vistaBusqueda);

// API endpoints
router.get('/api/buscar', buscarPacienteController.buscarPacientes);
router.get('/api/ficha-rapida/:id', buscarPacienteController.fichaRapida);
router.get('/api/busqueda-avanzada', buscarPacienteController.busquedaAvanzada);
router.get('/api/acceso-rapido/:id', buscarPacienteController.accesoRapido);

module.exports = router;