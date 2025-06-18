const controlEnfermeria = require("./controlEnfermeria");

module.exports = (sequelize, DataTypes) => {
  const EvaluacionEnfermeria = sequelize.define('evaluacionenfermeria', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    paciente_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'pacientes', key: 'id' } },
    enfermero_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'enfermeros', key: 'usuario_id' } },
    medico_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'medicos', key: 'usuario_id' } },
    fecha: { type: DataTypes.DATE, allowNull: false },
    signos_vitales: { type: DataTypes.STRING(300), allowNull: true },
    procedimiento_pre_quirurgico_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'procedimientosprequirurgicos', key: 'id' } },
    nivel_triaje: { type: DataTypes.ENUM('Rojo', 'Amarillo', 'Verde', 'Negro'), allowNull: true }, // Sistema de triaje
    observaciones: { type: DataTypes.TEXT, allowNull: true }, // Incluye evolución del tratamiento
    procedimiento_enfermeria_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'procedimientosenfermeria', key: 'id' } },
    
  }, {

    tableName: 'evaluacionesenfermeria',
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
    EvaluacionEnfermeria.belongsTo(models.paciente, { foreignKey: 'paciente_id', as: 'paciente' });
    EvaluacionEnfermeria.belongsTo(models.enfermero, { foreignKey: 'enfermero_id', as: 'enfermero' });
    EvaluacionEnfermeria.belongsTo(models.medico, { foreignKey: 'medico_id', as: 'medico' });
    EvaluacionEnfermeria.belongsTo(models.controlenfermeria, { foreignKey: 'control_enfermeria_id', as: 'control_enfermeria' });
    EvaluacionEnfermeria.belongsTo(models.procedimientoenfermeria, { foreignKey: 'procedimiento_enfermeria_id', as: 'procedimiento_enfermeria' });
    EvaluacionEnfermeria.belongsTo(models.procedimientoprequirurgico, { foreignKey: 'procedimiento_pre_quirurgico_id', as: 'procedimiento_pre_quirurgico' });
    EvaluacionEnfermeria.hasOne(models.controlenfermeria, { foreignKey: 'evaluacion_enfermeria_id', as: 'control' });
  };

  return EvaluacionEnfermeria;
};
