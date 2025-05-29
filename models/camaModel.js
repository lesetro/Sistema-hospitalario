module.exports = (sequelize, DataTypes) => {
  const Cama = sequelize.define('Cama', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    habitacion_id: { type: DataTypes.INTEGER, allowNull: false },
    numero: { type: DataTypes.STRING(10), allowNull: false },
    estado: { type: DataTypes.ENUM('Libre', 'Ocupada', 'EnLimpieza'), defaultValue: 'Libre' },
    fecha_fin_limpieza: { type: DataTypes.DATE, allowNull: true }
  }, {
    tableName: 'Camas',
    timestamps: true,
    underscored: true
  });

  Cama.associate = function(models) {
    Cama.belongsTo(models.Habitacion, { foreignKey: 'habitacion_id', as: 'habitacion' });
    Cama.hasMany(models.Internacion, { foreignKey: 'cama_id', as: 'internaciones' });
  };

  return Cama;
};