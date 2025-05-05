const express = require('express');
const path = require('path');
const router = express.Router();

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index/index.html'));
});
router.get('/usuario', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/usuario/usuario.html'));
});

router.get('/registrar', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/usuario/registrar.html'));
});

module.exports = router;

