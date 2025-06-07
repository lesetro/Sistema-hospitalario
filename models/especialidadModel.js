module.exports = (sequelize, DataTypes) => {
  const Especialidad = sequelize.define('Especialidad', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    descripcion: { type: DataTypes.STRING(255), allowNull: true },
  }, {
    tableName: 'Especialidades',
    timestamps: true,
    underscored: true
  });

  Especialidad.associate = function(models) {
    Especialidad.hasMany(models.Medico, { foreignKey: 'especialidad_id', as: 'medicos' });
    Especialidad.hasMany(models.ListasEsperas, { foreignKey: 'especialidad_id', as: 'lista_espera' });
    Especialidad.hasMany(models.Admision, { foreignKey: 'especialidad_id', as: 'admisiones' });
  };

  return Especialidad;
};
