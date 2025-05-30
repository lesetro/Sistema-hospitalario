module.exports = (sequelize, DataTypes) => {
  const Enfermero = sequelize.define('Enfermero', {
    usuario_id: { type: DataTypes.INTEGER, primaryKey: true },
    sector_id: { type: DataTypes.INTEGER, allowNull: false }
  }, {
    tableName: 'Enfermeros',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['usuario_id'], unique: true },
      { fields: ['sector_id'] }
    ]
  });

  Enfermero.associate = function(models) {
    Enfermero.belongsTo(models.Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
    Enfermero.belongsTo(models.Sector, { foreignKey: 'sector_id', as: 'sector' });
    Enfermero.hasMany(models.EvaluacionEnfermeria, { foreignKey: 'enfermero_id', as: 'evaluaciones' });
  };

  return Enfermero;
};