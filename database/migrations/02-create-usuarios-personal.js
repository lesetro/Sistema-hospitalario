
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log('📦 Migración 02: Creando usuarios y personal...');

      // ===================================
      // USUARIOS
      // ===================================
      await queryInterface.createTable('usuarios', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        dni: { type: Sequelize.STRING(20), allowNull: false, unique: true },
        nombre: { type: Sequelize.STRING(100), allowNull: false },
        apellido: { type: Sequelize.STRING(100), allowNull: false },
        email: { type: Sequelize.STRING(255), allowNull: false, unique: true },
        password: { type: Sequelize.STRING(255), allowNull: false },
        rol_principal_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'roles', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        rol_secundario_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'roles', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        estado: {
          type: Sequelize.ENUM('Activo', 'Inactivo', 'Bloqueado', 'Pendiente'),
          allowNull: false,
          defaultValue: 'Pendiente'
        },
        telefono: { type: Sequelize.STRING(20), allowNull: true },
        fecha_nacimiento: { type: Sequelize.DATE, allowNull: false },
        sexo: { type: Sequelize.ENUM('Masculino', 'Femenino', 'Otro'), allowNull: false },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction, engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

      await queryInterface.addIndex('usuarios', ['dni'], { unique: true, transaction });
      await queryInterface.addIndex('usuarios', ['email'], { unique: true, transaction });
      await queryInterface.addIndex('usuarios', ['rol_principal_id'], { transaction });
      await queryInterface.addIndex('usuarios', ['rol_secundario_id'], { transaction });
      await queryInterface.addIndex('usuarios', ['estado'], { transaction });

      // ===================================
      // TURNOS PERSONAL
      // ===================================
      await queryInterface.createTable('turnospersonal', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        usuario_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'usuarios', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        tipo: {
          type: Sequelize.ENUM('Guardia Activa', 'Guardia Pasiva', 'Atencion'),
          allowNull: false
        },
        dias: { type: Sequelize.STRING(100), allowNull: false },
        hora_inicio: { type: Sequelize.TIME, allowNull: false },
        hora_fin: { type: Sequelize.TIME, allowNull: false },
        sector_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'sectores', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction, engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

      await queryInterface.addIndex('turnospersonal', ['usuario_id', 'sector_id', 'tipo'], { transaction });
      await queryInterface.addIndex('turnospersonal', ['hora_inicio'], { transaction });
      await queryInterface.addIndex('turnospersonal', ['hora_fin'], { transaction });

      // ===================================
      // ADMINISTRATIVOS
      // ===================================
      await queryInterface.createTable('administrativos', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        usuario_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          unique: true,
          references: { model: 'usuarios', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        sector_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'sectores', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        turno_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'turnospersonal', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        responsabilidad: {
          type: Sequelize.ENUM('Expediente', 'Turnos', 'Legajos', 'Derivaciones', 'General', 'Otros'),
          defaultValue: 'General'
        },
        descripcion: { type: Sequelize.STRING(255), allowNull: true },
        estado: { type: Sequelize.ENUM('Activo', 'Inactivo'), defaultValue: 'Activo' },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction, engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

      await queryInterface.addIndex('administrativos', ['usuario_id'], { unique: true, transaction });
      await queryInterface.addIndex('administrativos', ['sector_id'], { transaction });
      await queryInterface.addIndex('administrativos', ['turno_id'], { transaction });

      // ===================================
      // MEDICOS
      // ===================================
      await queryInterface.createTable('medicos', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        usuario_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          unique: true,
          references: { model: 'usuarios', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        matricula: { type: Sequelize.STRING(100), allowNull: false, unique: true },
        especialidad_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'especialidades', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        sector_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'sectores', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction, engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

      await queryInterface.addIndex('medicos', ['usuario_id'], { unique: true, transaction });
      await queryInterface.addIndex('medicos', ['matricula'], { unique: true, transaction });
      await queryInterface.addIndex('medicos', ['especialidad_id'], { transaction });
      await queryInterface.addIndex('medicos', ['sector_id'], { transaction });

      // ===================================
      // ENFERMEROS
      // ===================================
      await queryInterface.createTable('enfermeros', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        usuario_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          unique: true,
          references: { model: 'usuarios', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        sector_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'sectores', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        matricula: { type: Sequelize.STRING(100), allowNull: false, unique: true },
        nivel: { 
          type: Sequelize.ENUM('Licenciado', 'Técnico', 'Auxiliar'), 
          allowNull: false 
        },
        estado: { 
          type: Sequelize.ENUM('Activo', 'Licencia', 'Inactivo'), 
          defaultValue: 'Activo' 
        },
        fecha_ingreso: { type: Sequelize.DATE, allowNull: false },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction, engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

      await queryInterface.addIndex('enfermeros', ['usuario_id'], { unique: true, transaction });
      await queryInterface.addIndex('enfermeros', ['sector_id'], { transaction });
      await queryInterface.addIndex('enfermeros', ['matricula'], { unique: true, transaction });
      await queryInterface.addIndex('enfermeros', ['estado'], { transaction });

      // ===================================
      // PACIENTES
      // ===================================
      await queryInterface.createTable('pacientes', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        usuario_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          unique: true,
          references: { model: 'usuarios', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        administrativo_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'administrativos', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        obra_social_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'obrassociales', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        fecha_ingreso: { type: Sequelize.DATE, allowNull: false },
        fecha_egreso: { type: Sequelize.DATE, allowNull: true },
        estado: {
          type: Sequelize.ENUM('Activo', 'Inactivo', 'Baja'),
          defaultValue: 'Activo'
        },
        observaciones: { type: Sequelize.TEXT, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction, engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

      await queryInterface.addIndex('pacientes', ['usuario_id'], { unique: true, transaction });
      await queryInterface.addIndex('pacientes', ['administrativo_id'], { transaction });
      await queryInterface.addIndex('pacientes', ['obra_social_id'], { transaction });
      await queryInterface.addIndex('pacientes', ['estado'], { transaction });
      await queryInterface.addIndex('pacientes', ['fecha_ingreso'], { transaction });
      await queryInterface.addIndex('pacientes', ['fecha_ingreso', 'fecha_egreso'], { transaction });

      await transaction.commit();
      console.log('✅ Migración 02: Usuarios y Personal creados exitosamente');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error en migración 02:', error.message);
      throw error;
    }
  },

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('pacientes', { transaction });
      await queryInterface.dropTable('enfermeros', { transaction });
      await queryInterface.dropTable('medicos', { transaction });
      await queryInterface.dropTable('administrativos', { transaction });
      await queryInterface.dropTable('turnospersonal', { transaction });
      await queryInterface.dropTable('usuarios', { transaction });
      
      await transaction.commit();
      console.log('✅ Migración 02: Revertida exitosamente');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error al revertir migración 02:', error.message);
      throw error;
    }
  }
};