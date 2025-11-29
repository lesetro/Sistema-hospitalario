module.exports = (sequelize, DataTypes) => {
  const Enfermero = sequelize.define('Enfermero', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: "usuarios", key: "id" } },
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
    Enfermero.belongsTo(models.Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
    Enfermero.belongsTo(models.Sector, { foreignKey: 'sector_id', as: 'sector' });
    Enfermero.hasMany(models.EvaluacionEnfermeria, { foreignKey: 'enfermero_id', as: 'evaluaciones' });
  };

  return Enfermero;
};