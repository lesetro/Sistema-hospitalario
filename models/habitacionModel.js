module.exports = (sequelize, DataTypes) => {
  const Habitacion = sequelize.define('Habitacion', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    tipoDeServicio_id: { type: DataTypes.INTEGER, allowNull: false , References: { model: 'TipoDeServicio', key: 'id' }},
    tipo: { type: DataTypes.ENUM('Individual', 'Doble', 'Colectiva'), allowNull: false },
    sexo_permitido: { type: DataTypes.ENUM('Masculino', 'Femenino', 'Mixto'), defaultValue: 'Mixto' },
    tipo_internacion_id: { type: DataTypes.INTEGER, allowNull: false }
  }, {
    tableName: 'Habitaciones',
    timestamps: true,
    underscored: true
  });
  Habitacion.beforeCreate(async (habitacion, options) => {
    // Validar que el tipo de servicio exista
    const tipoServicio = await sequelize.models.TipoDeServicio.findByPk(habitacion.tipoDeServicio_id);
    if (!tipoServicio) {
      throw new Error('El tipo de servicio especificado no existe');
    }
    
    // Validar que el tipo de internación exista
    const tipoInternacion = await sequelize.models.TipoInternacion.findByPk(habitacion.tipo_internacion_id);
    if (!tipoInternacion) {
      throw new Error('El tipo de internación especificado no existe');
    }
  });
  Habitacion.associate = function(models) {
    Habitacion.belongsTo(models.TipoInternacion, { foreignKey: 'tipo_internacion_id', as: 'tipo_internacion' });
    Habitacion.hasMany(models.Cama, { foreignKey: 'habitacion_id', as: 'camas' });
    Habitacion.hasMany(models.Internacion, { foreignKey: 'habitacion_id', as: 'internaciones' });
    Habitacion.belongsTo(models.TipoDeServicio, { foreignKey: 'tipoDeServicio_id', as: 'tipoDeServicio' });
    Habitacion.hasMany(models.IntervencionQuirurgica, { foreignKey: 'habitacion_id', as: 'intervencionQuirurgica' });

  };

  return Habitacion;
};
