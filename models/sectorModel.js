module.exports = (sequelize, DataTypes) => {
  const Sector = sequelize.define('Sector', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false }
  }, {
    tableName: 'Sectores',
    timestamps: false,
    underscored: true
  });

  Sector.associate = function(models) {
    Sector.hasMany(models.Medico, { foreignKey: 'sector_id', as: 'medicos' });
    Sector.hasMany(models.Enfermero, { foreignKey: 'sector_id', as: 'enfermeros' });
    Sector.hasMany(models.Administrativo, { foreignKey: 'sector_id', as: 'administrativos' });
  };

  return Sector;
};