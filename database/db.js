const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.MYSQL_URL || {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  dialect: 'mysql',
  retry: { max: 3 } 
});
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