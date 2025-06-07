// database/migrations/01-migration.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Crear tabla Usuarios
      await queryInterface.createTable('Usuarios', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        dni: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true
        },
        nombre: {
          type: Sequelize.STRING,
          allowNull: false
        },
        apellido: {
          type: Sequelize.STRING,
          allowNull: false
        },
        email: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true
        },
        password: {
          type: Sequelize.STRING,
          allowNull: false
        },
        rol_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'Roles', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        telefono: {
          type: Sequelize.STRING(20),
          allowNull: true
        },
        fecha_nacimiento: {
          type: Sequelize.DATE,
          allowNull: false
        },
        sexo: {
          type: Sequelize.ENUM('Masculino', 'Femenino', 'Otro'),
          allowNull: false
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false
        }
      }, {
        transaction,
        engine: 'InnoDB',
        indexes: [
          { fields: ['dni'], unique: true },
          { fields: ['email'], unique: true },
          { fields: ['rol_id'] }
        ]
      });

      // Crear tabla Administrativos
      await queryInterface.createTable('Administrativos', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        usuario_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          unique: true,
          references: { model: 'Usuarios', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        sector_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'Sectores', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        turno_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'TurnosPersonal', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        responsabilidad: {
          type: Sequelize.ENUM('Expediente', 'Turnos', 'Legajos', 'Derivaciones', 'General', 'Otros'),
          defaultValue: 'General'
        },
        descripcion: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        estado: {
          type: Sequelize.ENUM('Activo', 'Inactivo'),
          defaultValue: 'Activo'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false
        }
      }, {
        transaction,
        engine: 'InnoDB',
        indexes: [
          { fields: ['usuario_id'], unique: true },
          { fields: ['sector_id'] },
          { fields: ['turno_id'] }
        ]
      });

      // Crear tabla Pacientes
    await queryInterface.createTable('Pacientes', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  usuario_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    unique: true,
    references: { model: 'Usuarios', key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT'
  },
  dni: {
    type: Sequelize.STRING,
    allowNull: false
  },
  nombre: {
    type: Sequelize.STRING,
    allowNull: false
  },
  apellido: {
    type: Sequelize.STRING,
    allowNull: false
  },
  sexo: {
    type: Sequelize.ENUM('Masculino', 'Femenino', 'Otro'),
    allowNull: true
  },
  fecha_nacimiento: {
    type: Sequelize.DATE,
    allowNull: false
  },
  obra_social_id: {
    type: Sequelize.INTEGER,
    allowNull: true,
    references: { model: 'ObrasSociales', key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  },
  administrativo_id: {
    type: Sequelize.INTEGER,
    allowNull: true,
    references: { model: 'Administrativos', key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  },
  fecha_ingreso: {
    type: Sequelize.DATE,
    allowNull: false
  },
  fecha_egreso: {
    type: Sequelize.DATE,
    allowNull: true
  },
  estado: {
    type: Sequelize.ENUM('Activo', 'Inactivo', 'Baja'),
    defaultValue: 'Activo'
  },
  observaciones: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  created_at: {
    type: Sequelize.DATE,
    allowNull: false
  },
  updated_at: {
    type: Sequelize.DATE,
    allowNull: false
  }
}, {
  transaction,
  engine: 'InnoDB',
  indexes: [
    { fields: ['usuario_id'], unique: true },
    { fields: ['dni'] },
    { fields: ['obra_social_id'] },
    { fields: ['administrativo_id'] }
  ]
});

      // Crear tabla Medicos
      await queryInterface.createTable('Medicos', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        usuario_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          unique: true,
          references: { model: 'Usuarios', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        especialidad_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'Especialidades', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        sector_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'Sectores', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        matricula: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false
        }
      }, {
        transaction,
        engine: 'InnoDB',
        indexes: [
          { fields: ['usuario_id'], unique: true },
          { fields: ['matricula'], unique: true },
          { fields: ['especialidad_id'] },
          { fields: ['sector_id'] }
        ]
      });

      // Crear tabla Enfermeros
      await queryInterface.createTable('Enfermeros', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        usuario_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          unique: true,
          references: { model: 'Usuarios', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        sector_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'Sectores', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false
        }
      }, {
        transaction,
        engine: 'InnoDB',
        indexes: [
          { fields: ['usuario_id'], unique: true },
          { fields: ['sector_id'] }
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
      await queryInterface.dropTable('Enfermeros', { transaction });
      await queryInterface.dropTable('Medicos', { transaction });
      await queryInterface.dropTable('Pacientes', { transaction });
      await queryInterface.dropTable('Administrativos', { transaction });
      await queryInterface.dropTable('Usuarios', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};