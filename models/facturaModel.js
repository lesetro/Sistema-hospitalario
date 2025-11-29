module.exports = (sequelize, DataTypes) => {
  const Factura = sequelize.define('Factura', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    paciente_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'pacientes', key: 'id' } },
    monto: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    obra_social_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'obrassociales', key: 'id' }},
    descripcion: { type: DataTypes.TEXT, allowNull: true },
    fecha_emision: { type: DataTypes.DATE, allowNull: false },
    estado: { type: DataTypes.ENUM('Pendiente', 'Pagada', 'Cancelada'), defaultValue: 'Pendiente' },
    admision_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'admisiones', key: 'id' } },
    tipo_pago: { type: DataTypes.ENUM('Efectivo','Cheque', 'Tarjeta', 'Transferencia', 'Obra Social','SISTEMA PUBLICO'), allowNull: false },
  }, {
    tableName: 'facturas',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['paciente_id'] },
      { fields: ['fecha_emision'] },
      { fields: ['obra_social_id'] },
      { fields: ['estado'] },
      { fields: ['admision_id'] },
      { fields: ['tipo_pago'] }
    ]
  });
 Factura.beforeCreate(async (factura, options) => {
    const transaction = options.transaction || await sequelize.transaction();
    try {
      const paciente = await sequelize.models.Paciente.findByPk(factura.paciente_id, { transaction });
      
      if (paciente) {
        // Si el paciente tiene obra social, asignarla automáticamente
        if (paciente.obra_social_id && !factura.obra_social_id) {
          factura.obra_social_id = paciente.obra_social_id;
          factura.tipo_pago = 'Obra Social';
        }
        // Si NO tiene obra social, asignar SISTEMA PUBLICO
        else if (!paciente.obra_social_id && !factura.obra_social_id) {
          factura.tipo_pago = 'SISTEMA PUBLICO';
          factura.estado = 'Pagada'; // ✅ Automáticamente pagada
          
          // Agregar descripción automática
          if (!factura.descripcion) {
            factura.descripcion = 'Atención en sistema público - IVA Exento';
          }
        }
      }
      
      if (!options.transaction) await transaction.commit();
    } catch (error) {
      if (!options.transaction) await transaction.rollback();
      throw error;
    }
  });

  Factura.afterCreate(async (factura, options) => {
    const transaction = options.transaction || await sequelize.transaction();
    try {
      const paciente = await sequelize.models.Paciente.findByPk(factura.paciente_id, { transaction });
      if (paciente && paciente.usuario_id) {
        // ✅ NOTIFICACIÓN SEGÚN TIPO_PAGO
        let mensaje = '';
        if (factura.tipo_pago === 'SISTEMA PUBLICO') {
          mensaje = `Se ha generado una factura al sistema público por $${factura.monto}. No requiere pago directo.`;
        } else if (factura.tipo_pago === 'Obra Social') {
          mensaje = `Se ha generado una factura a su obra social por $${factura.monto}.`;
        } else {
          mensaje = `Se ha generado una factura particular por $${factura.monto}. Método: ${factura.tipo_pago}.`;
        }

        await sequelize.models.Notificacion.create({
          usuario_id: paciente.usuario_id,
          mensaje: mensaje,
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

  Factura.associate = function(models) {
    Factura.belongsTo(models.Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
    Factura.belongsTo(models.ObraSocial, { foreignKey: 'obra_social_id', as: 'obra_social',allowNull: true });
    Factura.hasMany(models.Pago, { foreignKey: 'factura_id', as: 'pagos' });
    Factura.belongsTo(models.Admision, { foreignKey: 'admision_id', as: 'admision' });
  };

  return Factura;
};


