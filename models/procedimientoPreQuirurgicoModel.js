module.exports = (sequelize, DataTypes) => {
  const ProcedimientoPreQuirurgico = sequelize.define('ProcedimientoPreQuirurgico', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    evaluacion_medica_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'evaluacionesmedicas', key: 'id' } },
    nombre: { type: DataTypes.STRING(100), allowNull: false }, // Ejemplo: "Ayuno", "Administración de antibióticos"
    descripcion: { type: DataTypes.TEXT, allowNull: true },
    estado: { type: DataTypes.ENUM('Pendiente', 'Completado','SinEfecto','Cancelada','EnCirugia'), defaultValue: 'Pendiente' },
    medico_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'medicos', key: 'id' } },
    paciente_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'pacientes', key: 'id' } },
    prioridad: { type: DataTypes.ENUM('BAJA', 'MEDIA', 'ALTA'), defaultValue: 'MEDIA' },
    fecha_orden: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }

  }, {
    tableName: 'procedimientosprequirurgicos',
    timestamps: true,
    underscored: true,
     indexes: [{ fields: ['evaluacion_medica_id'] }] 
  });

  ProcedimientoPreQuirurgico.associate = function(models) {
    ProcedimientoPreQuirurgico.belongsTo(models.EvaluacionMedica, { foreignKey: 'evaluacion_medica_id', as: 'evaluacion_medica' });
    ProcedimientoPreQuirurgico.hasOne(models.EvaluacionEnfermeria, { foreignKey: 'procedimiento_pre_quirurgico_id', as: 'evaluacion_enfermeria' });
    ProcedimientoPreQuirurgico.belongsTo(models.Medico, { foreignKey: 'medico_id', as: 'medico' });
    ProcedimientoPreQuirurgico.belongsTo(models.Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
  };

  return ProcedimientoPreQuirurgico;
};