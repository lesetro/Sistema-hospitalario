module.exports = (sequelize, DataTypes) => {
  const Especialidad = sequelize.define('Especialidad', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false }
  }, {
    tableName: 'Especialidades',
    timestamps: false,
    underscored: true
  });

  Especialidad.associate = function(models) {
    Especialidad.hasMany(models.Medico, { foreignKey: 'especialidad_id', as: 'medicos' });
    Especialidad.hasMany(models.ListaEspera, { foreignKey: 'especialidad_id', as: 'lista_espera' });
  };

  return Especialidad;
};
