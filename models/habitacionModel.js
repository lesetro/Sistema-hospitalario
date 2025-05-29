module.exports = (sequelize, DataTypes) => {
  const Habitacion = sequelize.define('Habitacion', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    codigo: { type: DataTypes.STRING(50), allowNull: false },
    tipo: { type: DataTypes.ENUM('Individual', 'Doble', 'Colectiva'), allowNull: false },
    sexo_permitido: { type: DataTypes.ENUM('Masculino', 'Femenino', 'Mixto'), defaultValue: 'Mixto' },
    tipo_internacion_id: { type: DataTypes.INTEGER, allowNull: false }
  }, {
    tableName: 'Habitaciones',
    timestamps: true,
    underscored: true
  });

  Habitacion.associate = function(models) {
    Habitacion.belongsTo(models.TipoInternacion, { foreignKey: 'tipo_internacion_id', as: 'tipo_internacion' });
    Habitacion.hasMany(models.Cama, { foreignKey: 'habitacion_id', as: 'camas' });
  };

  return Habitacion;
};
