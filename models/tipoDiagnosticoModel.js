module.exports = (sequelize, DataTypes) => {
  const TipoDiagnostico = sequelize.define('TipoDiagnostico', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(50), allowNull: false,unique: true },
    descripcion: { type: DataTypes.TEXT, allowNull: true },
    sistema_clasificacion: { type: DataTypes.STRING(20),allowNull: false}
  }, {
    tableName: 'tipos_diagnostico', 
    timestamps: false,
    underscored: true
  });

  TipoDiagnostico.associate = function(models) {
    TipoDiagnostico.hasMany(models.Diagnostico, {foreignKey: 'tipoDiagnostico_id',as: 'diagnosticos' });
  };

  return TipoDiagnostico;
};