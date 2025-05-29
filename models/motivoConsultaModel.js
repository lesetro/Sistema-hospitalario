// models/MotivoConsulta.js
module.exports = (sequelize, DataTypes) => {
  const MotivoConsulta = sequelize.define('MotivoConsulta', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: true }
  }, {
    tableName: 'MotivosConsultas',
    timestamps: true,
    underscored: true
  });

  MotivoConsulta.associate = function(models) {
    MotivoConsulta.hasMany(models.HistorialMedico, { foreignKey: 'motivo_consulta_id', as: 'historiales' });
    MotivoConsulta.hasMany(models.Paciente, { foreignKey: 'motivo_ultima_consulta_id', as: 'pacientes' });
  };

  return MotivoConsulta;
};