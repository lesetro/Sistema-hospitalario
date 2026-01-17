const express = require('express');
const router = express.Router();
const signosVitalesController = require('../../controllers/enfermero/signosVitalesController');
const authMiddleware = require('../../middleware/authMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================
router.use(authMiddleware);

// Rutas principales
router.get('/', signosVitalesController.listarPacientes);
router.get('/registro', signosVitalesController.formularioRegistro);
router.post('/registro', signosVitalesController.registrarSignos);
router.get('/historial/:paciente_id', signosVitalesController.verHistorial);

// API endpoints
router.get('/api/grafica', signosVitalesController.obtenerGrafica);
router.get('/api/ultimos/:paciente_id', signosVitalesController.ultimosSignos);
router.get('/api/exportar-csv/:paciente_id', signosVitalesController.exportarCSV);

module.exports = router;