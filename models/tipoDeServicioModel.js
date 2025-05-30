module.exports = (sequelize, DataTypes) => {
  const TipoDeServicio = sequelize.define('TipoDeServicio', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING, allowNull: false, unique: true },
    descripcion: { type: DataTypes.TEXT, allowNull: true }
  }, {
    tableName: 'TiposDeServicio',
    timestamps: true,
    underscored: true
  });

  TipoDeServicio.associate = function(models) {
    TipoDeServicio.hasMany(models.Habitacion, { foreignKey: 'tipoDeServicio_id', as: 'habitaciones' });
  };

  return TipoDeServicio;
};
