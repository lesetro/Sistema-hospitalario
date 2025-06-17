module.exports = (sequelize, DataTypes) => {
  const Pago = sequelize.define('Pago', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    paciente_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'pacientes', key: 'id' } },
    factura_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'facturas', key: 'id' } },
    obra_social_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'obrassociales', key: 'id' } },
    monto: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    fecha: { type: DataTypes.DATE, allowNull: false },
    metodo: { type: DataTypes.ENUM('Efectivo', 'Tarjeta', 'Transferencia', 'Obra Social'), allowNull: false },
    estado: { type: DataTypes.ENUM('Pendiente', 'Completado', 'Rechazado'), defaultValue: 'Pendiente' },
    motivo_rechazo: { type: DataTypes.TEXT, allowNull: true },
    tipo_pago: {
  type: DataTypes.STRING,
  allowNull: true // o false según tus requisitos
}

  }, {
    tableName: 'pagos',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['factura_id'] },
      { fields: ['obra_social_id'] },
      { fields: ['fecha'] },
      { fields: ['estado'] },
      
    ]
  });
  Pago.afterUpdate(async (pago, options) => {
  if (pago.estado === 'Completado' && pago.previous('estado') !== 'Completado') {
    const transaction = options.transaction || await sequelize.transaction();
    try {
      const factura = await sequelize.models.Factura.findByPk(pago.factura_id, { transaction });
      const paciente = await sequelize.models.Paciente.findByPk(factura.paciente_id, { transaction });
      if (paciente && paciente.usuario_id) {
        await sequelize.models.Notificacion.create({
          usuario_id: paciente.usuario_id,
          mensaje: `Se ha registrado un pago de $${pago.monto} para la factura #${factura.id}.`,
          leida: false,
          created_at: new Date(),
          updated_at: new Date()
        }, { transaction });
      }
      if (!options.transaction) await transaction.commit();
    } catch (error) {
      if (!options.transaction) await transaction.rollback();
      throw error;
    }
  }
});

  Pago.associate = function(models) {
    Pago.belongsTo(models.Factura, { foreignKey: 'factura_id', as: 'factura' });
    Pago.belongsTo(models.ObraSocial, { foreignKey: 'obra_social_id', as: 'obra_social' });
    Pago.belongsTo(models.Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
  };

  return Pago;
};