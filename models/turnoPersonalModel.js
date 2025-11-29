module.exports = (sequelize, DataTypes) => {
  const TurnoPersonal = sequelize.define('TurnoPersonal', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false , references: { model: 'usuarios', key: 'id' } },
    tipo: { type: DataTypes.ENUM('Guardia Activa', 'Guardia Pasiva', 'Atencion'), allowNull: false },
    dias: { type: DataTypes.STRING(100), allowNull: false },
    hora_inicio: { type: DataTypes.TIME, allowNull: false },
    hora_fin: { type: DataTypes.TIME, allowNull: false },
    sector_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'sectores', key: 'id' } }
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
    TurnoPersonal.belongsTo(models.Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
    TurnoPersonal.belongsTo(models.Sector, { foreignKey: 'sector_id', as: 'sector' });
    TurnoPersonal.hasMany(models.Administrativo, { foreignKey: 'turno_id', as: 'administrativos' });
  };

  return TurnoPersonal;
};
