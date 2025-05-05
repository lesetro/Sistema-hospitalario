const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./models/User'); // Asegúrate de tener tu modelo User

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const errors = {};
        
        // Validación básica
        if (!username) errors.username = "Usuario requerido";
        if (!password) errors.password = "Contraseña requerida";
        
        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ errors });
        }
        
        // Buscar usuario
        const user = await User.findOne({ username });
        if (!user) {
            errors.username = "Usuario no registrado";
            return res.status(404).json({ errors });
        }
        
        // Verificar contraseña
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            errors.password = "Contraseña incorrecta";
            return res.status(401).json({ errors });
        }
        
        // Crear token JWT
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: '1h'
        });
        
        // Respuesta exitosa
        return {
            success: true,
            redirect: "/usuario/inicio", // Usa una ruta existente
            token
        };
        
    } catch (error) {
        console.error('Error en authController:', error);
        throw error; // El manejador de errores global lo capturará
    }
};