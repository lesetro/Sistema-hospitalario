// routes/dashboardRoute.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Ruta principal del dashboard
router.get('/', dashboardController.getDashboard);

// APIs para el dashboard
router.get('/api/search/global', dashboardController.busquedaGlobal);
router.get('/api/admision/:id', dashboardController.getAdmisionDetalle);
router.post('/api/notification/:notificationId/read', dashboardController.marcarNotificacionLeida);

module.exports = router;