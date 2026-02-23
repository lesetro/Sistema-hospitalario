
const express = require('express');
const router = express.Router();
const emergenciasController = require('../../controllers/medico/emergenciasController');
const { verificarMedicoEmergencias } = require('../../middleware/sectorMiddleware');

// El frontend consulta este endpoint cada 15 segundos (polling)
// para saber si hay emergencias pendientes. el servidor siempre entrega json 
// La lógica de mostrar/ocultar la notificación la maneja el JS del navegador.
router.get('/api/verificar-pendientes', emergenciasController.verificarEmergenciasPendientes);
router.get('/api/verificar-cirugias', emergenciasController.verificarCirugiasPendientes);
router.use(verificarMedicoEmergencias);

router.get('/', emergenciasController.renderEmergencias);
router.get('/api/lista', emergenciasController.obtenerEmergencias);
router.get('/api/:id', emergenciasController.obtenerEmergenciaPorId);
router.put('/api/:id/aceptar', emergenciasController.aceptarEmergencia);
router.put('/api/:id/completar', emergenciasController.completarEmergencia);
router.post('/api/evaluacion', emergenciasController.crearEvaluacionMedica);


module.exports = router;