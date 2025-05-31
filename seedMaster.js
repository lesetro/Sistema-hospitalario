const path = require("path");
const fs = require("fs");
const { sequelize } = require("./models");
const Sequelize = require("sequelize");

const seederFiles = fs
  .readdirSync(path.join(__dirname, "database/seeders"))
  .filter(file => file.endsWith(".js"))
  .sort();

async function clearExistingData(queryInterface, transaction) {
  const tables = await queryInterface.showAllTables();
  const tablesToClear = [
    'Roles', 'TiposDeServicio', 'TiposInternacion', 'TiposDiagnostico',
    'TiposEstudio', 'TiposTurno', 'MotivosAdmision', 'FormasIngreso',
    'MotivosConsultas', 'ObrasSociales', 'Especialidades', 'Sectores',
    'Tratamientos', 'Usuarios', 'Pacientes', 'Medicos', 'Enfermeros',
    'Administrativos', 'Habitaciones', 'Camas', 'TurnosPersonal',
    'Turnos', 'Admisiones', 'EvaluacionesMedicas', 'Diagnosticos',
    'EstudiosSolicitados', 'TurnosEstudios', 'ListasEsperas',
    'EvaluacionesEnfermeria', 'ProcedimientosEnfermeria',
    'ProcedimientosPreQuirurgicos', 'ControlesEnfermeria',
    'Internaciones', 'IntervencionesQuirurgicas',
    'SolicitudesDerivaciones', 'HistorialesMedicos', 'Facturas',
    'Pagos', 'AltasMedicas', 'Noticias', 'Notificaciones',
    'Reclamos', 'RecetasCertificados'
  ];

  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction });
  
  for (const table of tablesToClear) {
    if (tables.includes(table)) {
      await queryInterface.bulkDelete(table, null, { transaction });
    }
  }
  
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction });
}

async function runSeeders(direction = "up") {
  if (!['up', 'down'].includes(direction)) {
    throw new Error('Direction must be either "up" or "down"');
  }

  const queryInterface = sequelize.getQueryInterface();
  const transaction = await sequelize.transaction();

  try {
    // Configuración inicial
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction });
    await sequelize.query('SET UNIQUE_CHECKS = 0', { transaction });
    await sequelize.query('SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO"', { transaction });

    // Limpiar datos existentes solo en modo 'up'
    if (direction === 'up') {
      console.log('🧹 Clearing existing data...');
      await clearExistingData(queryInterface, transaction);
    }

    const files = direction === "up" ? seederFiles : [...seederFiles].reverse();

    console.log(`🏁 Starting seeders (${direction})...`);
    for (const file of files) {
      console.log(`↳ Processing seeder: ${file}`);
      const startTime = Date.now();
      
      const seeder = require(path.join(__dirname, "database/seeders", file));
      await seeder[direction](queryInterface, Sequelize, { transaction });
      
      const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✓ Completed ${file} in ${elapsedTime}s`);
    }

    // Restaurar configuraciones
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction });
    await sequelize.query('SET UNIQUE_CHECKS = 1', { transaction });
    
    await transaction.commit();
    console.log(`✅ Seeders ${direction} completed successfully!`);
  } catch (error) {
    await transaction.rollback();
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1').catch(console.error);
    await sequelize.query('SET UNIQUE_CHECKS = 1').catch(console.error);
    
    console.error(`❌ Seeder failed: ${error.message}`);
    throw error;
  }
}

module.exports = runSeeders;

if (require.main === module) {
  const direction = process.argv[2] || "up";
  runSeeders(direction).catch(error => {
    console.error('Seeder execution failed:', error);
    process.exit(1);
  });
}