const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuración corregida
const sequelize = new Sequelize(
  process.env.DB_NAME,    
  process.env.DB_USER,    
  process.env.DB_PASSWORD || null,  
  {
    host: process.env.DB_HOST,  
    port: process.env.DB_PORT || 32167, 
    dialect: 'mysql',           
    dialectOptions: {
      connectTimeout: 30000
    },
    logging: false,
    define: {
      timestamps: true,
      underscored: true
    },
    retry: {  // Configuración de reintentos integrada
      max: 5,
      match: [
        'ECONNREFUSED',
        'ETIMEDOUT',
        'ER_ACCESS_DENIED_ERROR'
      ]
    }
  }
);

const db = {
  Sequelize,
  sequelize,
  testConnection: async () => {
    try {
      await sequelize.authenticate();
      console.log('✅ Conexión exitosa a la base de datos');
      return true;
    } catch (error) {
      console.error('❌ Error de conexión:', error.message);
      return false;
    }
  }
};

module.exports = db;