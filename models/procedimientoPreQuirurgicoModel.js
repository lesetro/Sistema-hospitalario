module.exports = (sequelize, DataTypes) => {
  const ProcedimientoPreQuirurgico = sequelize.define('ProcedimientoPreQuirurgico', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    evaluacion_medica_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'evaluacionesmedicas', key: 'id' } },
    nombre: { type: DataTypes.STRING(100), allowNull: false }, // Ejemplo: "Ayuno", "Administración de antibióticos"
    descripcion: { type: DataTypes.TEXT, allowNull: true },
    estado: { type: DataTypes.ENUM('Pendiente', 'Completado'), defaultValue: 'Pendiente' }
  }, {
    tableName: 'procedimientosprequirurgicos',
    timestamps: true,
    underscored: true,
     indexes: [{ fields: ['evaluacion_id'] }] 
  });

  ProcedimientoPreQuirurgico.associate = function(models) {
    ProcedimientoPreQuirurgico.belongsTo(models.EvaluacionMedica, { foreignKey: 'evaluacion_medica_id', as: 'evaluacion_medica' });
    ProcedimientoPreQuirurgico.hasOne(models.EvaluacionEnfermeria, { foreignKey: 'procedimiento_pre_quirurgico_id', as: 'evaluacion_enfermeria' });
  };

  return ProcedimientoPreQuirurgico;
};