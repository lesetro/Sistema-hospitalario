module.exports = (sequelize, DataTypes) => {
  const ProcedimientoEnfermeria = sequelize.define('ProcedimientoEnfermeria', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: true },
    duracion_estimada: { type: DataTypes.INTEGER, allowNull: true }, // en minutos
    requiere_preparacion: { type: DataTypes.BOOLEAN, defaultValue: false },
    tratamiento_id: {type: DataTypes.INTEGER,allowNull: true, references: {model: 'tratamientos',key: 'id'}},
    evaluacion_medica_id: {type: DataTypes.INTEGER,allowNull: false,references: {model: 'evaluacionesmedicas',key: 'id'}},
    medico_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'medicos', key: 'id' } },
    prioridad: { type: DataTypes.ENUM('BAJA', 'MEDIA', 'ALTA'), defaultValue: 'MEDIA' },
    fecha_orden: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW },
    estado: { type: DataTypes.ENUM('PENDIENTE', 'EN_PROGRESO', 'COMPLETADO', 'CANCELADO'), defaultValue: 'PENDIENTE' },
  }, {
    tableName: 'procedimientosenfermeria',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['evaluacion_medica_id'] },
      { fields: ['tratamiento_id'] }
    ]


  });

  ProcedimientoEnfermeria.associate = function(models) {
    ProcedimientoEnfermeria.belongsTo(models.Tratamiento, { foreignKey: 'tratamiento_id', as: 'tratamiento' });
    ProcedimientoEnfermeria.belongsTo(models.EvaluacionMedica, { foreignKey: 'evaluacion_medica_id', as: 'evaluacion_medica' });
    ProcedimientoEnfermeria.hasMany(models.EvaluacionEnfermeria, { foreignKey: 'procedimiento_enfermeria_id', as: 'evaluaciones_enfermeria'});
    ProcedimientoEnfermeria.belongsTo(models.Medico, { foreignKey: 'medico_id', as: 'medico' });

  };

  return ProcedimientoEnfermeria;
};