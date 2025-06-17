module.exports = (sequelize, DataTypes) => {
  const Sector = sequelize.define('Sector', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    descripcion: { type: DataTypes.STRING(255), allowNull: true },
  }, {
    tableName: 'sectores',
    timestamps: false,
    underscored: true
  });

  Sector.associate = function(models) {
    Sector.hasMany(models.Medico, { foreignKey: 'sector_id', as: 'medicos' });
    Sector.hasMany(models.Enfermero, { foreignKey: 'sector_id', as: 'enfermeros' });
    Sector.hasMany(models.Administrativo, { foreignKey: 'sector_id', as: 'administrativos' });
    Sector.hasMany(models.Turno, { foreignKey: 'sector_id', as: 'turnos' });
    Sector.hasMany(models.Admision, { foreignKey: 'sector_id', as: 'admisiones' });
    Sector.hasMany(models.Habitacion, { foreignKey: 'sector_id', as: 'habitaciones' });
  };

  return Sector;
};