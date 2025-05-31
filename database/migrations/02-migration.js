module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable('Usuarios', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        rol_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Roles', key: 'id' } },
        nombre: { type: Sequelize.STRING(100), allowNull: false },
        email: { type: Sequelize.STRING(100), allowNull: false, unique: true },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      }, { transaction, indexes: [{ fields: ['rol_id'] }] });

      await queryInterface.createTable('Administrativos', {
        usuario_id: { type: Sequelize.INTEGER, primaryKey: true, references: { model: 'Usuarios', key: 'id' } },
        sector_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Sectores', key: 'id' } },
        turno_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'TurnosPersonal', key: 'id' } },
        responsabilidad: { type: Sequelize.ENUM('Expediente', 'Turnos', 'Legajos', 'Derivaciones', 'General', 'Otros'), defaultValue: 'General' },
        descripcion: { type: Sequelize.STRING(255), allowNull: true },
        estado: { type: Sequelize.ENUM('Activo', 'Inactivo'), defaultValue: 'Activo' },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      }, { transaction, indexes: [{ fields: ['usuario_id'], unique: true }, { fields: ['sector_id'] }, { fields: ['turno_id'] }] });


      await queryInterface.createTable('Pacientes', {
        usuario_id: { type: Sequelize.INTEGER, primaryKey: true, references: { model: 'Usuarios', key: 'id' } },
        obra_social_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'ObrasSociales', key: 'id' } },
        administrativo_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'Administrativos', key: 'usuario_id' } },
        nombre: { type: Sequelize.STRING(100), allowNull: false },
        dni: { type: Sequelize.STRING(20), allowNull: false, unique: true },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      }, { transaction, indexes: [{ fields: ['obra_social_id'] }, { fields: ['administrativo_id'] }] });

      await queryInterface.createTable('Medicos', {
        usuario_id: { type: Sequelize.INTEGER, primaryKey: true, references: { model: 'Usuarios', key: 'id' } },
        especialidad_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Especialidades', key: 'id' } },
        sector_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Sectores', key: 'id' } },
        matricula: { type: Sequelize.STRING(50), allowNull: false, unique: true },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      }, { transaction, indexes: [{ fields: ['especialidad_id'] }, { fields: ['sector_id'] }] });

      await queryInterface.createTable('Enfermeros', {
        usuario_id: { type: Sequelize.INTEGER, primaryKey: true, references: { model: 'Usuarios', key: 'id' } },
        sector_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Sectores', key: 'id' } },
        matricula: { type: Sequelize.STRING(50), allowNull: false, unique: true },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      }, { transaction, indexes: [{ fields: ['sector_id'] }] });

      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('Administrativos', { transaction });
      await queryInterface.dropTable('Enfermeros', { transaction });
      await queryInterface.dropTable('Medicos', { transaction });
      await queryInterface.dropTable('Pacientes', { transaction });
      await queryInterface.dropTable('Usuarios', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};