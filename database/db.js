const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: 3306, 
    dialect: 'mariadb',
    dialectOptions: {
      connectTimeout: 30000
    },
    logging: false,
    define: {
      timestamps: true,
      underscored: true
    }
  }
);

const db = {
  Sequelize,
  sequelize,
  connectWithRetry: async (retries = 5, delay = 5000) => {
    for (let i = 0; i < retries; i++) {
      try {
        await sequelize.authenticate();
        console.log('✅ Conexión a la base de datos establecida con éxito.');
        return true;
      } catch (error) {
        console.error(`⛔ Intento ${i + 1} fallido: ${error.message}`);
        if (i < retries - 1) {
          console.log(`🔁 Reintentando en ${delay / 1000} segundos...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    console.error('❌ No se pudo conectar a la base de datos después de varios intentos.');
    return false;
  }
};



module.exports = db;