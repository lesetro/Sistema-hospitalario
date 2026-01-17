const express = require('express');
const router = express.Router();
const listaEsperaController = require('../../controllers/enfermero/listaEsperaEnfermeroController');
const authMiddleware = require('../../middleware/authMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================
router.use(authMiddleware);

// Rutas principales (SOLO CONSULTA)
router.get('/', listaEsperaController.listarListaEspera);
router.get('/:id', listaEsperaController.verDetalle);

// API endpoints
router.get('/api/siguiente-paciente', listaEsperaController.siguientePaciente);
router.get('/api/buscar', listaEsperaController.buscarPaciente);
router.get('/api/estadisticas-tipo', listaEsperaController.estadisticasPorTipo);
router.get('/api/mayor-tiempo-espera', listaEsperaController.mayorTiempoEspera);

module.exports = router;