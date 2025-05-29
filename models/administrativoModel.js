module.exports = (sequelize, DataTypes) => {
  const Administrativo = sequelize.define('Administrativo', {
    usuario_id: { type: DataTypes.INTEGER, primaryKey: true },
    sector_id: { type: DataTypes.INTEGER, allowNull: false },
    turno_id: { type: DataTypes.INTEGER, allowNull: true },
    responsabilidad: {
      type: DataTypes.ENUM('Expediente', 'Turnos', 'Legajos', 'Derivaciones', 'General', 'Otros'),
      defaultValue: 'General'
    },
    descripcion: { type: DataTypes.STRING(255), allowNull: true }
  }, {
    tableName: 'Administrativos',
    timestamps: true,
    underscored: true
  });

  Administrativo.associate = function(models) {
    Administrativo.belongsTo(models.Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
    Administrativo.belongsTo(models.Sector, { foreignKey: 'sector_id', as: 'sector' });
    Administrativo.belongsTo(models.TurnoPersonal, { foreignKey: 'turno_id', as: 'turno' });
    Administrativo.hasMany(models.Paciente, { foreignKey: 'administrativo_id',as: 'pacientes_cargados'});
  };

  return Administrativo;
};
