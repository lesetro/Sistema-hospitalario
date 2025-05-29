module.exports = (sequelize, DataTypes) => {
  const Diagnostico = sequelize.define('Diagnostico', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    codigo: { type: DataTypes.STRING(20), allowNull: false }, // un Ej: "ICD-10" indicando diferentes clasificaciones
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: true }
  }, {
    tableName: 'diagnosticos',
    timestamps: false,
    underscored: true
  });

  return Diagnostico;
};