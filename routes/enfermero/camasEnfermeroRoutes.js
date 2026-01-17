const express = require('express');
const router = express.Router();
const camasController = require('../../controllers/enfermero/camasEnfermeroController');
const authMiddleware = require('../../middleware/authMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================
router.use(authMiddleware);

// Rutas principales
router.get('/', camasController.listarCamas);
router.get('/:id', camasController.verCama);
router.post('/:id/cambiar-estado', camasController.cambiarEstado);
router.post('/:id/liberar', camasController.liberarCama);

// API endpoints
router.get('/api/disponibilidad-sector', camasController.disponibilidadPorSector);
router.get('/api/buscar-disponibles', camasController.buscarDisponibles);
router.get('/api/por-limpiar', camasController.camasPorLimpiar);
router.get('/api/estadisticas', camasController.estadisticasGenerales);

module.exports = router;