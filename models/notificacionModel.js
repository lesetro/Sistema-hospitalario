// models/notificacionModel.js
module.exports = (sequelize, DataTypes) => {
  const Notificacion = sequelize.define('Notificacion', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    usuario_id: { 
      type: DataTypes.INTEGER, 
      allowNull: false, 
      references: { model: 'usuarios', key: 'id' },
      comment: 'Destinatario del mensaje'
    },
    remitente_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'usuarios', key: 'id' },
      comment: 'Quien envía el mensaje (null = sistema)'
    },
    mensaje: { type: DataTypes.TEXT, allowNull: false },
    leida: { type: DataTypes.BOOLEAN, defaultValue: false },
    eliminado: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, {
    tableName: 'notificaciones',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['usuario_id'] },
      { fields: ['remitente_id'] },
      { fields: ['leida'] },
      { fields: ['eliminado'] },
      { fields: ['created_at'] }
    ]
  });

  Notificacion.associate = function(models) {
    Notificacion.belongsTo(models.Usuario, { 
      foreignKey: 'usuario_id', 
      as: 'destinatario' 
    });
    Notificacion.belongsTo(models.Usuario, { 
      foreignKey: 'remitente_id', 
      as: 'remitente' 
    });
  };

  return Notificacion;
};