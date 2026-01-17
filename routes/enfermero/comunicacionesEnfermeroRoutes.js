const express = require('express');
const router = express.Router();
const comunicacionesController = require('../../controllers/enfermero/comunicacionEnfermeroController'); 
const authMiddleware = require('../../middleware/authMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================
router.use(authMiddleware);

// Rutas principales
router.get('/', comunicacionesController.listarComunicaciones);

// ✅ CORRECCIÓN: Cambiar el orden para que coincida con el controller
router.post('/:id/marcar-leida', comunicacionesController.marcarLeida);
router.post('/marcar-todas-leidas', comunicacionesController.marcarTodasLeidas);
router.delete('/:id', comunicacionesController.eliminarNotificacion);
router.post('/mensaje', comunicacionesController.enviarMensajeInterno); 

// API endpoints
router.get('/api/contador', comunicacionesController.contadorNoLeidas); 
router.get('/api/ultimas', comunicacionesController.ultimasNotificaciones);
router.get('/api/buscar-personal', comunicacionesController.buscarPersonal);

module.exports = router;