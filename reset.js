// reset.js
const db = require('./database/db'); 
const seed = require('./seed');

const resetDatabase = async () => {
  try {
    await db.sequelize.authenticate();
    console.log('🔁 Conectado a la base de datos.');

    await sequelize.sync({ force: true });
    console.log('✔️ Estructura de la base creada');

    await seed(); // Ejecuta seed.js
    console.log('✅ Datos iniciales insertados.');
  } catch (error) {
    console.error('❌ Error al reiniciar la base:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      errno: error.errno,
      stack: error.stack
    });
  } finally {
    await sequelize.close();
  }
};

resetDatabase();