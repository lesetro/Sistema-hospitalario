const path = require("path");
const fs = require("fs");
const db = require('./database/db');
const { Sequelize } = require("sequelize");

// ===============================================
// ORDEN CORRECTO DE TABLAS PARA LIMPIAR
// ===============================================
// Orden inverso a las dependencias (de hijos a padres)
const TABLES_ORDER = [
  // Tablas finales (con más FK)
  'recetascertificados',
  'reclamos',
  'notificaciones',
  'noticias',
  'altasmedicas',
  'pagos',
  'facturas',
  'historialesmedicos',
  'solicitudesderivaciones',
  'intervencionesquirurgicas',
  'internaciones',
  'controlesenfermeria',
  'procedimientosprequirurgicos',
  'procedimientosenfermeria',
  'evaluacionesenfermeria',
  'turnosestudios',
  'estudiossolicitados',
  'evaluacionesmedicas',
  'admisiones',
  'turnos',
  'listasesperas',
  
  // Tablas intermedias
  'camas',
  'habitaciones',
  'diagnosticos',
  'turnospersonal',
  'administrativos',
  'enfermeros',
  'medicos',
  'pacientes',
  'usuarios',
  
  // Catálogos (sin FK o con pocas)
  'tratamientos',
  'motivosconsultas',
  'formasingreso',
  'motivosadmision',
  'tiposturno',
  'tiposestudio',
  'tiposdiagnostico',
  'tiposinternacion',
  'tiposdeservicio',
  'obrassociales',
  'especialidades',
  'sectores',
  'roles',
];

// ===============================================
// FUNCIONES AUXILIARES
// ===============================================

async function getAllTables() {
  try {
    const [results] = await db.sequelize.query(
      `SELECT TABLE_NAME 
       FROM information_schema.TABLES 
       WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME != 'SequelizeMeta'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    // Extraer solo los nombres de las tablas
    if (Array.isArray(results)) {
      return results.map(r => r.TABLE_NAME);
    }
    return [];
  } catch (error) {
    console.error('Error al obtener tablas:', error.message);
    return [];
  }
}

async function clearExistingData(queryInterface, transaction) {
  console.log('🧹 Limpiando datos existentes...\n');
  
  const existingTables = await getAllTables();
  
  await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction });
  
  let clearedCount = 0;
  for (const table of TABLES_ORDER) {
    if (existingTables.includes(table)) {
      try {
        await queryInterface.bulkDelete(table, null, { transaction });
        console.log(`  ✓ ${table}`);
        clearedCount++;
      } catch (error) {
        console.log(`  ⚠️  ${table}: ${error.message}`);
      }
    }
  }
  
  await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction });
  
  console.log(`\n✅ ${clearedCount} tablas limpiadas\n`);
}

// ===============================================
// FUNCIÓN PRINCIPAL
// ===============================================

async function runSeeders(direction = "up") {
  if (!['up', 'down'].includes(direction)) {
    throw new Error('Direction must be either "up" or "down"');
  }

  const seederFiles = fs
    .readdirSync(path.join(__dirname, "database/seeders"))
    .filter(file => file.endsWith(".js"))
    .sort();

  if (seederFiles.length === 0) {
    console.log('ℹ️  No hay seeders para ejecutar');
    return;
  }

  const queryInterface = db.sequelize.getQueryInterface();
  const transaction = await db.sequelize.transaction();

  try {
    console.log(`\n🌱 Ejecutando seeders (${direction})...\n`);
    
    // Configuración inicial
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction });
    await db.sequelize.query('SET UNIQUE_CHECKS = 0', { transaction });
    await db.sequelize.query('SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO"', { transaction });

    // Limpiar datos solo en modo 'up'
    if (direction === 'up') {
      await clearExistingData(queryInterface, transaction);
    }

    // Ejecutar seeders
    const files = direction === "up" ? seederFiles : [...seederFiles].reverse();
    let successCount = 0;

    for (const file of files) {
      console.log(`📦 ${file}`);
      const startTime = Date.now();
      
      try {
        const seeder = require(path.join(__dirname, "database/seeders", file));
        
        // Pasar transaction como parte de las opciones
        await seeder[direction](queryInterface, Sequelize, { transaction });
        
        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`  ✓ Completado en ${elapsedTime}s\n`);
        successCount++;
      } catch (error) {
        console.error(`  ❌ Error: ${error.message}\n`);
        throw error; // Propagar para hacer rollback
      }
    }

    // Restaurar configuraciones
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction });
    await db.sequelize.query('SET UNIQUE_CHECKS = 1', { transaction });
    
    await transaction.commit();
    
    console.log(`✅ ${successCount}/${files.length} seeders ejecutados correctamente\n`);
    
  } catch (error) {
    await transaction.rollback();
    
    // Restaurar configuraciones incluso en caso de error
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1').catch(() => {});
    await db.sequelize.query('SET UNIQUE_CHECKS = 1').catch(() => {});
    
    console.error(`\n❌ Error en seeders: ${error.message}\n`);
    throw error;
  }
}

// ===============================================
// COMANDOS ADICIONALES
// ===============================================

async function clearAllData() {
  console.log('\n⚠️  ADVERTENCIA: Esto borrará TODOS los datos\n');
  
  const transaction = await db.sequelize.transaction();
  try {
    const queryInterface = db.sequelize.getQueryInterface();
    await clearExistingData(queryInterface, transaction);
    await transaction.commit();
    console.log('✅ Todos los datos fueron eliminados\n');
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error:', error.message);
    throw error;
  }
}

async function showDataStatus() {
  console.log('\n📊 Estado de los datos:\n');
  
  const existingTables = await getAllTables();
  
  for (const table of TABLES_ORDER) {
    if (existingTables.includes(table)) {
      try {
        const [result] = await db.sequelize.query(
          `SELECT COUNT(*) as count FROM ${table}`,
          { type: Sequelize.QueryTypes.SELECT }
        );
        const count = result.count;
        const icon = count > 0 ? '📦' : '📭';
        console.log(`  ${icon} ${table.padEnd(30)} ${count} registros`);
      } catch (error) {
        console.log(`  ❌ ${table.padEnd(30)} Error: ${error.message}`);
      }
    }
  }
  console.log('');
}

// ===============================================
// CLI
// ===============================================

async function main() {
  const command = process.argv[2] || 'up';
  
  try {
    await db.sequelize.authenticate();
    console.log('✅ Conectado a la base de datos');
    
    switch (command) {
      case 'up':
        await runSeeders('up');
        break;
        
      case 'down':
        await runSeeders('down');
        break;
        
      case 'clear':
        await clearAllData();
        break;
        
      case 'status':
        await showDataStatus();
        break;
        
      default:
        console.log(`
🌱 Uso: node seedMaster.js [comando]

Comandos:
  up          Ejecutar seeders (cargar datos)
  down        Revertir seeders (limpiar datos)
  clear       Limpiar TODOS los datos
  status      Ver cantidad de registros por tabla

Ejemplos:
  node seedMaster.js up
  node seedMaster.js down
  node seedMaster.js clear
  node seedMaster.js status
        `);
        process.exit(0);
    }
    
    console.log('✅ Completado\n');
    process.exit(0);
    
  } catch (error) {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { runSeeders, clearAllData, showDataStatus };