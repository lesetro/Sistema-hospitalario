module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
   
      await queryInterface.createTable('IntervencionesQuirurgicas', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        paciente_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Pacientes', key: 'id' } },
        medico_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Medicos', key: 'id' } },
        habitacion_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Habitaciones', key: 'id' } },
        internacion_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Internaciones', key: 'id' } },
        procedimiento_pre_quirurgico_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'ProcedimientosPreQuirurgicos', key: 'id' } },
        fecha: { type: Sequelize.DATE, allowNull: false },
        resultado: { type: Sequelize.ENUM('Exito', 'Complicaciones', 'Cancelada'), allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      }, { transaction, indexes: [{ fields: ['paciente_id'] }, { fields: ['medico_id'] }, { fields: ['habitacion_id'] }, { fields: ['internacion_id'] }, { fields: ['procedimiento_pre_quirurgico_id'] } ]});

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
 
      await queryInterface.dropTable('IntervencionesQuirurgicas', { transaction });
 
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};