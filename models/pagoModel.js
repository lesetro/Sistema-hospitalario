module.exports = (sequelize, DataTypes) => {
  const Pago = sequelize.define('Pago', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    factura_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Facturas', key: 'id' } },
    obra_social_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'ObrasSociales', key: 'id' } },
    monto: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    fecha: { type: DataTypes.DATE, allowNull: false },
    metodo: { type: DataTypes.ENUM('Efectivo', 'Tarjeta', 'Transferencia', 'Obra Social'), allowNull: false },
    estado: { type: DataTypes.ENUM('Pendiente', 'Completado', 'Rechazado'), defaultValue: 'Pendiente' }
  }, {
    tableName: 'Pagos',
    timestamps: true,
    underscored: true
  });

  Pago.associate = function(models) {
    Pago.belongsTo(models.Factura, { foreignKey: 'factura_id', as: 'factura' });
    Pago.belongsTo(models.ObraSocial, { foreignKey: 'obra_social_id', as: 'obra_social' });
  };

  return Pago;
};