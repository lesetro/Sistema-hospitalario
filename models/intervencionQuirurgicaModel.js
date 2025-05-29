module.exports = (sequelize, DataTypes) => {
  const IntervencionQuirurgica = sequelize.define('IntervencionQuirurgica', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    paciente_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Pacientes', key: 'id' } },
    medico_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Medicos', key: 'usuario_id' } },
    quirofano_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Quirofanos', key: 'id' } },
    evaluacion_medica_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'EvaluacionesMedicas', key: 'id' } },
    tipo_procedimiento: { type: DataTypes.STRING(100), allowNull: false }, // Ejemplo: "Apendicectomía"
    fecha_inicio: { type: DataTypes.DATE, allowNull: false },
    fecha_fin: { type: DataTypes.DATE, allowNull: true },
    resultado_cirugia: { 
      type: DataTypes.ENUM('Fallecio', 'NecesitaInternacionHabitacion', 'NecesitaInternacionUCI', 'AltaDirecta', 'Complicaciones'), 
      allowNull: true 
    }, // Nuevo campo
    observaciones: { type: DataTypes.TEXT, allowNull: true }
  }, {
    tableName: 'IntervencionesQuirurgicas',
    timestamps: true,
    underscored: true
  });

  IntervencionQuirurgica.associate = function(models) {
    models.IntervencionQuirurgica.belongsTo(models.Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
    models.IntervencionQuirurgica.belongsTo(models.Medico, { foreignKey: 'medico_id', as: 'medico' });
    models.IntervencionQuirurgica.belongsTo(models.Quirofano, { foreignKey: 'quirofano_id', as: 'quirofano' });
    models.IntervencionQuirurgica.belongsTo(models.EvaluacionMedica, { foreignKey: 'evaluacion_medica_id', as: 'evaluacion_medica' });
    models.IntervencionQuirurgica.hasOne(models.Internacion, { foreignKey: 'intervencion_quirurgica_id', as: 'internacion' });
    
  };

  return IntervencionQuirurgica;
};