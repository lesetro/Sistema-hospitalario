const path = require("path");
const { Umzug, SequelizeStorage } = require('umzug');
const db = require('./database/db');

// ===============================================
// CONFIGURACIÓN DE UMZUG
// ===============================================
const umzug = new Umzug({
  migrations: {
    glob: 'database/migrations/*.js',
    resolve: ({ name, path: filepath, context }) => {
      const migration = require(filepath);
      return {
        name,
        up: async () => migration.up(context.queryInterface, context.Sequelize),
        down: async () => migration.down(context.queryInterface, context.Sequelize),
      };
    },
  },
  context: {
    queryInterface: db.sequelize.getQueryInterface(),
    Sequelize: db.Sequelize
  },
  storage: new SequelizeStorage({ sequelize: db.sequelize }),
  logger: console,
});

// ===============================================
// FUNCIONES DE MIGRACIÓN
// ===============================================

async function runMigrationsUp() {
  console.log('\n🚀 Ejecutando migraciones...\n');
  
  try {
    // Deshabilitar FK checks
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Ejecutar migraciones pendientes
    const migrations = await umzug.up();
    
    if (migrations.length === 0) {
      console.log('ℹ️  No hay migraciones pendientes');
    } else {
      console.log(`\n✅ ${migrations.length} migraciones ejecutadas:\n`);
      migrations.forEach((m) => console.log(`  ✓ ${m.name}`));
    }
    
    // Reactivar FK checks
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    
  } catch (error) {
    console.error('\n❌ Error en migraciones:', error.message);
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1').catch(() => {});
    throw error;
  }
}

async function runMigrationsDown(steps = 1) {
  console.log(`\n⏪ Revirtiendo ${steps === 0 ? 'TODAS' : steps} migración(es)...\n`);
  
  try {
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    let migrations;
    if (steps === 0) {
      // Revertir TODAS
      migrations = await umzug.down({ to: 0 });
    } else {
      // Revertir N pasos
      migrations = await umzug.down({ step: steps });
    }
    
    if (migrations.length === 0) {
      console.log('ℹ️  No hay migraciones para revertir');
    } else {
      console.log(`\n✅ ${migrations.length} migraciones revertidas:\n`);
      migrations.forEach((m) => console.log(`  ✓ ${m.name}`));
    }
    
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    
  } catch (error) {
    console.error('\n❌ Error al revertir:', error.message);
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1').catch(() => {});
    throw error;
  }
}

async function showMigrationStatus() {
  console.log('\n📋 Estado de las migraciones:\n');
  
  const executed = await umzug.executed();
  const pending = await umzug.pending();
  
  console.log('✅ Ejecutadas:');
  if (executed.length === 0) {
    console.log('  (ninguna)');
  } else {
    executed.forEach((m) => console.log(`  ✓ ${m.name}`));
  }
  
  console.log('\n⏳ Pendientes:');
  if (pending.length === 0) {
    console.log('  (ninguna)');
  } else {
    pending.forEach((m) => console.log(`  • ${m.name}`));
  }
  
  console.log('');
}

// ===============================================
// CLI
// ===============================================
async function main() {
  const command = process.argv[2] || 'up';
  const arg = process.argv[3];
  
  try {
    // Conectar a la BD
    await db.sequelize.authenticate();
    console.log('✅ Conectado a la base de datos');
    
    switch (command) {
      case 'up':
        await runMigrationsUp();
        break;
        
      case 'down':
        const steps = arg === '--all' ? 0 : parseInt(arg) || 1;
        await runMigrationsDown(steps);
        break;
        
      case 'status':
        await showMigrationStatus();
        break;
        
      case 'reset':
        console.log('\n⚠️  RESET: Revirtiendo todas las migraciones y re-ejecutando...\n');
        await runMigrationsDown(0);
        await runMigrationsUp();
        break;
        
      default:
        console.log(`
📚 Uso: node migrationMaster.js [comando] [opciones]

Comandos:
  up              Ejecutar migraciones pendientes (default)
  down [n]        Revertir últimas n migraciones (default: 1)
  down --all      Revertir TODAS las migraciones
  status          Ver estado de migraciones
  reset           Revertir todo y re-ejecutar

Ejemplos:
  node migrationMaster.js up
  node migrationMaster.js down
  node migrationMaster.js down 3
  node migrationMaster.js down --all
  node migrationMaster.js status
  node migrationMaster.js reset
        `);
        process.exit(0);
    }
    
    console.log('\n✅ Completado\n');
    process.exit(0);
    
  } catch (error) {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  }
}

// Ejecutar si es el archivo principal
if (require.main === module) {
  main();
}

module.exports = { umzug, runMigrationsUp, runMigrationsDown, showMigrationStatus };