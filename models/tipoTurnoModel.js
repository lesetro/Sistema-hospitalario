module.exports = (sequelize, DataTypes) => {
  const TipoTurno = sequelize.define('TipoTurno', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING, allowNull: false, unique: true }, // Ej: 'MEDICO'
    descripcion: { type: DataTypes.TEXT, allowNull: true }
  }, {
    tableName: 'tipos_turno',
    timestamps: true,
    underscored: true
  });

  TipoTurno.associate = function(models) {
    TipoTurno.hasMany(models.Turno, { foreignKey: 'tipo_turno_id', as: 'turnos' });
  };

  return TipoTurno;
};
