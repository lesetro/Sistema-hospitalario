const path = require("path");
const fs = require("fs");
const db = require('./database/db');
const Sequelize = require("sequelize");

const migrationFiles = fs
  .readdirSync(path.join(__dirname, "database/migrations"))
  .filter(file => file.endsWith(".js"))
  .sort();

async function runMigrations(direction = "up") {
  const queryInterface = db.sequelize.getQueryInterface(); // Corrige aquí
  const sequelize = db.sequelize; // Usa db.sequelize
  const files = direction === "up" ? migrationFiles : [...migrationFiles].reverse();

  // Deshabilitar FKs al inicio
  if (direction === "up") {
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  } else {
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  }

  try {
    for (const file of files) {
      const migration = require(`./database/migrations/${file}`);
      console.log(`→ Running ${direction} on migration: ${file}`);
      await migration[direction](queryInterface, Sequelize);
    }

    // Reactivar FKs al finalizar con éxito
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log(`✅ Migrations ${direction} complete.`);
  } catch (error) {
    console.error(`❌ Migration failed: ${error.message}`);
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1').catch(e => {
      console.error("Failed to re-enable foreign key checks:", e);
    });
    throw error;
  }
}

module.exports = runMigrations;

if (require.main === module) {
  const direction = process.argv[2] || "up";
  runMigrations(direction).catch(console.error);
}