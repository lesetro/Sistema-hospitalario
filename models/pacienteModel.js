// models/Paciente.js
module.exports = (sequelize, DataTypes) => {
  const Paciente = sequelize.define('Paciente', {
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
      references: { model: 'ObrasSociales', key: 'id' }
    },
    fecha_ingreso: { type: DataTypes.DATE, allowNull: false },
    fecha_egreso: { type: DataTypes.DATE, allowNull: true },
    estado: {
      type: DataTypes.ENUM('Activo', 'Inactivo', 'Baja'),
      defaultValue: 'Activo'
    },
    observaciones: { type: DataTypes.TEXT, allowNull: true }
  }, {
    tableName: 'Pacientes',
    timestamps: true,
    underscored: true
  });

  Paciente.associate = function(models) {
    Paciente.belongsTo(models.Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
    Paciente.belongsTo(models.Administrativo, { foreignKey: 'administrativo_id', as: 'administrativo' });
    Paciente.belongsTo(models.ObraSocial, { foreignKey: 'obra_social_id', as: 'obraSocial' });
    Paciente.hasMany(models.EstudioSolicitado, { foreignKey: 'paciente_id', as: 'estudio_solicitado' });
    Paciente.hasMany(models.EvaluacionMedica, { foreignKey: 'paciente_id', as: 'evaluaciones' });
    Paciente.hasMany(models.AltaMedica, { foreignKey: 'paciente_id', as: 'altas_med' });
    Paciente.hasMany(models.HistorialMedico, { foreignKey: 'paciente_id', as: 'historial' });
    Paciente.hasMany(models.Factura, { foreignKey: 'paciente_id', as: 'facturas' });
    Paciente.hasMany(models.Admision, { foreignKey: 'paciente_id', as: 'admisiones' });
  };

  return Paciente;
};