const path = require('path');
const { sequelize } = require('./database/db');
const Umzug = require('umzug');

const umzug = new Umzug({
  storage: 'sequelize',
  storageOptions: { 
    sequelize,
    tableName: 'sequelize_seeders'
  },
  migrations: {
    path: path.join(__dirname, 'database/seeders'),
    pattern: /\.js$/,
    params: [
      sequelize.getQueryInterface(),
      sequelize.constructor
    ]
  }
});

async function runSeeders() {
  try {
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    const executed = await umzug.up();
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Seeders ejecutados:', executed.map(s => s.file));
    return executed;
  } catch (error) {
    console.error('❌ Error en seeders:', error);
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1').catch(console.error);
    throw error;
  }
}

if (require.main === module) {
  runSeeders()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = runSeeders;