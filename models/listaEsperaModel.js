module.exports = (sequelize, DataTypes) => {
  const ListaEspera = sequelize.define(
    'ListaEspera',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      paciente_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'pacientes', key: 'id' }
      },
       tipo_turno_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'tipos_turno', key: 'id' } 
      },
      tipo_estudio_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'tiposestudio', key: 'id' }
      },
      especialidad_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'especialidades', key: 'id' }
      },
      prioridad: {
        type: DataTypes.ENUM('ALTA', 'MEDIA', 'BAJA'), 
        allowNull: false,
        defaultValue: 'MEDIA'
      },
      estado: {
        type: DataTypes.ENUM('PENDIENTE', 'ASIGNADO', 'CANCELADO', 'COMPLETADO'),
        allowNull: false,
        defaultValue: 'PENDIENTE'
      },
      habitacion_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'habitaciones', key: 'id' }
      },
      creador_tipo: {type: DataTypes.ENUM('ADMINISTRATIVO', 'ENFERMERO', 'MEDICO'), allowNull: false, defaultValue: 'ADMINISTRATIVO'},
      creador_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'usuarios', key: 'id' } },
      fecha_registro: { type: DataTypes.DATE, allowNull: false },
      turno_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'turnos', key: 'id' }
      }
    },

    {
      tableName: 'listasesperas',
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['tipo_turno_id', 'prioridad', 'estado'] },
        { fields: ['paciente_id'] },
        { fields: ['tipo_estudio_id'] },
        { fields: ['especialidad_id'] },
        { fields: ['habitacion_id'] },
        { fields: ['creador_id'] },
        { fields: ['turno_id']}
      ]
    }
  );
  

  ListaEspera.beforeUpdate(async (lista, options) => {
    // ✅ Solo validar turno si la lista de espera tiene turno_id
    // Las internaciones NO usan turnos, solo lista de espera
    if (lista.estado === 'ASIGNADO' && lista.turno_id) {
      const turno = await sequelize.models.Turno.findByPk(lista.turno_id, {
        transaction: options.transaction
      });
      
      if (!turno) {
        throw new Error('No se puede marcar como ASIGNADO sin un turno válido');
      }
    }
    
    // ✅ Validación de COMPLETADO también solo si hay turno
    if (lista.estado === 'COMPLETADO' && lista.turno_id) {
      const turno = await sequelize.models.Turno.findByPk(lista.turno_id, {
        transaction: options.transaction
      });
      
      if (!turno || turno.estado !== 'COMPLETADO') {
        throw new Error('El turno asociado debe estar COMPLETADO para marcar la lista como COMPLETADA');
      }
    }
  });

  ListaEspera.associate = function (models) {
    ListaEspera.belongsTo(models.Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
    ListaEspera.belongsTo(models.TipoEstudio, {
      foreignKey: 'tipo_estudio_id',
      as: 'tipo_estudio',
      constraints: false
    });
    ListaEspera.belongsTo(models.Especialidad, {
      foreignKey: 'especialidad_id',
      as: 'especialidad',
      constraints: false
    });
    ListaEspera.belongsTo(models.Turno, {
      foreignKey: 'turno_id',
      as: 'turno',
      constraints: false
    });
     ListaEspera.belongsTo(models.TipoTurno, { 
    foreignKey: 'tipo_turno_id', 
    as: 'tipo_turno' 
    });
    ListaEspera.belongsTo(models.Habitacion, {
      foreignKey: 'habitacion_id',
      as: 'habitacion'
    });
     ListaEspera.belongsTo(models.Administrativo, {
      foreignKey: 'creador_id',
      as: 'administrativo_creador',
      constraints: false,
    
    });
  
    ListaEspera.belongsTo(models.Enfermero, {
      foreignKey: 'creador_id', 
      as: 'enfermero_creador',
      constraints: false,
     
    });
  
    ListaEspera.belongsTo(models.Medico, {
      foreignKey: 'creador_id',
      as: 'medico_creador', 
      constraints: false,
     
    });
     ListaEspera.hasOne(models.TurnoEstudio, {
        foreignKey: 'lista_espera_id',
        as: 'turno_estudio'
    });
     
    };

  return ListaEspera;
};