const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');

router.post('/login', (req, res) => {
    const { username, password } = req.body; 
    console.log('Cuerpo recibido:', req.body); 
    
    // Validación backend
    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        errors: {
          username: !username ? 'Usuario requerido' : null,
          password: !password ? 'Contraseña requerida' : null
        }
      });
    }
    console.log("Enviando:", username, password); // 
    // Simulación de base de datos
    if (username === 'admin' && password === '1234') {
      res.json({ 
        success: true,
        user: { username },
        redirect: '/registrar' // Ruta post-login
      });
    } else {
      res.status(401).json({ 
        success: false,
        message: 'Credenciales incorrectas'
      });
    }
  });
//router.post('/login', authController.login); 

module.exports = router;
