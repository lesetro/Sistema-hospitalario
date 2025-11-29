
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log('📦 Migración 04: Creando turnos y admisiones...');

      // ===================================
      // LISTAS DE ESPERA
      // ===================================
      await queryInterface.createTable('listasesperas', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        paciente_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'pacientes', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        tipo_turno_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'tipos_turno', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        tipo_estudio_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'tiposestudio', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        especialidad_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'especialidades', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        prioridad: {
          type: Sequelize.ENUM('ALTA', 'MEDIA', 'BAJA'),
          allowNull: false,
          defaultValue: 'MEDIA'
        },
        estado: {
          type: Sequelize.ENUM('PENDIENTE', 'ASIGNADO', 'CANCELADO', 'COMPLETADO'),
          allowNull: false,
          defaultValue: 'PENDIENTE'
        },
        habitacion_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'habitaciones', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        creador_tipo: {
          type: Sequelize.ENUM('ADMINISTRATIVO', 'ENFERMERO', 'MEDICO'),
          allowNull: false,
          defaultValue: 'ADMINISTRATIVO'
        },
        creador_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'usuarios', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        fecha_registro: { type: Sequelize.DATE, allowNull: false },
        turno_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'turnos', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction, engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

      await queryInterface.addIndex('listasesperas', ['tipo_turno_id', 'prioridad', 'estado'], { transaction });
      await queryInterface.addIndex('listasesperas', ['paciente_id'], { transaction });
      await queryInterface.addIndex('listasesperas', ['tipo_estudio_id'], { transaction });
      await queryInterface.addIndex('listasesperas', ['especialidad_id'], { transaction });
      await queryInterface.addIndex('listasesperas', ['habitacion_id'], { transaction });
      await queryInterface.addIndex('listasesperas', ['creador_id'], { transaction });
      await queryInterface.addIndex('listasesperas', ['turno_id'], { transaction });

      // ===================================
      // TURNOS (sin algunas FK que se agregan en migración 07)
      // ===================================
      await queryInterface.createTable('turnos', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        fecha: { type: Sequelize.DATEONLY, allowNull: false },
        hora_inicio: { type: Sequelize.TIME, allowNull: false },
        hora_fin: { type: Sequelize.TIME, allowNull: true },
        estado: {
          type: Sequelize.ENUM('PENDIENTE', 'CONFIRMADO', 'COMPLETADO', 'CANCELADO'),
          defaultValue: 'PENDIENTE'
        },
        paciente_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'pacientes', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        medico_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'medicos', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        usuario_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'usuarios', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        sector_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'sectores', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        // NOTA: evaluacion_medica_id, tipo_estudio_id se agregan en migración 07
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction, engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

      await queryInterface.addIndex('turnos', ['fecha', 'estado'], { transaction });
      await queryInterface.addIndex('turnos', ['paciente_id', 'estado'], { transaction });
      await queryInterface.addIndex('turnos', ['medico_id'], { transaction });
      await queryInterface.addIndex('turnos', ['usuario_id'], { transaction });
      await queryInterface.addIndex('turnos', ['sector_id'], { transaction });

      // ===================================
      // ADMISIONES
      // ===================================
      await queryInterface.createTable('admisiones', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        paciente_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'pacientes', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        administrativo_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'administrativos', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        estado: {
          type: Sequelize.ENUM('Pendiente', 'Cancelada', 'Completada'),
          defaultValue: 'Pendiente'
        },
        fecha: { type: Sequelize.DATE, allowNull: false },
        medico_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'medicos', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        sector_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'sectores', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        motivo_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'motivosadmision', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        forma_ingreso_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'formasingreso', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        turno_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'turnos', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        especialidad_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'especialidades', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        tipo_estudio_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'tiposestudio', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        motivo_consulta_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'motivosconsultas', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction, engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

      await queryInterface.addIndex('admisiones', ['paciente_id'], { transaction });
      await queryInterface.addIndex('admisiones', ['administrativo_id'], { transaction });
      await queryInterface.addIndex('admisiones', ['motivo_id'], { transaction });
      await queryInterface.addIndex('admisiones', ['forma_ingreso_id'], { transaction });
      await queryInterface.addIndex('admisiones', ['turno_id'], { transaction });
      await queryInterface.addIndex('admisiones', ['medico_id'], { transaction });
      await queryInterface.addIndex('admisiones', ['estado'], { transaction });
      await queryInterface.addIndex('admisiones', ['fecha'], { transaction });
      await queryInterface.addIndex('admisiones', ['especialidad_id'], { transaction });
      await queryInterface.addIndex('admisiones', ['tipo_estudio_id'], { transaction });
      await queryInterface.addIndex('admisiones', ['motivo_consulta_id'], { transaction });

      await transaction.commit();
      console.log('✅ Migración 04: Turnos y Admisiones creados exitosamente');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error en migración 04:', error.message);
      throw error;
    }
  },

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('admisiones', { transaction });
      await queryInterface.dropTable('turnos', { transaction });
      await queryInterface.dropTable('listasesperas', { transaction });
      
      await transaction.commit();
      console.log('✅ Migración 04: Revertida exitosamente');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error al revertir migración 04:', error.message);
      throw error;
    }
  }
};