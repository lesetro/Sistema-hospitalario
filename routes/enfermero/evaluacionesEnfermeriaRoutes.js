const express = require('express');
const router = express.Router();
const evaluacionesController = require('../../controllers/enfermero/evaluacionesEnfermeriaController');
const authMiddleware = require('../../middleware/authMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================
router.use(authMiddleware);

// Rutas principales
router.get('/', evaluacionesController.listarEvaluaciones);
router.get('/nueva', evaluacionesController.formularioNuevaEvaluacion);
router.post('/nueva', evaluacionesController.crearEvaluacion);
router.get('/:id', evaluacionesController.verEvaluacion);
router.put('/:id', evaluacionesController.actualizarEvaluacion);
router.get('/:id/editar', evaluacionesController.formularioEditarEvaluacion);
router.post('/:id/tomar', evaluacionesController.tomarEvaluacion);

router.put('/:id', evaluacionesController.actualizarEvaluacion);
router.post('/:id/completar', evaluacionesController.completarEvaluacion);
router.post('/:id/derivar-medico', evaluacionesController.derivarMedico);

// API endpoints
router.get('/api/medicos', evaluacionesController.buscarMedicos);
router.get('/api/medicos/urgencias', evaluacionesController.obtenerMedicosUrgencias); 
router.get('/api/medicos/:medicoId/horarios', evaluacionesController.obtenerHorariosMedico); 


module.exports = router;