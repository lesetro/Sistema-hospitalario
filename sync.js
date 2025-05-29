//sync.js – Crea la estructura de la base
const db = require('./models');

const syncDatabase = async () => {
  try {
    await db.sequelize.authenticate();
    console.log('✅ Conectado a la base de datos.');

    await db.sequelize.sync({ force: true }); // ⚠️ Borra todo y recrea
    console.log('✅ Tablas sincronizadas.');
  } catch (error) {
    console.error('❌ Error al sincronizar:', error);
  } finally {
    await db.sequelize.close();
  }
};

syncDatabase();
