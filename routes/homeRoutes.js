const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
//const authMiddleware = require('../middleware/authMiddleware');

 
// Rutas públicas
router.get('/', homeController.getHome);
router.get('/quienes-somos', homeController.getQuienesSomos);
router.get('/especialidades', homeController.getEspecialidades);
router.get('/reclamos', homeController.getReclamos);
router.post('/reclamos', homeController.postReclamos);
//router.get('/admin', authMiddleware, homeController.getMiDashboard);

module.exports = router;