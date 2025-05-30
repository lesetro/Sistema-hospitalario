const controlEnfermeria = require("./controlEnfermeria");

module.exports = (sequelize, DataTypes) => {
  const EvaluacionEnfermeria = sequelize.define('EvaluacionEnfermeria', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    paciente_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Pacientes', key: 'id' } },
    enfermero_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Enfermeros', key: 'usuario_id' } },
    medico_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Medicos', key: 'usuario_id' } },
    fecha: { type: DataTypes.DATE, allowNull: false },
    signos_vitales: { type: DataTypes.JSON, allowNull: true },
    procedimiento_pre_quirurgico_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'ProcedimientosPreQuirurgicos', key: 'id' } },
    nivel_triaje: { type: DataTypes.ENUM('Rojo', 'Amarillo', 'Verde', 'Negro'), allowNull: true }, // Sistema de triaje
    observaciones: { type: DataTypes.TEXT, allowNull: true }, // Incluye evolución del tratamiento
    procedimiento_enfermeria_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'ProcedimientosEnfermeria', key: 'id' } },
    
  }, {

    tableName: 'EvaluacionesEnfermeria',
    timestamps: true,
    underscored: true,
    indexes:[
      { fields: ['paciente_id'] },
      { fields: ['enfermero_id'] },
      { fields: ['medico_id'] },
      { fields: ['procedimiento_pre_quirurgico_id'] },
      { fields: ['procedimiento_enfermeria_id'] }

    ]
  });

  EvaluacionEnfermeria.associate = function(models) {
    EvaluacionEnfermeria.belongsTo(models.Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
    EvaluacionEnfermeria.belongsTo(models.Enfermero, { foreignKey: 'enfermero_id', as: 'enfermero' });
    EvaluacionEnfermeria.belongsTo(models.Medico, { foreignKey: 'medico_id', as: 'medico' });
    EvaluacionEnfermeria.belongsTo(models.ControlEnfermeria, { foreignKey: 'control_enfermeria_id', as: 'control_enfermeria' });
    EvaluacionEnfermeria.belongsTo(models.ProcedimientoEnfermeria, { foreignKey: 'procedimiento_enfermeria_id', as: 'procedimiento_enfermeria' });
    EvaluacionEnfermeria.belongsTo(models.ProcedimientoPreQuirurgico, { foreignKey: 'procedimiento_pre_quirurgico_id', as: 'procedimiento_pre_quirurgico' });
    EvaluacionEnfermeria.hasOne(models.ControlEnfermeria, { foreignKey: 'evaluacion_enfermeria_id', as: 'control' });
  };

  return EvaluacionEnfermeria;
};
