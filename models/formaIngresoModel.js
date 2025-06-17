module.exports = (sequelize, DataTypes) => {
  const FormaIngreso = sequelize.define('formaingreso', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    descripcion: { type: DataTypes.STRING(255), allowNull: true }
  }, {
    tableName: 'formasingreso',
    timestamps: false,
    underscored: true,
    indexes: [
        { unique: true, fields: ['nombre'] }
      ]
  });

  FormaIngreso.associate = function(models) {
    FormaIngreso.hasMany(models.admision, { foreignKey: 'forma_ingreso_id', as: 'admisiones' });
  };

  return FormaIngreso;
};
