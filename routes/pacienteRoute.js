const express = require('express');
const router = express.Router();
const pacienteController = require('../controllers/pacienteController'); 
// Ruta para listar pacientes
router.get('/', pacienteController.getPacientes); 

module.exports = router;