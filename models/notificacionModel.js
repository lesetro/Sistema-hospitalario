module.exports = (sequelize, DataTypes) => {
  const Notificacion = sequelize.define('Notificacion', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Usuarios', key: 'id' } },
    mensaje: { type: DataTypes.STRING(255), allowNull: false },
    leida: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, {
    tableName: 'Notificaciones',
    timestamps: true,
    underscored: true
  });

  Notificacion.associate = function(models) {
    Notificacion.belongsTo(models.Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
  };

  return Notificacion;
};