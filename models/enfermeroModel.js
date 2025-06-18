module.exports = (sequelize, DataTypes) => {
  const Enfermero = sequelize.define('enfermero', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: true },
    sector_id: { type: DataTypes.INTEGER, allowNull: false }
  }, {
    tableName: 'enfermeros',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['usuario_id'], unique: true },
      { fields: ['sector_id'] }
    ]
  });

  Enfermero.associate = function(models) {
    Enfermero.belongsTo(models.usuario, { foreignKey: 'usuario_id', as: 'usuario' });
    Enfermero.belongsTo(models.sector, { foreignKey: 'sector_id', as: 'sector' });
    Enfermero.hasMany(models.evaluacionenfermeria, { foreignKey: 'enfermero_id', as: 'evaluaciones' });
  };

  return Enfermero;
};