module.exports = (sequelize, DataTypes) => {
  const Sector = sequelize.define('sector', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    descripcion: { type: DataTypes.STRING(255), allowNull: true },
  }, {
    tableName: 'sectores',
    timestamps: false,
    underscored: true
  });

  Sector.associate = function(models) {
    Sector.hasMany(models.medico, { foreignKey: 'sector_id', as: 'medicos' });
    Sector.hasMany(models.enfermero, { foreignKey: 'sector_id', as: 'enfermeros' });
    Sector.hasMany(models.administrativo, { foreignKey: 'sector_id', as: 'administrativos' });
    Sector.hasMany(models.turno, { foreignKey: 'sector_id', as: 'turnos' });
    Sector.hasMany(models.admision, { foreignKey: 'sector_id', as: 'admisiones' });
    Sector.hasMany(models.habitacion, { foreignKey: 'sector_id', as: 'habitaciones' });
  };

  return Sector;
};