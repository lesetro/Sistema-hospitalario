const express = require('express');
const router = express.Router();
const controller = require('../../controllers/admin/searchController');

router.get('/global', controller.busquedaGlobal);

module.exports = router;