module.exports = (sequelize, DataTypes) => {
  const Rol = sequelize.define('Rol', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    descripcion: { type: DataTypes.STRING(255), allowNull: true },
  }, {
    tableName: 'roles',
    timestamps: true,
    underscored: true
  });

  Rol.associate = function(models) {
    Rol.hasMany(models.Usuario, { foreignKey: 'rol_principal_id', as: 'usuarios_principal' });
    Rol.hasMany(models.Usuario, { foreignKey: 'rol_secundario_id', as: 'usuarios_secundario' });
  };

  return Rol;
};
