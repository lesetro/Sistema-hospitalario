module.exports = (sequelize, DataTypes) => {
  const Medico = sequelize.define('Medico', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: true,  references: { model: 'Usuarios', key: 'id' } },
    matricula: { type: DataTypes.STRING(100), allowNull: false },
    especialidad_id: { type: DataTypes.INTEGER, allowNull: false },
    sector_id: { type: DataTypes.INTEGER, allowNull: false }
  }, {
    tableName: 'Medicos',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['usuario_id'], unique: true },
      { fields: ['matricula'], unique: true },
      { fields: ['especialidad_id'] },
      { fields: ['sector_id'] }
    ]
  });

  Medico.associate = function(models) {
    Medico.belongsTo(models.Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
    Medico.belongsTo(models.Especialidad, { foreignKey: 'especialidad_id', as: 'especialidad' });
    Medico.belongsTo(models.Sector, { foreignKey: 'sector_id', as: 'sector' });
    Medico.hasMany(models.Internacion, { foreignKey: 'medico_id', as: 'internaciones' });
    Medico.hasMany(models.AltaMedica, { foreignKey: 'medico_id', as: 'altas' });
    Medico.hasMany(models.EvaluacionEnfermeria, { foreignKey: 'medico_id', as: 'evaluaciones' }); 
    Medico.hasMany(models.Admision, { foreignKey: 'medico_id', as: 'admisiones' });

  };

  return Medico;
};