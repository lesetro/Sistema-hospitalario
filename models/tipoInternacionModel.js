module.exports = (sequelize, DataTypes) => {
  const TipoInternacion = sequelize.define('TipoInternacion', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    descripcion: { type: DataTypes.STRING(255), allowNull: true },
    tipo_habitacion: { type: DataTypes.STRING(50), allowNull: true },
    cantidad_camas: { type: DataTypes.INTEGER, allowNull: true },
    cantidad_enfermeros: { type: DataTypes.INTEGER, allowNull: true },
    estado_paciente_default: { type: DataTypes.ENUM('Estable', 'Grave', 'Crítico'), allowNull: false,defaultValue: 'Sin Evaluar'},
  }, {
    tableName: 'tiposinternacion',
    timestamps: false,
    underscored: true
  });

  TipoInternacion.associate = function(models) {
    TipoInternacion.hasMany(models.Habitacion, { foreignKey: 'tipo_internacion_id', as: 'habitaciones' });
    TipoInternacion.hasMany(models.Internacion, { foreignKey: 'tipo_internacion_id', as: 'internaciones' });
  };

  return TipoInternacion;
};