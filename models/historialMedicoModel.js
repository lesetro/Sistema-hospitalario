// models/HistorialMedico.js
module.exports = (sequelize, DataTypes) => {
  const HistorialMedico = sequelize.define('HistorialMedico', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    paciente_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Pacientes', key: 'id' } },
    motivo_consulta_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'MotivosConsulta', key: 'id' } },
    descripcion: { type: DataTypes.TEXT, allowNull: false },
    tipo_evento: { type: DataTypes.ENUM('Consulta', 'Internacion', 'Cirugia', 'Estudio', 'Otro'), allowNull: false },
    fecha: { type: DataTypes.DATE, allowNull: false }
  }, {
    tableName: 'HistorialesMedicos',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['paciente_id'] },
      { fields: ['motivo_consulta_id'] },
      { fields: ['fecha'] }
    ]
  });

  HistorialMedico.associate = function(models) {
    HistorialMedico.belongsTo(models.Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
    HistorialMedico.belongsTo(models.MotivoConsulta, { foreignKey: 'motivo_consulta_id', as: 'motivo_consulta' });
  };

  return HistorialMedico;
};