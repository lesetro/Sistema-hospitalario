
module.exports = (sequelize, DataTypes) => {
  const HistorialMedico = sequelize.define('HistorialMedico', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    paciente_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'pacientes', key: 'id' } },
    motivo_consulta_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'motivosconsulta', key: 'id' } },
    descripcion: { type: DataTypes.TEXT, allowNull: false },
    admision_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'admisiones', key: 'id' }
    },
    tipo_evento: { type: DataTypes.ENUM('Consulta', 'Internacion', 'Cirugia', 'Estudio', 'Otro'), allowNull: false },
    fecha: { type: DataTypes.DATE, allowNull: false }
  }, {
    tableName: 'historialesmedicos',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['paciente_id'] },
      { fields: ['motivo_consulta_id'] },
      { fields: ['fecha'] },
      { fields: ['admision_id'] },
      { fields: ['tipo_evento'] }
    ]
  });



  HistorialMedico.associate = function(models) {
    HistorialMedico.belongsTo(models.Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
    HistorialMedico.belongsTo(models.MotivoConsulta, { foreignKey: 'motivo_consulta_id', as: 'motivo_consulta' });
    HistorialMedico.belongsTo(models.Admision, {foreignKey: 'admision_id', as: 'admision'});
  };

  return HistorialMedico;
};