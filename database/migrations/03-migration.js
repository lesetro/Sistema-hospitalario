module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable('Habitaciones', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        tipo: { type: Sequelize.ENUM('Doble', 'Colectiva', 'Individual'),defaultValue: `Colectiva`,},
        tipo_de_servicio_id: { type: Sequelize.INTEGER, allowNull: false , references: { model: 'tiposdeservicio', key: 'id' }},
        sector_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Sectores', key: 'id' }},
        numero: { type: Sequelize.STRING(10), allowNull: false },
        sexo_permitido: { type: Sequelize.ENUM('Masculino', 'Femenino', 'Mixto'), defaultValue: 'Mixto' },
        tipo_internacion_id: { type: Sequelize.INTEGER, allowNull: false },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      }, { transaction, indexes: [{ fields: ['tipo'] }, { fields: ['tipo_internacion_id'] }] });

      await queryInterface.createTable('Camas', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        habitacion_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Habitaciones', key: 'id' } },
        numero: { type: Sequelize.STRING(50), allowNull: false },
        sexo_ocupante: { type: Sequelize.ENUM('Masculino', 'Femenino', 'Otro'), allowNull: true },
        estado: { type: Sequelize.ENUM('Libre', 'Ocupada', 'EnLimpieza'), defaultValue: 'Libre' },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
        fecha_fin_limpieza: { type: Sequelize.DATE, allowNull: true },
      }, { transaction, indexes: [{ fields: ['habitacion_id'] }] });

      await queryInterface.createTable('Turnos', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        tipo_turno_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'tipos_turno', key: 'id' } },
        fecha: { type: Sequelize.DATEONLY, allowNull: false },
        hora_inicio: { type: Sequelize.TIME, allowNull: false },
        hora_fin: { type: Sequelize.TIME, allowNull: true },
        estado: { type: Sequelize.ENUM('PENDIENTE', 'CONFIRMADO', 'COMPLETADO', 'CANCELADO'), defaultValue: 'PENDIENTE' },
        paciente_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'Pacientes', key: 'id' } },
        medico_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'Medicos', key: 'id' } },
        usuario_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'Usuarios', key: 'id' } },
        sector_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'Sectores', key: 'id' } },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
        lista_espera_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: "ListasEspera", key: "id" },},
        evaluacion_medica_id: { type: Sequelize.INTEGER,allowNull: true, references: { model: 'Evaluacionesmedicas', key: 'id' } },
        tipo_estudio_id: { type: Sequelize.INTEGER,  allowNull: true,references: { model: 'TiposEstudio', key: 'id' } }
  
        }, {
       transaction,
            indexes: [
                { fields: ['tipo_turno_id', 'fecha', 'estado'] },
                { fields: ['paciente_id', 'estado'] },
                { fields: ['medico_id'] },
                { fields: ['usuario_id'] },
                { fields: ['sector_id'] },
                ],
      });

    await queryInterface.createTable('Admisiones', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      paciente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Pacientes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      administrativo_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Administrativos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      estado: {
        type: Sequelize.ENUM('Pendiente', 'Cancelada', 'Completada'),
        defaultValue: 'Pendiente'
      },
      fecha: {
        type: Sequelize.DATE,
        allowNull: false
      },
      medico_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Medicos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      sector_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Sectores',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      motivo_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'MotivosAdmision',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      forma_ingreso_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'FormasIngreso',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      turno_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Turnos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      especialidad_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Especialidades',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      tipo_estudio_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'TiposEstudio',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    }, {
      engine: 'InnoDB',
      indexes: [
        { fields: ['paciente_id'] },
        { fields: ['administrativo_id'] },
        { fields: ['motivo_id'] },
        { fields: ['forma_ingreso_id'] },
        { fields: ['turno_id'] },
        { fields: ['medico_id'] }
      ]
    });
    
  
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