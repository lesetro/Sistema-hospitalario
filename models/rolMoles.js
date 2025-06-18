module.exports = (sequelize, DataTypes) => {
  const Rol = sequelize.define('rol', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    descripcion: { type: DataTypes.STRING(255), allowNull: true },
  }, {
    tableName: 'roles',
    timestamps: false,
    underscored: true
  });

  Rol.associate = function(models) {
    Rol.hasMany(models.usuario, { foreignKey: 'rol_id', as: 'usuarios' });
  };

  return Rol;
};
