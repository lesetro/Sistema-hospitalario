module.exports = (sequelize, DataTypes) => {
  const Medico = sequelize.define('medico', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: true,  references: { model: 'usuarios', key: 'id' } },
    matricula: { type: DataTypes.STRING(100), allowNull: false },
    especialidad_id: { type: DataTypes.INTEGER, allowNull: false },
    sector_id: { type: DataTypes.INTEGER, allowNull: false }
  }, {
    tableName: 'medicos',
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
    Medico.belongsTo(models.usuario, { foreignKey: 'usuario_id', as: 'usuario' });
    Medico.belongsTo(models.especialidad, { foreignKey: 'especialidad_id', as: 'especialidad' });
    Medico.belongsTo(models.sector, { foreignKey: 'sector_id', as: 'sector' });
    Medico.hasMany(models.internacion, { foreignKey: 'medico_id', as: 'internaciones' });
    Medico.hasMany(models.altamedica, { foreignKey: 'medico_id', as: 'altas' });
    Medico.hasMany(models.evaluacionenfermeria, { foreignKey: 'medico_id', as: 'evaluaciones' }); 
    Medico.hasMany(models.admision, { foreignKey: 'medico_id', as: 'admisiones' });

  };

  return Medico;
};