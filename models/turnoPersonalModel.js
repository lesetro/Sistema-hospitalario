module.exports = (sequelize, DataTypes) => {
  const TurnoPersonal = sequelize.define('turnopersonal', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    tipo: { type: DataTypes.ENUM('Guardia Activa', 'Guardia Pasiva', 'Atencion'), allowNull: false },
    dias: { type: DataTypes.STRING(100), allowNull: false },
    hora_inicio: { type: DataTypes.TIME, allowNull: false },
    hora_fin: { type: DataTypes.TIME, allowNull: false },
    sector_id: { type: DataTypes.INTEGER, allowNull: false }
  }, {
    tableName: 'turnospersonal',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['usuario_id', 'sector_id', 'tipo'] },
      { fields: ['hora_inicio'] },
      { fields: ['hora_fin'] }
    ]
  });

  TurnoPersonal.associate = function(models) {
    TurnoPersonal.belongsTo(models.usuario, { foreignKey: 'usuario_id', as: 'usuario' });
    TurnoPersonal.belongsTo(models.sector, { foreignKey: 'sector_id', as: 'sector' });
    TurnoPersonal.hasMany(models.administrativo, { foreignKey: 'turno_id', as: 'administrativos' });
  };

  return TurnoPersonal;
};
