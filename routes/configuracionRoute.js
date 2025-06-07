const express = require('express');
const router = express.Router();
const configController = require('../controllers/configuracionController');

// Renderizar la vista de configuración
router.get('/', configController.renderConfig);
router.get('/:table', configController.renderConfig);

// Operaciones CRUD para tablas de configuración

router.get('/:table/data', configController.getConfigTable);
router.post('/:table/crear', configController.createConfigRecord);
router.put('/:table/editar/:id', configController.updateConfigRecord);
router.delete('/:table/eliminar/:id', configController.deleteConfigRecord);
router.get('/:table/data/:id', configController.getConfigRecord);




module.exports = router;