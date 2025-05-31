module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable('Roles', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        nombre: { type: Sequelize.STRING(100), allowNull: false, unique: true },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      }, { transaction });

      await queryInterface.createTable('TiposDeServicio', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        nombre: { type: Sequelize.STRING(100), allowNull: false, unique: true },
        descripcion: { type: Sequelize.STRING(255), allowNull: true }
      }, { transaction });

      await queryInterface.createTable('TiposInternacion', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        nombre: { type: Sequelize.STRING(100), allowNull: false, unique: true },
        descripcion: { type: Sequelize.STRING(255), allowNull: true }
      }, { transaction });

      await queryInterface.createTable('TiposDiagnostico', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        nombre: { type: Sequelize.STRING(100), allowNull: false, unique: true },
        descripcion: { type: Sequelize.STRING(255), allowNull: true }
      }, { transaction });

      await queryInterface.createTable('TiposEstudio', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        nombre: { type: Sequelize.STRING(100), allowNull: false, unique: true },
        descripcion: { type: Sequelize.STRING(255), allowNull: true }
      }, { transaction });

      await queryInterface.createTable('TiposTurno', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        nombre: { type: Sequelize.STRING(100), allowNull: false, unique: true },
        descripcion: { type: Sequelize.STRING(255), allowNull: true }
      }, { transaction });

      await queryInterface.createTable('MotivosAdmision', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        nombre: { type: Sequelize.STRING(100), allowNull: false, unique: true },
        descripcion: { type: Sequelize.STRING(255), allowNull: true }
      }, { transaction });

      await queryInterface.createTable('FormasIngreso', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        nombre: { type: Sequelize.STRING(100), allowNull: false, unique: true },
        descripcion: { type: Sequelize.STRING(255), allowNull: true }
      }, { transaction });

      await queryInterface.createTable('MotivosConsultas', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        nombre: { type: Sequelize.STRING(100), allowNull: false },
        descripcion: { type: Sequelize.TEXT, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      }, { transaction });

      await queryInterface.createTable('ObrasSociales', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        nombre: { type: Sequelize.STRING(100), allowNull: false, unique: true },
        descripcion: { type: Sequelize.STRING(255), allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      }, { transaction });

      await queryInterface.createTable('Especialidades', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        nombre: { type: Sequelize.STRING(100), allowNull: false, unique: true },
        descripcion: { type: Sequelize.STRING(255), allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      }, { transaction });

      await queryInterface.createTable('Sectores', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        nombre: { type: Sequelize.STRING(100), allowNull: false, unique: true },
        descripcion: { type: Sequelize.STRING(255), allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      }, { transaction });

      await queryInterface.createTable('Tratamientos', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        nombre: { type: Sequelize.STRING(100), allowNull: false },
        descripcion: { type: Sequelize.TEXT, allowNull: false },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('Tratamientos', { transaction });
      await queryInterface.dropTable('Sectores', { transaction });
      await queryInterface.dropTable('Especialidades', { transaction });
      await queryInterface.dropTable('ObrasSociales', { transaction });
      await queryInterface.dropTable('MotivosConsultas', { transaction });
      await queryInterface.dropTable('FormasIngreso', { transaction });
      await queryInterface.dropTable('MotivosAdmision', { transaction });
      await queryInterface.dropTable('TiposTurno', { transaction });
      await queryInterface.dropTable('TiposEstudio', { transaction });
      await queryInterface.dropTable('TiposDiagnostico', { transaction });
      await queryInterface.dropTable('TiposInternacion', { transaction });
      await queryInterface.dropTable('TiposDeServicio', { transaction });
      await queryInterface.dropTable('Roles', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};