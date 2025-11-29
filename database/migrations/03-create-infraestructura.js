
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log('📦 Migración 03: Creando infraestructura...');

      // ===================================
      // DIAGNOSTICOS
      // ===================================
      await queryInterface.createTable('diagnosticos', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        codigo: { type: Sequelize.STRING(20), allowNull: false, unique: true },
        tipo_diagnostico_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'tiposdiagnostico', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        nombre: { type: Sequelize.STRING(200), allowNull: false },
        descripcion: { type: Sequelize.TEXT, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction, engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

      await queryInterface.addIndex('diagnosticos', ['codigo'], { unique: true, transaction });
      await queryInterface.addIndex('diagnosticos', ['tipo_diagnostico_id'], { transaction });
      await queryInterface.addIndex('diagnosticos', ['nombre'], { transaction });

      // ===================================
      // HABITACIONES
      // ===================================
      await queryInterface.createTable('habitaciones', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        tipo_de_servicio_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'tiposdeservicio', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        tipo: {
          type: Sequelize.ENUM('Doble', 'Colectiva', 'Individual'),
          defaultValue: 'Colectiva'
        },
        numero: { type: Sequelize.STRING(10), allowNull: false },
        sector_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'sectores', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        sexo_permitido: {
          type: Sequelize.ENUM('Masculino', 'Femenino', 'Mixto'),
          defaultValue: 'Mixto'
        },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction, engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

      await queryInterface.addIndex('habitaciones', ['tipo_de_servicio_id'], { transaction });
      await queryInterface.addIndex('habitaciones', ['sector_id'], { transaction });

      // ===================================
      // CAMAS
      // ===================================
      await queryInterface.createTable('camas', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        habitacion_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'habitaciones', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        numero: { type: Sequelize.STRING(10), allowNull: false },
        sexo_ocupante: {
          type: Sequelize.ENUM('Masculino', 'Femenino', 'Otro'),
          allowNull: true
        },
        estado: {
          type: Sequelize.ENUM('Libre', 'Ocupada', 'EnLimpieza'),
          defaultValue: 'Libre'
        },
        fecha_fin_limpieza: { type: Sequelize.DATE, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction, engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

      await queryInterface.addIndex('camas', ['habitacion_id'], { transaction });
      await queryInterface.addIndex('camas', ['estado'], { transaction });

      await transaction.commit();
      console.log('✅ Migración 03: Infraestructura creada exitosamente');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error en migración 03:', error.message);
      throw error;
    }
  },

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('camas', { transaction });
      await queryInterface.dropTable('habitaciones', { transaction });
      await queryInterface.dropTable('diagnosticos', { transaction });
      
      await transaction.commit();
      console.log('✅ Migración 03: Revertida exitosamente');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error al revertir migración 03:', error.message);
      throw error;
    }
  }
};