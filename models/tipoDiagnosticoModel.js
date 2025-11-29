module.exports = (sequelize, DataTypes) => {
  const TipoDiagnostico = sequelize.define('TipoDiagnostico', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(50), allowNull: false,unique: true },
    descripcion: { type: DataTypes.TEXT, allowNull: true },
    sistema_clasificacion: { type: DataTypes.STRING(20),allowNull: false}
  }, {
    tableName: 'tiposdiagnostico', 
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['sistema_clasificacion'] },
      { fields: ['nombre'] }
    ]
  });

  TipoDiagnostico.associate = function(models) {
    TipoDiagnostico.hasMany(models.Diagnostico, {foreignKey: "tipo_diagnostico_id",as: 'diagnosticos' });
  };

  return TipoDiagnostico;
};