module.exports = (sequelize, DataTypes) => {
  const RecetaCertificado = sequelize.define('RecetaCertificado', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    paciente_id: { type: DataTypes.INTEGER, allowNull: false },
    tipo: { type: DataTypes.ENUM('Receta Medica', 'Certificado'), allowNull: false },
    contenido: { type: DataTypes.TEXT, allowNull: false },
    fecha: { type: DataTypes.DATE, allowNull: false },
    medico_id: { type: DataTypes.INTEGER, allowNull: false },
    evaluacion_medica_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'EvaluacionesMedicas', key: 'id' } },
  }, {
    tableName: 'RecetasCertificados',
    timestamps: true,
    underscored: true
  });

  RecetaCertificado.associate = function(models) {
    RecetaCertificado.belongsTo(models.Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
    RecetaCertificado.belongsTo(models.Medico, { foreignKey: 'medico_id', as: 'medico' });
    RecetaCertificado.belongsTo(models.EvaluacionMedica, { foreignKey: 'evaluacion_medica_id', as: 'evaluacionMedica' });
  };

  return RecetaCertificado;
};
