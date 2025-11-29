module.exports = (sequelize, DataTypes) => {
  const TipoDeServicio = sequelize.define('TipoDeServicio', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING, allowNull: false, unique: true },
    descripcion: { type: DataTypes.TEXT, allowNull: true }
  }, {
    tableName: 'tiposdeservicio',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['nombre'] }
    ]
  });

  TipoDeServicio.associate = function(models) {
    TipoDeServicio.hasMany(models.Habitacion, { foreignKey: 'tipo_de_servicio_id', as: 'habitaciones' });
  };

  return TipoDeServicio;
};
