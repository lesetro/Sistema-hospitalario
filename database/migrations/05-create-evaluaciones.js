
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log('📦 Migración 05: Creando evaluaciones...');

      // ===================================
      // EVALUACIONES MEDICAS (sin estudio_solicitado_id que se agrega en 07)
      // ===================================
      await queryInterface.createTable('evaluacionesmedicas', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        paciente_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'pacientes', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        medico_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'medicos', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        fecha: { type: Sequelize.DATE, allowNull: false },
        diagnostico_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'diagnosticos', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        turno_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'turnos', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        observaciones_diagnostico: { type: Sequelize.TEXT, allowNull: true },
        tratamiento_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'tratamientos', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction, engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

      await queryInterface.addIndex('evaluacionesmedicas', ['paciente_id'], { transaction });
      await queryInterface.addIndex('evaluacionesmedicas', ['medico_id'], { transaction });
      await queryInterface.addIndex('evaluacionesmedicas', ['diagnostico_id'], { transaction });
      await queryInterface.addIndex('evaluacionesmedicas', ['turno_id'], { transaction });
      await queryInterface.addIndex('evaluacionesmedicas', ['tratamiento_id'], { transaction });
      await queryInterface.addIndex('evaluacionesmedicas', ['fecha'], { transaction });

      // ===================================
      // ESTUDIOS SOLICITADOS
      // ===================================
      await queryInterface.createTable('estudiossolicitados', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        evaluacion_medica_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'evaluacionesmedicas', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        paciente_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'pacientes', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        tipo_estudio_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'tiposestudio', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        urgencia: {
          type: Sequelize.ENUM('Normal', 'Alta'),
          allowNull: false,
          defaultValue: 'Normal'
        },
        estado: {
          type: Sequelize.ENUM('Pendiente', 'Realizado', 'Cancelado'),
          defaultValue: 'Pendiente'
        },
        observaciones: { type: Sequelize.TEXT, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction, engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

      await queryInterface.addIndex('estudiossolicitados', ['evaluacion_medica_id'], { transaction });
      await queryInterface.addIndex('estudiossolicitados', ['paciente_id'], { transaction });
      await queryInterface.addIndex('estudiossolicitados', ['tipo_estudio_id'], { transaction });
      await queryInterface.addIndex('estudiossolicitados', ['estado'], { transaction });

      // ===================================
      // TURNOS ESTUDIOS
      // ===================================
      await queryInterface.createTable('turnosestudios', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        estudio_solicitado_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'estudiossolicitados', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        fecha: { type: Sequelize.DATEONLY, allowNull: false },
        hora: { type: Sequelize.TIME, allowNull: false },
        estado: {
          type: Sequelize.ENUM('Pendiente', 'Realizado', 'Cancelado'),
          defaultValue: 'Pendiente'
        },
        resultado: { type: Sequelize.TEXT, allowNull: true },
        lista_espera_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'listasesperas', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction, engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

      await queryInterface.addIndex('turnosestudios', ['estudio_solicitado_id'], { transaction });
      await queryInterface.addIndex('turnosestudios', ['fecha', 'hora'], { transaction });
      await queryInterface.addIndex('turnosestudios', ['estado'], { transaction });
      await queryInterface.addIndex('turnosestudios', ['lista_espera_id'], { transaction });

      // ===================================
      // PROCEDIMIENTOS PRE QUIRURGICOS
      // ===================================
      await queryInterface.createTable('procedimientosprequirurgicos', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        evaluacion_medica_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'evaluacionesmedicas', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        nombre: { type: Sequelize.STRING(100), allowNull: false },
        descripcion: { type: Sequelize.TEXT, allowNull: true },
        estado: {
          type: Sequelize.ENUM('Pendiente', 'Completado'),
          defaultValue: 'Pendiente'
        },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction, engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

      await queryInterface.addIndex('procedimientosprequirurgicos', ['evaluacion_medica_id'], { transaction });

      // ===================================
      // PROCEDIMIENTOS ENFERMERIA
      // ===================================
      await queryInterface.createTable('procedimientosenfermeria', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        nombre: { type: Sequelize.STRING(100), allowNull: false },
        descripcion: { type: Sequelize.TEXT, allowNull: true },
        duracion_estimada: { type: Sequelize.INTEGER, allowNull: true },
        requiere_preparacion: { type: Sequelize.BOOLEAN, defaultValue: false },
        tratamiento_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'tratamientos', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        evaluacion_medica_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'evaluacionesmedicas', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction, engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

      await queryInterface.addIndex('procedimientosenfermeria', ['evaluacion_medica_id'], { transaction });
      await queryInterface.addIndex('procedimientosenfermeria', ['tratamiento_id'], { transaction });

      // ===================================
      // EVALUACIONES ENFERMERIA
      // ===================================
      await queryInterface.createTable('evaluacionesenfermeria', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        paciente_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'pacientes', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        enfermero_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'enfermeros', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        medico_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'medicos', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        fecha: { type: Sequelize.DATE, allowNull: false },
        signos_vitales: { type: Sequelize.STRING(300), allowNull: true },
        procedimiento_pre_quirurgico_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'procedimientosprequirurgicos', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        nivel_triaje: {
          type: Sequelize.ENUM('Rojo', 'Amarillo', 'Verde', 'Negro'),
          allowNull: true
        },
        evaluacion_medica_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'evaluacionesmedicas', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        observaciones: { type: Sequelize.TEXT, allowNull: true },
        procedimiento_enfermeria_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'procedimientosenfermeria', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        tipo_egreso: {
          type: Sequelize.ENUM('PROCEDIMIENTO_COMPLETADO', 'DERIVACION_MEDICO', 'DERIVACION_URGENCIA', 'PENDIENTE_EVALUACION'),
          defaultValue: 'PENDIENTE_EVALUACION'
        },
        lista_espera_generada_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'listasesperas', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction, engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

      await queryInterface.addIndex('evaluacionesenfermeria', ['paciente_id'], { transaction });
      await queryInterface.addIndex('evaluacionesenfermeria', ['enfermero_id'], { transaction });
      await queryInterface.addIndex('evaluacionesenfermeria', ['medico_id'], { transaction });
      await queryInterface.addIndex('evaluacionesenfermeria', ['procedimiento_pre_quirurgico_id'], { transaction });
      await queryInterface.addIndex('evaluacionesenfermeria', ['procedimiento_enfermeria_id'], { transaction });
      await queryInterface.addIndex('evaluacionesenfermeria', ['evaluacion_medica_id'], { transaction });
      await queryInterface.addIndex('evaluacionesenfermeria', ['lista_espera_generada_id'], { transaction });
      await queryInterface.addIndex('evaluacionesenfermeria', ['fecha'], { transaction });

      // ===================================
      // CONTROLES ENFERMERIA
      // ===================================
      await queryInterface.createTable('controlesenfermeria', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        evaluacion_enfermeria_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'evaluacionesenfermeria', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        alergias: { type: Sequelize.TEXT, allowNull: true },
        evaluacion_medica_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'evaluacionesmedicas', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        antecedentes_familiares: { type: Sequelize.TEXT, allowNull: true },
        antecedentes_personales: { type: Sequelize.TEXT, allowNull: true },
        grupo_sanguineo: { type: Sequelize.STRING(10), allowNull: true },
        factor_rh: { type: Sequelize.ENUM('Positivo', 'Negativo'), allowNull: true },
        peso: { type: Sequelize.FLOAT, allowNull: true },
        altura: { type: Sequelize.FLOAT, allowNull: true },
        presion_arterial: { type: Sequelize.STRING(20), allowNull: true },
        frecuencia_cardiaca: { type: Sequelize.STRING(20), allowNull: true },
        frecuencia_respiratoria: { type: Sequelize.INTEGER, allowNull: true },
        temperatura: { type: Sequelize.FLOAT, allowNull: true },
        nivel_oxigeno: { type: Sequelize.STRING(20), allowNull: true },
        nivel_glucosa: { type: Sequelize.FLOAT, allowNull: true },
        nivel_colesterol: { type: Sequelize.STRING(20), allowNull: true },
        nivel_trigliceridos: { type: Sequelize.STRING(20), allowNull: true },
        nivel_creatinina: { type: Sequelize.STRING(20), allowNull: true },
        nivel_urea: { type: Sequelize.STRING(20), allowNull: true },
        nivel_acido_urico: { type: Sequelize.STRING(20), allowNull: true },
        nivel_hb: { type: Sequelize.STRING(20), allowNull: true },
        nivel_hct: { type: Sequelize.STRING(20), allowNull: true },
        nivel_leucocitos: { type: Sequelize.STRING(20), allowNull: true },
        nivel_plaquetas: { type: Sequelize.STRING(20), allowNull: true },
        nivel_proteinas: { type: Sequelize.STRING(20), allowNull: true },
        nivel_albumina: { type: Sequelize.STRING(20), allowNull: true },
        nivel_globulina: { type: Sequelize.STRING(20), allowNull: true },
        nivel_fosfatasa: { type: Sequelize.STRING(20), allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction, engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

      await queryInterface.addIndex('controlesenfermeria', ['evaluacion_enfermeria_id'], { transaction });
      await queryInterface.addIndex('controlesenfermeria', ['evaluacion_medica_id'], { transaction });

      await transaction.commit();
      console.log('✅ Migración 05: Evaluaciones creadas exitosamente');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error en migración 05:', error.message);
      throw error;
    }
  },

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('controlesenfermeria', { transaction });
      await queryInterface.dropTable('evaluacionesenfermeria', { transaction });
      await queryInterface.dropTable('procedimientosenfermeria', { transaction });
      await queryInterface.dropTable('procedimientosprequirurgicos', { transaction });
      await queryInterface.dropTable('turnosestudios', { transaction });
      await queryInterface.dropTable('estudiossolicitados', { transaction });
      await queryInterface.dropTable('evaluacionesmedicas', { transaction });
      
      await transaction.commit();
      console.log('✅ Migración 05: Revertida exitosamente');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error al revertir migración 05:', error.message);
      throw error;
    }
  }
};