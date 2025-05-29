module.exports = (sequelize, DataTypes) => {
  const TurnoEstudio = sequelize.define('TurnoEstudio', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    estudio_solicitado_id: { type: DataTypes.INTEGER, allowNull: false },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    hora: { type: DataTypes.TIME, allowNull: false },
    estado: { type: DataTypes.ENUM('Pendiente', 'Realizado', 'Cancelado'), defaultValue: 'Pendiente' },
    resultado: { type: DataTypes.TEXT, allowNull: true }
  }, {
    tableName: 'TurnosEstudios',
    timestamps: true,
    underscored: true
  });

  TurnoEstudio.associate = function(models) {
    TurnoEstudio.belongsTo(models.EstudioSolicitado, { foreignKey: 'estudio_solicitado_id', as: 'estudio_solicitado' });
  };

  return TurnoEstudio;
};