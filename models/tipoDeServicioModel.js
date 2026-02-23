module.exports = (sequelize, DataTypes) => {
  const TipoDeServicio = sequelize.define('TipoDeServicio', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING, allowNull: false, unique: true },
    descripcion: { type: DataTypes.TEXT, allowNull: true },
    sector_id: {type: DataTypes.INTEGER,allowNull: true, references: { model: 'sectores', key: 'id' },comment: 'Sector al que pertenece este servicio'}

  }, {
    tableName: 'tiposdeservicio',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['nombre'] },
      { fields: ['sector_id'] }
    ]
  });

  TipoDeServicio.associate = function(models) {
    TipoDeServicio.hasMany(models.Habitacion, { foreignKey: 'tipo_de_servicio_id', as: 'habitaciones' });
    TipoDeServicio.belongsTo(models.Sector, { foreignKey: 'sector_id', as: 'sector' });
    TipoDeServicio.hasMany(models.ListaEspera, { foreignKey: 'tipo_servicio_id', as: 'listas_espera' });
    TipoDeServicio.hasMany(models.Turno, { foreignKey: 'tipo_servicio_id', as: 'turnos' });
  };

  return TipoDeServicio;
};
