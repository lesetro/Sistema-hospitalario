const express = require('express');
const router = express.Router();
const triajeController = require('../../controllers/enfermero/triajeController');
const authMiddleware = require('../../middleware/authMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================
router.use(authMiddleware);
// Rutas de triaje
router.get('/', triajeController.listarTriaje);
router.get('/nuevo', triajeController.formularioNuevoTriaje);
router.post('/nuevo', triajeController.registrarTriaje);
router.get('/:id', triajeController.verTriaje);

// Editar triaje - formulario
router.put('/:id', triajeController.actualizarTriaje);
router.get('/:id/editar', triajeController.editarTriaje);



// Actualizar triaje

// API endpoints
router.get('/api/buscar-paciente', triajeController.buscarPacientePorDni);
router.get('/api/estadisticas', triajeController.estadisticasTriaje);
// Agregar estas rutas
router.put('/:id/completar', triajeController.completarTriaje);
router.put('/:id/derivar', triajeController.derivarMedico);

module.exports = router;