
module.exports = (sequelize, DataTypes) => {
  const MotivoConsulta = sequelize.define('MotivoConsulta', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: true }
  }, {
    tableName: 'motivosconsultas',
    timestamps: true,
    underscored: true
  });

  MotivoConsulta.associate = function(models) {
    MotivoConsulta.hasMany(models.HistorialMedico, { foreignKey: 'motivo_consulta_id', as: 'historiales' });
    MotivoConsulta.hasMany(models.Admision, { foreignKey: 'motivo_consulta_id', as: 'admisiones' });
    
  };

  return MotivoConsulta;
};