// models/Paciente.js
module.exports = (sequelize, DataTypes) => {
  const Paciente = sequelize.define('paciente', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Usuarios', key: 'id' }
    },
    administrativo_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Administrativos', key: 'id' }
    },
    obra_social_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'obrassociales', key: 'id' }
    },
    fecha_ingreso: { type: DataTypes.DATE, allowNull: false },
    fecha_egreso: { type: DataTypes.DATE, allowNull: true },
    estado: {
      type: DataTypes.ENUM('Activo', 'Inactivo', 'Baja'),
      defaultValue: 'Activo'
    },
    observaciones: { type: DataTypes.TEXT, allowNull: true }
  }, {
    tableName: 'pacientes',
    timestamps: true,
    underscored: true
  });

  Paciente.associate = function(models) {
    Paciente.belongsTo(models.usuario, { foreignKey: 'usuario_id', as: 'usuario' });
    Paciente.belongsTo(models.administrativo, { foreignKey: 'administrativo_id', as: 'administrativo' });
    Paciente.belongsTo(models.obrasocial, { foreignKey: 'obra_social_id', as: 'obraSocial' });
    Paciente.hasMany(models.estudiosolicitado, { foreignKey: 'paciente_id', as: 'estudio_solicitado' });
    Paciente.hasMany(models.evaluacionmedica, { foreignKey: 'paciente_id', as: 'evaluaciones' });
    Paciente.hasMany(models.altamedica, { foreignKey: 'paciente_id', as: 'altas_med' });
    Paciente.hasMany(models.historialmedico, { foreignKey: 'paciente_id', as: 'historial' });
    Paciente.hasMany(models.factura, { foreignKey: 'paciente_id', as: 'facturas' });
    Paciente.hasMany(models.admision, { foreignKey: 'paciente_id', as: 'admisiones' });
  };

  return Paciente;
};