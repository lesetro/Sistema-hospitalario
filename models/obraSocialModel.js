module.exports = (sequelize, DataTypes) => {
  const ObraSocial = sequelize.define('ObraSocial', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    descripcion: { type: DataTypes.STRING(255), allowNull: true }
  }, {
    tableName: 'obrassociales',
    timestamps: false,
    underscored: true
  });

  ObraSocial.associate = function(models) {
    ObraSocial.hasMany(models.Paciente, { foreignKey: 'obra_social_id', as: 'pacientes' });
  };

  return ObraSocial;
};