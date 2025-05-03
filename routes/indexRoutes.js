const express = require('express');
const path = require('path');
const router = express.Router();

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index/index.html'));
});
router.get('/usuario/inicio', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/usuario/inicio.html'));
});
router.get('/usuario/usuario', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/usuario/usuario.html'));
});

router.get('/usuario/registar', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/usuario/registrar.html'));
});

module.exports = router;
