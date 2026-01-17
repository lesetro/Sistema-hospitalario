const express = require('express');
const router = express.Router();
const dashboardController = require('../../controllers/admin/adminController');
const authMiddleware = require('../../middleware/authMiddleware');

// Middleware de autenticación
router.use(authMiddleware);

// Ruta principal
router.get('/', dashboardController.getDashboard);

// APIs
router.get('/api/search/global', dashboardController.busquedaGlobal);
router.get('/api/admision/:id', dashboardController.getAdmisionDetalle);
router.post('/api/notification/:notificationId/read', dashboardController.marcarNotificacionLeida);
router.get('/api/notifications', dashboardController.obtenerNotificaciones);

module.exports = router;