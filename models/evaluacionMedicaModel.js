module.exports = (sequelize, DataTypes) => {
  //suponemos que el medico que lo reciba necesita ver que se registro por eso el turno
  // y que se le pueda hacer una evaluacion medica
  // de aqui podemos solicitarle EstudiosSolicitados, RecetasCertificados, ProcedimientosPreQuirurgicos, ProcedimientosEnfermeria
  const EvaluacionMedica = sequelize.define('EvaluacionMedica', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    paciente_id: { type: DataTypes.INTEGER, allowNull: false },
    medico_id: { type: DataTypes.INTEGER, allowNull: false },
    fecha: { type: DataTypes.DATE, allowNull: false },
    diagnostico_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'Diagnosticos', key: 'id' }}, 
    estudio_solicitado_id: { type: DataTypes.INTEGER, allowNull: true },
    observaciones_diagnostico: { type: DataTypes.TEXT, allowNull: true }
  }, {
    tableName: 'EvaluacionesMedicas',
    timestamps: true,
    underscored: true
  });

  EvaluacionMedica.associate = function(models) {
    EvaluacionMedica.belongsTo(models.Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
    EvaluacionMedica.belongsTo(models.Medico, { foreignKey: 'medico_id', as: 'medico' });
    EvaluacionMedica.belongsTo(models.Tratamiento, { foreignKey: 'tratamiento_id', as: 'tratamiento' });
    EvaluacionMedica.belongsTo(models.EstudioSolicitado, { foreignKey: 'estudio_solicitado_id', as: 'estudio_solicitado' });
    EvaluacionMedica.hasMany(models.RecetaCertificado, { foreignKey: 'evaluacion_medica_id', as: 'recetas_certificados' });
    EvaluacionMedica.hasMany(models.ProcedimientoPreQuirurgico, { foreignKey: 'evaluacion_medica_id', as: 'procedimientos_pre_quirurgicos' });
    EvaluacionMedica.hasMany(models.ProcedimientoEnfermeria, { foreignKey: 'evaluacion_medica_id', as: 'procedimientos_enfermeria' });
    EvaluacionMedica.hasMany(models.EvaluacionEnfermeria, { foreignKey: 'evaluacion_medica_id', as: 'evaluaciones_enfermeria' });
    EvaluacionMedica.hasMany(models.Turno, { foreignKey: 'evaluacion_medica_id', as: 'turnos' });
    EvaluacionMedica.belongsTo(models.Diagnostico, { foreignKey: 'diagnostico_id', as: 'diagnostico' });

    
  };

  return EvaluacionMedica;
};