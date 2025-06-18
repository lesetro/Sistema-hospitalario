module.exports = (sequelize, DataTypes) => {
  const Turno = sequelize.define(
    'Turno',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tipo_turno_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'tipos_turno', key: 'id' } 
      },
      fecha: { type: DataTypes.DATEONLY, allowNull: false },
      hora_inicio: { type: DataTypes.TIME, allowNull: false },
      hora_fin: { type: DataTypes.TIME, allowNull: true },
      estado: {
        type: DataTypes.ENUM('PENDIENTE', 'CONFIRMADO', 'COMPLETADO', 'CANCELADO'),
        defaultValue: 'PENDIENTE'
      },
      paciente_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'paciente', key: 'id' } 
      },
      medico_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'medicos', key: 'id' }
      },
      lista_espera_id: { 
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'listasesperas', key: 'id' } 
      },
      usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'usuarios', key: 'id' }
      },
      sector_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'sectores', key: 'id' }
      },
      evaluacion_medica_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'evaluacionesmedicas', key: 'id' } 
      },
      tipo_estudio_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'tiposestudio', key: 'id' } 
      }
    },
    { 
      tableName: 'turnos',
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['tipo_turno_id', 'fecha', 'estado'] }, // Cambiado 'tipo' a 'tipo_turno_id'
        { fields: ['paciente_id', 'estado'] },
        { fields: ['medico_id'] },
        { fields: ['usuario_id'] },
        { fields: ['sector_id'] },
        { fields: ['lista_espera_id'] } // Corregido
      ]
    }
  );

  Turno.beforeCreate(async (turno, options) => {
    // Obtener el TipoTurno para verificar el nombre
    const tipoTurno = await sequelize.models.TipoTurno.findByPk(turno.tipo_turno_id);
    if (!tipoTurno) {
      throw new Error('Tipo de turno no encontrado');
    }
    const tipoNombre = tipoTurno.nombre.toUpperCase();

    if (tipoNombre === 'CONSULTA' && (!turno.paciente_id || !turno.medico_id)) {
      throw new Error('paciente_id y medico_id son requeridos para turnos de tipo CONSULTA');
    }
    if (tipoNombre === 'ESTUDIO' && !turno.paciente_id) {
      throw new Error('paciente_id es requerido para turnos de tipo ESTUDIO');
    }
    if (tipoNombre === 'PERSONAL' && (!turno.usuario_id || !turno.sector_id)) {
      throw new Error('usuario_id y sector_id son requeridos para turnos de tipo PERSONAL');
    }
  });

  Turno.afterUpdate(async (turno, options) => {
    if (turno.lista_espera_id && ['COMPLETADO', 'CANCELADO'].includes(turno.estado)) {
      await sequelize.models.ListasEsperas.update(
        { estado: turno.estado },
        { where: { id: turno.lista_espera_id } }
      );
    }
  });

  Turno.associate = function (models) {
    Turno.belongsTo(models.Paciente, { foreignKey: 'paciente_id', as: 'paciente', targetKey: 'id'  });
    Turno.hasOne(models.Admision, { foreignKey: 'turno_id', as: 'admision' }); 
    Turno.belongsTo(models.Medico, { foreignKey: 'medico_id', as: 'medico', targetKey: 'id'  });
    Turno.belongsTo(models.Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
    Turno.belongsTo(models.Sector, { foreignKey: 'sector_id', as: 'sector' });
    Turno.belongsTo(models.ListasEsperas, {foreignKey: 'lista_espera_id',as: 'listaEsperaTurno', constraints: false});
    Turno.hasOne(models.EvaluacionMedica, { foreignKey: 'turno_id', as: 'evaluacionMedica'});
    Turno.belongsTo(models.TipoTurno, { foreignKey: 'tipo_turno_id', as: 'tipoTurno' });
  };

  return Turno;
};