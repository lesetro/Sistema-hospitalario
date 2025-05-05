// models/User.js (versión para pruebas sin DB)
const bcrypt = require('bcrypt');

// Datos de usuarios hardcodeados (para desarrollo)
const users = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@egmail.com',
    // Contraseña: "admin123" (hasheada)
    password: '1234'
  },
  {
    id: 2,
    username: 'usuario',
    email: 'usuario@gmail.com',
    // Contraseña: "usuario123"
    password: '1234'
  }
];

// Mock de los métodos de Mongoose que necesitas
const User = {
  findOne: async ({ username }) => {
    return users.find(user => user.username === username) || null;
  },
  
  // Método para comparar contraseñas (como en el modelo real)
  comparePassword: async (candidatePassword, hashedPassword) => {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }
};

module.exports = User;