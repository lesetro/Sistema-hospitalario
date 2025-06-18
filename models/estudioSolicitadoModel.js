module.exports = (sequelize, DataTypes) => {
  const EstudioSolicitado = sequelize.define('EstudioSolicitado', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    evaluacion_medica_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'evaluacionesmedicas', key: 'id' } },
    paciente_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'pacientes', key: 'id' } },
    tipo_estudio_id: { type: DataTypes.INTEGER, allowNull: false , references: { model: 'tiposestudio', key: 'id' }},
    urgencia: { type: DataTypes.ENUM('Normal', 'Alta'), allowNull: false, defaultValue: 'Normal' },
    estado: { type: DataTypes.ENUM('Pendiente', 'Realizado', 'Cancelado'), defaultValue: 'Pendiente' },
    observaciones: { type: DataTypes.TEXT, allowNull: true }
  }, {
    tableName: 'estudiossolicitados',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['evaluacion_medica_id'] },
      { fields: ['paciente_id'] },
      { fields: ['tipo_estudio_id'] },
      { fields: ['estado'] }
    ]

  });
  EstudioSolicitado.afterCreate(async (estudio, options) => {
  await sequelize.models.ListaEspera.create({
    paciente_id: estudio.paciente_id,
    tipo: 'ESTUDIO',
    tipo_estudio_id: estudio.tipo_estudio_id,
    prioridad: estudio.urgencia === 'Alta' ? 1 : 2,
    estado: 'PENDIENTE',
    fecha_registro: new Date()
  });
});
EstudioSolicitado.beforeUpdate(async (estudio, options) => {
  if (estudio.estado === 'Realizado') {
    const turnoEstudio = await sequelize.models.TurnoEstudio.findOne({
      where: { estudio_solicitado_id: estudio.id, estado: 'Realizado' }
    });
    if (!turnoEstudio) {
      throw new Error('El estudio no puede marcarse como Realizado sin un turno completado');
    }
  }
});


  EstudioSolicitado.associate = function(models) {
    EstudioSolicitado.belongsTo(models.EvaluacionMedica, { foreignKey: 'evaluacion_medica_id', as: 'evaluacion_medica' });
    EstudioSolicitado.belongsTo(models.Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
    EstudioSolicitado.hasOne(models.TurnoEstudio, { foreignKey: 'estudio_solicitado_id', as: 'turno_estudio' });
    EstudioSolicitado.belongsTo(models.TipoEstudio, { foreignKey: 'tipo_estudio_id', as: 'tipo_estudio' });
    
  };

  return EstudioSolicitado;
};