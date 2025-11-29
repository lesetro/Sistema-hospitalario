module.exports = (sequelize, DataTypes) => {
  const Habitacion = sequelize.define('Habitacion', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    tipo_de_servicio_id: { type: DataTypes.INTEGER, allowNull: false ,  references: { model: 'tiposdeservicio', key: 'id' }},
    tipo: { type: DataTypes.ENUM('Doble', 'Colectiva', 'Individual'),defaultValue: 'Colectiva',},
    numero: { type: DataTypes.STRING(10), allowNull: false },
    sector_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'sectores', key: 'id' }},
    sexo_permitido: { type: DataTypes.ENUM('Masculino', 'Femenino', 'Mixto'), defaultValue: 'Mixto' }
  }, {
    tableName: 'habitaciones',
    timestamps: true,
    underscored: true
  });
   
  Habitacion.associate = function(models) {
    Habitacion.hasMany(models.Cama, { foreignKey: 'habitacion_id', as: 'camas' });
    Habitacion.belongsTo(models.TipoDeServicio, { foreignKey: 'tipo_de_servicio_id', as: 'tipoServicio' });
    Habitacion.hasMany(models.IntervencionQuirurgica, { foreignKey: 'habitacion_id', as: 'intervencionQuirurgica' });
    Habitacion.belongsTo(models.Sector, {foreignKey: 'sector_id', as: 'sector' })
  };


  return Habitacion;
};
