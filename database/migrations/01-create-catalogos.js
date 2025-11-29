
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log('📦 Migración 01: Creando catálogos...');

      // ===================================
      // ROLES
      // ===================================
      await queryInterface.createTable('roles', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        nombre: { type: Sequelize.STRING(50), allowNull: false, unique: true },
        descripcion: { type: Sequelize.STRING(255), allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction, engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

      await queryInterface.addIndex('roles', ['nombre'], { unique: true, transaction });

      // ===================================
      // SECTORES
      // ===================================
      await queryInterface.createTable('sectores', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        nombre: { type: Sequelize.STRING(100), allowNull: false },
        descripcion: { type: Sequelize.STRING(255), allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction, engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

      // ===================================
      // ESPECIALIDADES
      // ===================================
      await queryInterface.createTable('especialidades', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        nombre: { type: Sequelize.STRING(100), allowNull: false },
        descripcion: { type: Sequelize.STRING(255), allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction, engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

      // ===================================
      // OBRAS SOCIALES
      // ===================================
      await queryInterface.createTable('obrassociales', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        nombre: { type: Sequelize.STRING(100), allowNull: false },
        descripcion: { type: Sequelize.STRING(255), allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction, engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

      // ===================================
      // TIPOS DE SERVICIO
      // ===================================
      await queryInterface.createTable('tiposdeservicio', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        nombre: { type: Sequelize.STRING(100), allowNull: false, unique: true },
        descripcion: { type: Sequelize.TEXT, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction, engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

      await queryInterface.addIndex('tiposdeservicio', ['nombre'], { unique: true, transaction });

      // ===================================
      // TIPOS DE INTERNACION
      // ===================================
      await queryInterface.createTable('tiposinternacion', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        nombre: { type: Sequelize.STRING(100), allowNull: false },
        descripcion: { type: Sequelize.STRING(255), allowNull: true },
        tipo_habitacion: { type: Sequelize.STRING(50), allowNull: true },
        cantidad_camas: { type: Sequelize.INTEGER, allowNull: true },
        cantidad_enfermeros: { type: Sequelize.INTEGER, allowNull: true },
        estado_paciente: { type: Sequelize.ENUM('Estable', 'Grave', 'Critico', 'Fallecido', 'Sin_Evaluar'), allowNull: false, defaultValue: 'Sin_Evaluar' },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction, engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

      // ===================================
      // TIPOS DE DIAGNOSTICO
      // ===================================
      await queryInterface.createTable('tiposdiagnostico', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        nombre: { type: Sequelize.STRING(50), allowNull: false, unique: true },
        descripcion: { type: Sequelize.TEXT, allowNull: true },
        sistema_clasificacion: { type: Sequelize.STRING(20), allowNull: false }
      }, { transaction, engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

      await queryInterface.addIndex('tiposdiagnostico', ['sistema_clasificacion'], { transaction });
      await queryInterface.addIndex('tiposdiagnostico', ['nombre'], { unique: true, transaction });

      // ===================================
      // TIPOS DE ESTUDIO
      // ===================================
      await queryInterface.createTable('tiposestudio', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        nombre: { type: Sequelize.STRING(100), allowNull: false, unique: true },
        categoria: { type: Sequelize.ENUM('Imagenología', 'Laboratorio', 'Fisiológico'), allowNull: false },
        requiere_ayuno: { type: Sequelize.BOOLEAN, defaultValue: false },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction, engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

      await queryInterface.addIndex('tiposestudio', ['nombre'], { unique: true, transaction });

      // ===================================
      // TIPOS DE TURNO
      // ===================================
      await queryInterface.createTable('tipos_turno', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        nombre: { type: Sequelize.STRING(100), allowNull: false, unique: true },
        descripcion: { type: Sequelize.TEXT, allowNull: true },
        requiere_especialidad: { type: Sequelize.BOOLEAN, defaultValue: false },
        requiere_estudio: { type: Sequelize.BOOLEAN, defaultValue: false },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction, engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

      await queryInterface.addIndex('tipos_turno', ['nombre'], { unique: true, transaction });

      // ===================================
      // MOTIVOS DE ADMISION
      // ===================================
      await queryInterface.createTable('motivosadmision', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        nombre: { type: Sequelize.STRING(100), allowNull: false, unique: true },
        descripcion: { type: Sequelize.STRING(255), allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction, engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

      await queryInterface.addIndex('motivosadmision', ['nombre'], { unique: true, transaction });

      // ===================================
      // FORMAS DE INGRESO
      // ===================================
      await queryInterface.createTable('formasingreso', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        nombre: { type: Sequelize.STRING(100), allowNull: false, unique: true },
        descripcion: { type: Sequelize.STRING(255), allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction, engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

      await queryInterface.addIndex('formasingreso', ['nombre'], { unique: true, transaction });

      // ===================================
      // MOTIVOS DE CONSULTA
      // ===================================
      await queryInterface.createTable('motivosconsultas', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        nombre: { type: Sequelize.STRING(100), allowNull: false },
        descripcion: { type: Sequelize.TEXT, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction, engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

      // ===================================
      // TRATAMIENTOS
      // ===================================
      await queryInterface.createTable('tratamientos', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        nombre: { type: Sequelize.STRING(100), allowNull: false },
        descripcion: { type: Sequelize.TEXT, allowNull: false },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction, engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

      await transaction.commit();
      console.log('✅ Migración 01: Catálogos creados exitosamente');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error en migración 01:', error.message);
      throw error;
    }
  },

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('tratamientos', { transaction });
      await queryInterface.dropTable('motivosconsultas', { transaction });
      await queryInterface.dropTable('formasingreso', { transaction });
      await queryInterface.dropTable('motivosadmision', { transaction });
      await queryInterface.dropTable('tipos_turno', { transaction });
      await queryInterface.dropTable('tiposestudio', { transaction });
      await queryInterface.dropTable('tiposdiagnostico', { transaction });
      await queryInterface.dropTable('tiposinternacion', { transaction });
      await queryInterface.dropTable('tiposdeservicio', { transaction });
      await queryInterface.dropTable('obrassociales', { transaction });
      await queryInterface.dropTable('especialidades', { transaction });
      await queryInterface.dropTable('sectores', { transaction });
      await queryInterface.dropTable('roles', { transaction });
      
      await transaction.commit();
      console.log('✅ Migración 01: Revertida exitosamente');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error al revertir migración 01:', error.message);
      throw error;
    }
  }
};