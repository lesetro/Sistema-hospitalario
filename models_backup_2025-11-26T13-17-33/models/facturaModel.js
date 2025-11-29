module.exports = (sequelize, DataTypes) => {
  const Factura = sequelize.define('Factura', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    paciente_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'pacientes', key: 'id' } },
    monto: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: true },
    fecha_emision: { type: DataTypes.DATE, allowNull: false },
    estado: { type: DataTypes.ENUM('Pendiente', 'Pagada', 'Cancelada'), defaultValue: 'Pendiente' },
    admision_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'admisiones', key: 'id' } },
    tipo_pago: { type: DataTypes.ENUM('Efectivo','Cheque', 'Tarjeta', 'Transferencia', 'Obra Social'), allowNull: false },
  }, {
    tableName: 'facturas',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['paciente_id'] },
      { fields: ['fecha_emision'] },
      { fields: ['estado'] },
      { fields: ['admision_id'] },
      { fields: ['tipo_pago'] }
    ]
  });
 Factura.afterCreate(async (factura, options) => {
  const transaction = options.transaction || await sequelize.transaction();
  try {
    const paciente = await sequelize.models.Paciente.findByPk(factura.paciente_id, { transaction });
    if (paciente && paciente.usuario_id) {
      await sequelize.models.Notificacion.create({
        usuario_id: paciente.usuario_id,
        mensaje: `Se ha generado una nueva factura por $${factura.monto} con fecha ${factura.fecha_emision} para el paciente ${paciente.nombre}.`,
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
});

Factura.beforeCreate(async (factura, options) => {
  if (pago.metodo === 'Obra Social' && !pago.obra_social_id) {
    throw new Error('El campo obra_social_id es obligatorio para pagos con Obra Social');
  }
});


  Factura.associate = function(models) {
    Factura.belongsTo(models.Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
    Factura.hasMany(models.Pago, { foreignKey: 'factura_id', as: 'pagos' });
    Factura.belongsTo(models.Admision, { foreignKey: 'admision_id', as: 'admision' });
  };

  return Factura;
};
