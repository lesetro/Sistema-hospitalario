const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.MYSQL_URL, {
  dialect: 'mysql',
  retry: { max: 3 },
  pool: { 
    max: 10, 
    min: 0, 
    acquire: 60000, 
    idle: 30000 
  },
  define: {
    freezeTableName: true,  // Evita la pluralización automática
    underscored: true       // Convierte camelCase a snake_case
  },
  dialectOptions: {
    supportBigNumbers: true,
    bigNumberStrings: true,
    // Configuración para manejo de mayúsculas/minúsculas
    typeCast: function (field, next) {
      if (field.type === 'VAR_STRING' || field.type === 'STRING') {
        return field.string().toLowerCase();
      }
      return next();
    },
    // Añade esto para mayor compatibilidad
    connectAttributes: { 
      '_force_case_insensitive': 'true' 
    }
  },
  // Opciones adicionales recomendadas
  timezone: '-03:00', // Ajusta según tu zona horaria
  logging: process.env.NODE_ENV === 'development' ? console.log : false
});

const db = {
  Sequelize,
  sequelize,
  connectWithRetry: async (retries = 5, delay = 5000) => {
    for (let i = 0; i < retries; i++) {
      try {
        await sequelize.authenticate();
        console.log('✅ Conexión a la base de datos establecida con éxito.');
        
        // Verificación adicional de case sensitivity
        const [results] = await sequelize.query(
          "SHOW VARIABLES LIKE 'lower_case_table_names'"
        );
        console.log(`ℹ️ Configuración de case sensitivity:`, results[0].Value);
        
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
    process.exit(1); // Termina el proceso con error
  }
};

module.exports = db;