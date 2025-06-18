module.exports = (sequelize, DataTypes) => {
  const Especialidad = sequelize.define('especialidad', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    descripcion: { type: DataTypes.STRING(255), allowNull: true },
  }, {
    tableName: 'especialidades',
    timestamps: true,
    underscored: true
  });

  Especialidad.associate = function(models) {
    Especialidad.hasMany(models.medico, { foreignKey: 'especialidad_id', as: 'medicos' });
    Especialidad.hasMany(models.listasesperas, { foreignKey: 'especialidad_id', as: 'lista_espera' });
    Especialidad.hasMany(models.admision, { foreignKey: 'especialidad_id', as: 'admisiones' });
  };

  return Especialidad;
};
