const express = require('express');
const router = express.Router();
const controller = require('../../controllers/admin/configuracionNormalizadoresController');

// Vista principal
router.get('/', controller.getVistaNormalizadores);

// Estadísticas
router.get('/api/estadisticas', controller.getEstadisticas);

// Lista de tipos de diagnóstico (para selects)
router.get('/api/tipos-diagnostico/lista', controller.getTiposDiagnosticoLista);

// CRUD genérico
router.get('/api/:modelo', controller.getLista);
router.get('/api/:modelo/:id', controller.getDetalle);
router.post('/api/:modelo', controller.crear);
router.put('/api/:modelo/:id', controller.actualizar);
router.delete('/api/:modelo/:id', controller.eliminar);

module.exports = router;