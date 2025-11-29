
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log('🔗 Migración 07: Agregando foreign keys circulares...');

      // ===================================
      // FK en TURNOS
      // ===================================
      
      // evaluacion_medica_id
      await queryInterface.addColumn('turnos', 'evaluacion_medica_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'evaluacionesmedicas', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }, { transaction });

      // tipo_estudio_id
      await queryInterface.addColumn('turnos', 'tipo_estudio_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'tiposestudio', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }, { transaction });

      await queryInterface.addIndex('turnos', ['evaluacion_medica_id'], { transaction });
      await queryInterface.addIndex('turnos', ['tipo_estudio_id'], { transaction });

      // ===================================
      // FK en INTERNACIONES
      // ===================================
      
      // intervencion_quirurgica_id (dependencia circular con intervencionesquirurgicas)
      await queryInterface.addColumn('internaciones', 'intervencion_quirurgica_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'intervencionesquirurgicas', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }, { transaction });

      await queryInterface.addIndex('internaciones', ['intervencion_quirurgica_id'], { transaction });

      // ===================================
      // FK en EVALUACIONES MEDICAS
      // ===================================
      
      // estudio_solicitado_id (dependencia circular con estudiossolicitados)
      await queryInterface.addColumn('evaluacionesmedicas', 'estudio_solicitado_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'estudiossolicitados', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }, { transaction });

      await queryInterface.addIndex('evaluacionesmedicas', ['estudio_solicitado_id'], { transaction });

      await transaction.commit();
      console.log('✅ Migración 07: Foreign keys circulares agregadas exitosamente');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error en migración 07:', error.message);
      throw error;
    }
  },

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Eliminar índices primero
      await queryInterface.removeIndex('evaluacionesmedicas', ['estudio_solicitado_id'], { transaction });
      await queryInterface.removeIndex('internaciones', ['intervencion_quirurgica_id'], { transaction });
      await queryInterface.removeIndex('turnos', ['tipo_estudio_id'], { transaction });
      await queryInterface.removeIndex('turnos', ['evaluacion_medica_id'], { transaction });

      // Eliminar columnas
      await queryInterface.removeColumn('evaluacionesmedicas', 'estudio_solicitado_id', { transaction });
      await queryInterface.removeColumn('internaciones', 'intervencion_quirurgica_id', { transaction });
      await queryInterface.removeColumn('turnos', 'tipo_estudio_id', { transaction });
      await queryInterface.removeColumn('turnos', 'evaluacion_medica_id', { transaction });

      await transaction.commit();
      console.log('✅ Migración 07: Revertida exitosamente');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error al revertir migración 07:', error.message);
      throw error;
    }
  }
};