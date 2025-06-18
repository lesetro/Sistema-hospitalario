module.exports = (sequelize, DataTypes) => {
  const ProcedimientoEnfermeria = sequelize.define('ProcedimientoEnfermeria', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: true },
    duracion_estimada: { type: DataTypes.INTEGER, allowNull: true }, // en minutos
    requiere_preparacion: { type: DataTypes.BOOLEAN, defaultValue: false },
    // Relaciones
    tratamiento_id: {type: DataTypes.INTEGER,allowNull: true, references: {model: 'tratamientos',key: 'id'}},
    evaluacion_medica_id: {type: DataTypes.INTEGER,allowNull: false,references: {model: 'evaluacionesmedicas',key: 'id'}}
  }, {
    tableName: 'procedimientos_enfermeria',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['evaluacion_id'] },
      { fields: ['tratamiento_id'] }
    ]


  });

  ProcedimientoEnfermeria.associate = function(models) {
    ProcedimientoEnfermeria.belongsTo(models.Tratamiento, { foreignKey: 'tratamiento_id', as: 'tratamiento' });
    ProcedimientoEnfermeria.belongsTo(models.EvaluacionMedica, { foreignKey: 'evaluacion_medica_id', as: 'evaluacion_medica' });
  };

  return ProcedimientoEnfermeria;
};