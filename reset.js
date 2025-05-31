const runMigrations = require("./migrationMaster");
const runSeeders = require("./seedMaster");

async function resetDatabase() {
  try {
    console.log("🧨 Revirtiendo seeders...");
    await runSeeders("down");

    console.log("🧨 Revirtiendo migraciones...");
    await runMigrations("down");

    console.log("🚀 Aplicando migraciones...");
    await runMigrations("up");

    console.log("🌱 Ejecutando seeders...");
    await runSeeders("up");

    console.log("✅ Base de datos cargada correctamente.");
  } catch (error) {
    console.error("❌ Error durante el reset:", error);
  }
}

resetDatabase();
