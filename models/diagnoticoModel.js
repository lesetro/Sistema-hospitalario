module.exports = (sequelize, DataTypes) => {
  const Diagnostico = sequelize.define('diagnostico', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    codigo: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    tipoDiagnostico_id:{type: DataTypes.INTEGER, allowNull: false, references: { model: 'tipodiagnostico', key: 'id' }}, 
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: true }
  }, {
    tableName: 'diagnosticos',
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['codigo'], unique: true },
      { fields: ['tipodiagnostico_id'] },
      { fields: ['nombre'] }

    ]

  });

 

  Diagnostico.associate = function(models) {
    Diagnostico.belongsTo(models.tipodiagnostico, { foreignKey: 'tipodiagnostico_id', as: 'tipodiagnostico' });
    Diagnostico.hasMany(models.evaluacionmedica, { foreignKey: 'diagnostico_id', as: 'evaluacionesmedicas' });
    
};
 return Diagnostico;

};