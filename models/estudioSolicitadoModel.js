module.exports = (sequelize, DataTypes) => {
  const EstudioSolicitado = sequelize.define('EstudioSolicitado', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    evaluacion_medica_id: { type: DataTypes.INTEGER, allowNull: false },
    paciente_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Pacientes', key: 'id' } },
    tipo_estudio_id: { type: DataTypes.INTEGER, allowNull: false , references: { model: 'TiposEstudio', key: 'id' }},
    urgencia: { type: DataTypes.ENUM('Normal', 'Alta'), allowNull: false, defaultValue: 'Normal' },
    estado: { type: DataTypes.ENUM('Pendiente', 'Realizado', 'Cancelado'), defaultValue: 'Pendiente' },
    observaciones: { type: DataTypes.TEXT, allowNull: true }
  }, {
    tableName: 'EstudiosSolicitados',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['evaluacion_medica_id'] },
      { fields: ['paciente_id'] },
      { fields: ['tipo_estudio_id'] },
      { fields: ['estado'] }
    ]

  });

  EstudioSolicitado.associate = function(models) {
    EstudioSolicitado.belongsTo(models.EvaluacionMedica, { foreignKey: 'evaluacion_medica_id', as: 'evaluacion_medica' });
    EstudioSolicitado.belongsTo(models.Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
    EstudioSolicitado.hasOne(models.TurnoEstudio, { foreignKey: 'estudio_solicitado_id', as: 'turno_estudio' });
    EstudioSolicitado.belongsTo(models.TipoEstudio, { foreignKey: 'tipo_estudio_id', as: 'tipo_estudio' });
    
  };

  return EstudioSolicitado;
};