// reset.js
const db = require('./database/db'); // Cambiado a la ruta correcta
const seed = require('./seed');

const resetDatabase = async () => {
  try {
    await db.sequelize.authenticate();
    console.log('🔁 Conectado a la base de datos.');

    await db.sequelize.sync({ force: true });
    console.log('✅ Base de datos reiniciada.');

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
    await db.sequelize.close();
  }
};

resetDatabase();