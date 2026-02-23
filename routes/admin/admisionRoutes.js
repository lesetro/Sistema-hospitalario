const express = require('express');
const router = express.Router();
const admisionController = require('../../controllers/admin/admisionController');
const authMiddleware = require('../../middleware/authMiddleware');

router.use(authMiddleware);

// VISTAS
router.get('/', admisionController.renderAdmisiones);
router.get('/lista', admisionController.renderListaAdmisiones);

// API - RUTAS ESPECÍFICAS (deben ir antes que las rutas con parámetros)
router.get('/api/buscar-paciente', admisionController.buscarPacientePorDNI);
router.get('/api/search-pacientes', admisionController.searchPacientes);
router.get('/api/servicios-por-sector', admisionController.getServiciosPorSector);
router.get('/api/medicos-por-sector', admisionController.getMedicosPorSector);
router.get('/api/medicos-por-especialidad', admisionController.getMedicosPorEspecialidad);
router.get('/api/horarios-disponibles', admisionController.getHorariosDisponiblesMedico);

// API - POST
router.post('/api/crear-paciente', admisionController.crearPaciente);
router.post('/api/generar-temporal', admisionController.generarPacienteTemporal);
router.post('/api/urgencia', admisionController.crearAdmisionUrgencia);
router.post('/api/crear-admision', admisionController.crearAdmision);

// API - ADMISIONES GENERALES
router.get('/api', admisionController.getAdmisiones);

// API - RUTAS CON PARÁMETROS (deben ir al final)
router.get('/api/:id', admisionController.getAdmisionById);
router.patch('/api/:id/estado', admisionController.updateEstadoAdmision);

module.exports = router;