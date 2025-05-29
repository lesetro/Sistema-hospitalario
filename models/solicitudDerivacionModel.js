module.exports = (sequelize, DataTypes) => {
  const SolicitudDerivacion = sequelize.define('SolicitudDerivacion', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    paciente_id: { type: DataTypes.INTEGER, allowNull: false },
    origen_id: { type: DataTypes.INTEGER, allowNull: false },
    destino_id: { type: DataTypes.INTEGER, allowNull: false },
    tipo: { type: DataTypes.ENUM('Interna', 'Externa'), allowNull: false },
    estado: { type: DataTypes.ENUM('Pendiente', 'Aprobada', 'Rechazada'), allowNull: false },
    fecha: { type: DataTypes.DATE, allowNull: false },
    motivo: { type: DataTypes.TEXT, allowNull: true }
  }, {
    tableName: 'SolicitudesDerivaciones',
    timestamps: true,
    underscored: true
  });

  SolicitudDerivacion.associate = function(models) {
    SolicitudDerivacion.belongsTo(models.Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
    SolicitudDerivacion.belongsTo(models.Sector, { foreignKey: 'origen_id', as: 'origen' });
    SolicitudDerivacion.belongsTo(models.Sector, { foreignKey: 'destino_id', as: 'destino' });
  };

  return SolicitudDerivacion;
};
