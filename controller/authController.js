 // backends/controlador/authController.js

const authController = {
  login: async (req, res) => {
    try {
      const { username, password } = req.body;
      console.log('Validando datos:', username, password);
      // Datos de usuario simulados (reemplazar cuando tengas la BD)
      const users = [
        { username: 'admin', password: 'admin123', name: 'Administrador' },
        { username: 'user1', password: 'user123', name: 'Usuario de Prueba' }
      ];

      // Validación básica
      if (!username || !password) {
        return res.status(400).json({
          errors: {
            username: !username ? 'Usuario requerido' : '',
            password: !password ? 'Contraseña requerida' : ''
          }
        });
      }

      // Buscar usuario
      const user = users.find(u =>
        u.username === username && u.password === password
      );

      if (!user) {
        return res.status(401).json({
          message: 'Usuario o contraseña incorrectos',
          errors: {
            username: 'Credenciales inválidas',
            password: 'Credenciales inválidas'
          }
        });
      }

      // Simular sesión exitosa
      return res.status(200).json({
        message: 'Inicio de sesión exitoso',
        redirect: '/usuario/inicio',
        user: {
          name: user.name,
          username: user.username
        }
      });
    } catch (error) {
      console.error('Error en login:', error);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
};

module.exports = authController;
