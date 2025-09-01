const express = require('express');
const router = express.Router();
const admisionesController = require('../controllers/admisionesController');

// Rutas para Pacientes
router.get('/pacientes/ultimo-id', admisionesController.obtenerUltimoIdPaciente);
router.get('/pacientes/buscar', admisionesController.buscarPacientePorDNI);
router.get('/admisiones/search/pacientes', admisionesController.searchPacientes);
router.get('/buscar', admisionesController.buscarPacientePorDNI);
router.get('/pacientes', admisionesController.searchPacientes);

// Rutas para Admisiones
router.get('/', admisionesController.getAdmisiones);
router.post('/', admisionesController.crearAdmision);
router.get('/horarios-disponibles', admisionesController.getHorariosDisponibles);
router.post('/nuevo-paciente', admisionesController.crearPaciente);
router.post('/urgencias', admisionesController.crearAdmisionUrgencia);
router.get('/:id', admisionesController.getAdmisionById);
router.put('/editar/:id', admisionesController.updateAdmision);
router.delete('/eliminar/:id', admisionesController.deleteAdmision);
router.post('/generar-temporal', admisionesController.generarPacienteTemporal);

module.exports = router;