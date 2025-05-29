module.exports = (sequelize, DataTypes) => {
  const Factura = sequelize.define('Factura', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    paciente_id: { type: DataTypes.INTEGER, allowNull: false },
    monto: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: true },
    fecha_emision: { type: DataTypes.DATE, allowNull: false }
  }, {
    tableName: 'Facturas',
    timestamps: true,
    underscored: true
  });

  Factura.associate = function(models) {
    Factura.belongsTo(models.Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
  };

  return Factura;
};
