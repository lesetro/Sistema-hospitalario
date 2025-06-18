const path = require('path');
const { sequelize } = require('./database/db');
const Umzug = require('umzug');

const umzug = new Umzug({
  storage: 'sequelize',
  storageOptions: { 
    sequelize,
    tableName: 'sequelize_meta' 
  },
  migrations: {
    path: path.join(__dirname, 'database/migrations'),
    pattern: /\.js$/,
    params: [
      sequelize.getQueryInterface(),
      sequelize.constructor 
    ]
  },
  logging: console.log
});

async function runMigrations() {
  try {
    // Deshabilitar FK checks (solo para MySQL/MariaDB)
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Ejecutar migraciones pendientes
    const migrations = await umzug.up();
    
    // Reactivar FK checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('✅ Migraciones completadas:', migrations.map(m => m.file));
    return migrations;
  } catch (error) {
    console.error('❌ Error en migraciones:', error);
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1').catch(console.error);
    throw error;
  }
}

// Ejecutar solo si se llama directamente (no cuando se requiere)
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = {
  runMigrations,
  umzug // Para poder usarlo en tests u otros scripts
};