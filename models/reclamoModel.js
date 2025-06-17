module.exports = (sequelize, DataTypes) => {
  const Reclamo = sequelize.define('Reclamo', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    texto: { type: DataTypes.TEXT, allowNull: false },
    fecha: { type: DataTypes.DATE, allowNull: false },
    estado: { type: DataTypes.ENUM('Pendiente', 'Resuelto'), allowNull: false }
  }, {
    tableName: 'reclamos',
    timestamps: true,
    underscored: true
  });

  Reclamo.associate = function(models) {
    Reclamo.belongsTo(models.Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
  };

  return Reclamo;
};
