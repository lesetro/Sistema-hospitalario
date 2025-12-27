const express = require('express');
const router = express.Router();
const controller = require('../controllers/searchController');

router.get('/global', controller.busquedaGlobal);

module.exports = router;