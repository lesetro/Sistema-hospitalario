module.exports = (sequelize, DataTypes) => {
  const Administrativo = sequelize.define('Administrativo', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: true , references: { model: 'usuarios', key: 'id' } },
    sector_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'sectores', key: 'id' } },
    turno_id: { type: DataTypes.INTEGER, allowNull: true ,  references: { model: 'turnospersonal', key: 'id' } },
    responsabilidad: {
      type: DataTypes.ENUM('Expediente', 'Turnos', 'Legajos', 'Derivaciones', 'General', 'Otros'),
      defaultValue: 'General'
    },
    descripcion: { type: DataTypes.STRING(255), allowNull: true },
    estado: { type: DataTypes.ENUM('Activo', 'Inactivo'), defaultValue: 'Activo' },
  }, {
    tableName: 'administrativos',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['usuario_id'], unique: true },
      { fields: ['sector_id'] },
      { fields: ['turno_id'] }
    ]
  });

  Administrativo.associate = function(models) {
    Administrativo.belongsTo(models.Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
    Administrativo.belongsTo(models.Sector, { foreignKey: 'sector_id', as: 'sector' });
    Administrativo.belongsTo(models.TurnoPersonal, { foreignKey: 'turno_id', as: 'turno' });
    Administrativo.hasMany(models.Paciente, { foreignKey: 'administrativo_id',as: 'pacientes_cargados'});
  };

  return Administrativo;
};
