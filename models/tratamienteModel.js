module.exports = (sequelize, DataTypes) => {
  const Tratamiento = sequelize.define('tratamiento', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: false }
  }, {
    tableName: 'tratamientos',
    timestamps: true,
    underscored: true
  });

  Tratamiento.associate = function(models) {
    Tratamiento.hasMany(models.evaluacionmedica, { foreignKey: 'tratamiento_id', as: 'evaluaciones' });
    Tratamiento.hasMany(models.procedimientoenfermeria, { foreignKey: 'tratamiento_id', as: 'procedimientos' }); // Nueva relación
  };

  return Tratamiento;
};