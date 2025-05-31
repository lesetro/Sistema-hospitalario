module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable('Habitaciones', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        tipo_servicio_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'TiposDeServicio', key: 'id' } },
        tipo_internacion_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'TiposInternacion', key: 'id' } },
        numero: { type: Sequelize.STRING(50), allowNull: false, unique: true },
        tipo_habitacion: { type: Sequelize.ENUM('General', 'UTI', 'Quirofano'), allowNull: false },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      }, { transaction, indexes: [{ fields: ['tipo_servicio_id'] }, { fields: ['tipo_internacion_id'] }] });

      await queryInterface.createTable('Camas', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        habitacion_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Habitaciones', key: 'id' } },
        numero: { type: Sequelize.STRING(50), allowNull: false },
        estado: { type: Sequelize.ENUM('Disponible', 'Ocupada', 'Reservada'), defaultValue: 'Disponible' },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      }, { transaction, indexes: [{ fields: ['habitacion_id'] }] });

      await queryInterface.createTable('TurnosPersonal', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        sector_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Sectores', key: 'id' } },
        fecha_inicio: { type: Sequelize.DATE, allowNull: false },
        fecha_fin: { type: Sequelize.DATE, allowNull: false },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      }, { transaction, indexes: [{ fields: ['sector_id'] }] });

      await queryInterface.createTable('Turnos', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        paciente_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Pacientes', key: 'usuario_id' } },
        medico_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Medicos', key: 'usuario_id' } },
        tipo_turno_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'TiposTurno', key: 'id' } },
        fecha: { type: Sequelize.DATE, allowNull: false },
        estado: { type: Sequelize.ENUM('Pendiente', 'Realizado', 'Cancelado'), defaultValue: 'Pendiente' },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      }, { transaction, indexes: [{ fields: ['paciente_id'] }, { fields: ['medico_id'] }, { fields: ['tipo_turno_id'] }] });

      await queryInterface.createTable('Admisiones', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        paciente_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Pacientes', key: 'usuario_id' } },
        administrativo_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Administrativos', key: 'usuario_id' } },
        estado: { type: Sequelize.ENUM('Pendiente', 'Cancelada', 'Completada'), defaultValue: 'Pendiente' },
        fecha: { type: Sequelize.DATE, allowNull: false },
        motivo_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'MotivosAdmision', key: 'id' } },
        forma_ingreso_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'FormasIngreso', key: 'id' } },
        turno_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'Turnos', key: 'id' } },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      }, { transaction, indexes: [{ fields: ['paciente_id'] }, { fields: ['administrativo_id'] }, { fields: ['motivo_id'] }, { fields: ['forma_ingreso_id'] }, { fields: ['turno_id'] }] });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('Admisiones', { transaction });
      await queryInterface.dropTable('Turnos', { transaction });
      await queryInterface.dropTable('TurnosPersonal', { transaction });
      await queryInterface.dropTable('Camas', { transaction });
      await queryInterface.dropTable('Habitaciones', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};