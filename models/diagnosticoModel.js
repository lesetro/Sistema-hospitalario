module.exports = (sequelize, DataTypes) => {
  const Diagnostico = sequelize.define('Diagnostico', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    codigo: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    tipo_diagnostico_id:{type: DataTypes.INTEGER, allowNull: false ,references: { model: 'tiposdiagnostico', key: 'id' }}, 
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: true }
  }, {
    tableName: 'diagnosticos',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['tipo_diagnostico_id'] },  
      { fields: ['nombre'] }                
    ]
  });

 

  Diagnostico.associate = function(models) {
    Diagnostico.belongsTo(models.TipoDiagnostico, { foreignKey: 'tipo_diagnostico_id', as: 'tipoDiagnostico' });
    Diagnostico.hasMany(models.EvaluacionMedica, { foreignKey: 'diagnostico_id', as: 'evaluacionesmedicas' });
    
};
 return Diagnostico;

};