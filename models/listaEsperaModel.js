module.exports = (sequelize, DataTypes) => {
  const ListasEsperas = sequelize.define(
    'listasesperas',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      paciente_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'pacientes', key: 'id' }
      },
      tipo: {
        type: DataTypes.ENUM('ESTUDIO', 'EVALUACION', 'INTERNACION', 'CIRUGIA'),
        allowNull: false
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
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 2 // 1=Alta, 2=Media, 3=Baja
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
      fecha_registro: { type: DataTypes.DATE, allowNull: false }
    },
    {
      tableName: 'listasesperas',
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['tipo', 'prioridad', 'estado'] }
      ]
    }
  );

  ListasEsperas.beforeCreate(async (lista, options) => {
    if (lista.tipo === 'ESTUDIO' && !lista.tipo_estudio_id) {
      throw new Error('tipo_estudio_id es requerido para listas de espera de tipo ESTUDIO');
    }
    if (lista.tipo === 'EVALUACION' && !lista.especialidad_id) {
      throw new Error('especialidad_id es requerido para listas de espera de tipo EVALUACION');
    }
    if (lista.prioridad < 1 || lista.prioridad > 3) {
      throw new Error('La prioridad debe estar entre 1 (Alta) y 3 (Baja)');
    }
  });

  ListasEsperas.beforeUpdate(async (lista, options) => {
    if (lista.estado === 'ASIGNADO') {
      const turno = await sequelize.models.Turno.findOne({
        where: { lista_espera_id: lista.id }
      });
      if (!turno) {
        throw new Error('No se puede marcar como ASIGNADO sin un turno asociado');
      }
    }
    if (lista.estado === 'COMPLETADO') {
      const turno = await sequelize.models.Turno.findOne({
        where: { lista_espera_id: lista.id }
      });
      if (!turno || turno.estado !== 'COMPLETADO') {
        throw new Error('El turno asociado debe estar COMPLETADO para marcar la lista como COMPLETADA');
      }
    }
  });

  ListasEsperas.associate = function (models) {
    ListasEsperas.belongsTo(models.paciente, { foreignKey: 'paciente_id', as: 'paciente' });
    ListasEsperas.belongsTo(models.tipoestudio, {
      foreignKey: 'tipo_estudio_id',
      as: 'tipo_estudio',
      constraints: false
    });
    ListasEsperas.belongsTo(models.especialidad, {
      foreignKey: 'especialidad_id',
      as: 'especialidad',
      constraints: false
    });
    ListasEsperas.hasOne(models.turno, {
      foreignKey: 'lista_espera_id',
      as: 'listaEsperaTurno',
      constraints: false
    });
    ListasEsperas.belongsTo(models.habitacion, {
      foreignKey: 'habitacion_id',
      as: 'habitacion'
    });

    
  };

  return ListasEsperas;
};