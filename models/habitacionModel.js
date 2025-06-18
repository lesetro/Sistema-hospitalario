module.exports = (sequelize, DataTypes) => {
  const Habitacion = sequelize.define('Habitacion', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    tipo_de_servicio_id: { type: DataTypes.INTEGER, allowNull: false , references: { model: 'tiposdeservicio', key: 'id' }},
    tipo: { type: DataTypes.ENUM('Doble', 'Colectiva', 'Individual'),defaultValue: `Colectiva`,},
    numero: { type: DataTypes.STRING(10), allowNull: false },
    sector_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Sectores', key: 'id' }},
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
    const sector = await sequelize.models.Sector.findByPk(habitacion.sector_id);
    if (!sector) {
      throw new Error('El sector especificado no existe');
    }
  });
  Habitacion.associate = function(models) {
    Habitacion.belongsTo(models.TipoInternacion, { foreignKey: 'tipo_internacion_id', as: 'TipoDeServicio' });
    Habitacion.hasMany(models.Cama, { foreignKey: 'habitacion_id', as: 'camas' });
    Habitacion.belongsTo(models.TipoDeServicio, { foreignKey: 'tipo_de_servicio_id', as: 'habitacion' });
    Habitacion.hasMany(models.IntervencionQuirurgica, { foreignKey: 'habitacion_id', as: 'intervencionQuirurgica' });
    Habitacion.belongsTo(models.Sector, {foreignKey: 'sector_id', as: 'sector' })
  };


  return Habitacion;
};
