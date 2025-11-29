

module.exports = (sequelize, DataTypes) => {
  const EvaluacionEnfermeria = sequelize.define('EvaluacionEnfermeria', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    paciente_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'pacientes', key: 'id' } },
    enfermero_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'enfermeros', key: 'id' } },
    medico_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'medicos', key: 'id' } },
    fecha: { type: DataTypes.DATE, allowNull: false },
    signos_vitales: { type: DataTypes.STRING(300), allowNull: true },
    procedimiento_pre_quirurgico_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'procedimientosprequirurgicos', key: 'id' } },
    nivel_triaje: { type: DataTypes.ENUM('Rojo', 'Amarillo', 'Verde', 'Negro'), allowNull: true }, 
    evaluacion_medica_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'evaluacionesmedicas', key: 'id' } },
    observaciones: { type: DataTypes.TEXT, allowNull: true }, // Incluye evolución del tratamiento
    procedimiento_enfermeria_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'procedimientosenfermeria', key: 'id' } },
    tipo_egreso: { type: DataTypes.ENUM(
        'PROCEDIMIENTO_COMPLETADO', 
        'DERIVACION_MEDICO',        
        'DERIVACION_URGENCIA',      
        'PENDIENTE_EVALUACION'      
        ),
        defaultValue: 'PENDIENTE_EVALUACION'
    },
    lista_espera_generada_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'listasesperas', key: 'id' }}
  }, {

    tableName: 'evaluacionesenfermeria',
    timestamps: true,
    underscored: true,
    indexes:[
      { fields: ['paciente_id'] },
      { fields: ['enfermero_id'] },
      { fields: ['medico_id'] },
      { fields: ['procedimiento_pre_quirurgico_id'] },
      { fields: ['procedimiento_enfermeria_id'] },
      { fields: ['evaluacion_medica_id'] },
      { fields: ['lista_espera_generada_id'] },
      { fields: ["fecha"] }
      
    ]
  });

  EvaluacionEnfermeria.associate = function(models) {
    EvaluacionEnfermeria.belongsTo(models.Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
    EvaluacionEnfermeria.belongsTo(models.Enfermero, { foreignKey: 'enfermero_id', as: 'enfermero' });
    EvaluacionEnfermeria.belongsTo(models.Medico, { foreignKey: 'medico_id', as: 'medico' });
    EvaluacionEnfermeria.belongsTo(models.ProcedimientoEnfermeria, { foreignKey: 'procedimiento_enfermeria_id', as: 'procedimiento_enfermeria' });
    EvaluacionEnfermeria.belongsTo(models.ProcedimientoPreQuirurgico, { foreignKey: 'procedimiento_pre_quirurgico_id', as: 'procedimiento_pre_quirurgico' });
    EvaluacionEnfermeria.hasOne(models.ControlEnfermeria, { foreignKey: 'evaluacion_enfermeria_id', as: 'control_enfermeria' });
    EvaluacionEnfermeria.belongsTo(models.EvaluacionMedica, { foreignKey: 'evaluacion_medica_id', as: 'evaluacion_medica' });
    EvaluacionEnfermeria.belongsTo(models.ListaEspera, { foreignKey: 'lista_espera_generada_id', as: 'lista_espera_generada' });
  };
 

  return EvaluacionEnfermeria;
};
