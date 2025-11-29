module.exports = (sequelize, DataTypes) => {
  const Pago = sequelize.define('Pago', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    paciente_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'pacientes', key: 'id' } },
    factura_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'facturas', key: 'id' } },
    obra_social_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'obrassociales', key: 'id' } },
    monto: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    fecha: { type: DataTypes.DATE, allowNull: false },
    metodo: { type: DataTypes.ENUM('Efectivo', 'Tarjeta', 'Transferencia', 'Obra Social', 'SISTEMA PUBLICO'), allowNull: false },
    estado: { type: DataTypes.ENUM('Pendiente', 'Completado', 'Rechazado'), defaultValue: 'Pendiente' },
    motivo_rechazo: { type: DataTypes.TEXT, allowNull: true }, 
    
    
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
  Pago.beforeCreate(async (pago, options) => {
    const transaction = options.transaction || await sequelize.transaction();
    try {
      const factura = await sequelize.models.Factura.findByPk(pago.factura_id, { transaction });
      
      if (factura) {
        // Si la factura es SISTEMA PUBLICO, pago automático
        if (factura.tipo_pago === 'SISTEMA PUBLICO') {
          pago.metodo = 'SISTEMA PUBLICO';
          pago.estado = 'Completado'; // ✅ Automáticamente completado
          pago.tipo_pago = 'Sistema Público Automático';
          pago.descripcion = 'Pago automático - Sistema Público';
        }
        // Si no se asignó obra_social_id y la factura la tiene, heredar
        else if (!pago.obra_social_id && factura.obra_social_id) {
          pago.obra_social_id = factura.obra_social_id;
        }
        
        // Validación: Si método es SISTEMA PUBLICO pero factura no lo es
        if (pago.metodo === 'SISTEMA PUBLICO' && factura.tipo_pago !== 'SISTEMA PUBLICO') {
          throw new Error('Método SISTEMA PUBLICO solo aplica a facturas del sistema público');
        }
      }
      
      if (!options.transaction) await transaction.commit();
    } catch (error) {
      if (!options.transaction) await transaction.rollback();
      throw error;
    }
  });

  Pago.afterUpdate(async (pago, options) => {
    if (pago.estado === 'Completado' && pago.previous('estado') !== 'Completado') {
      const transaction = options.transaction || await sequelize.transaction();
      try {
        const factura = await sequelize.models.Factura.findByPk(pago.factura_id, { transaction });
        const paciente = await sequelize.models.Paciente.findByPk(factura.paciente_id, { transaction });
        
        if (paciente && paciente.usuario_id) {
          //  NOTIFICACIÓN 
          let mensaje = '';
          if (pago.metodo === 'SISTEMA PUBLICO') {
            mensaje = `El sistema público ha procesado automáticamente el pago de $${pago.monto} para la factura #${factura.id}.`;
          } else if (pago.metodo === 'Obra Social') {
            mensaje = `Su obra social ha procesado el pago de $${pago.monto} para la factura #${factura.id}.`;
          } else {
            mensaje = `Se ha registrado un pago de $${pago.monto} para la factura #${factura.id}. Método: ${pago.metodo}.`;
          }

          await sequelize.models.Notificacion.create({
            usuario_id: paciente.usuario_id,
            mensaje: mensaje,
            leida: false,
            created_at: new Date(),
            updated_at: new Date()
          }, { transaction });

          //  ACTUALIZAR ESTADO DE LA FACTURA SI TODOS LOS PAGOS ESTÁN COMPLETADOS
          const pagosPendientes = await sequelize.models.Pago.count({
            where: { 
              factura_id: factura.id,
              estado: { [sequelize.Op.ne]: 'Completado' }
            },
            transaction
          });

          if (pagosPendientes === 0) {
            await factura.update({ estado: 'Pagada' }, { transaction });
          }
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