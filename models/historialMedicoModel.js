// models/HistorialMedico.js
module.exports = (sequelize, DataTypes) => {
  const HistorialMedico = sequelize.define('HistorialMedico', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    paciente_id: { type: DataTypes.INTEGER, allowNull: false },
    motivo_consulta_id: { type: DataTypes.INTEGER, allowNull: true },
    descripcion: { type: DataTypes.TEXT, allowNull: false },
    tipo_evento: { type: DataTypes.STRING(100), allowNull: false },
    fecha: { type: DataTypes.DATE, allowNull: false }
  }, {
    tableName: 'HistorialesMedicos',
    timestamps: true,
    underscored: true
  });

  HistorialMedico.associate = function(models) {
    HistorialMedico.belongsTo(models.Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
    HistorialMedico.belongsTo(models.MotivoConsulta, { foreignKey: 'motivo_consulta_id', as: 'motivo_consulta' });
  };

  return HistorialMedico;
};