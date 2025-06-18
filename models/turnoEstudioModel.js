module.exports = (sequelize, DataTypes) => {
  const TurnoEstudio = sequelize.define('TurnoEstudio', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    estudio_solicitado_id: { type: DataTypes.INTEGER, allowNull: false , references: { model: 'estudiossolicitados', key: 'id' } },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    hora: { type: DataTypes.TIME, allowNull: false },
    estado: { type: DataTypes.ENUM('Pendiente', 'Realizado', 'Cancelado'), defaultValue: 'Pendiente' },
    resultado: { type: DataTypes.TEXT, allowNull: true }
  }, {
    tableName: 'turnosestudios',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['estudio_solicitado_id'] },
      { fields: ['fecha', 'hora'] },
      { fields: ['estado'] }
    ]
  });
  TurnoEstudio.afterUpdate(async (turno, options) => {
  const transaction = options.transaction || await sequelize.transaction();
  try {
    if (['Realizado', 'Cancelado'].includes(turno.estado)) {
      await sequelize.models.EstudioSolicitado.update(
        { estado: turno.estado },
        { where: { id: turno.estudio_solicitado_id }, transaction }
      );
    }
    if (!options.transaction) await transaction.commit();
  } catch (error) {
    if (!options.transaction) await transaction.rollback();
    throw error;
  }

});

  TurnoEstudio.associate = function(models) {
    TurnoEstudio.belongsTo(models.EstudioSolicitado, { foreignKey: 'estudio_solicitado_id', as: 'estudio_solicitado' });
  };

  return TurnoEstudio;
};