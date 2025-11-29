module.exports = (sequelize, DataTypes) => {
  const TipoTurno = sequelize.define('TipoTurno', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING, allowNull: false, unique: true }, // Ej: 'Consulta'
    descripcion: { type: DataTypes.TEXT, allowNull: true },
    requiere_especialidad: { type: DataTypes.BOOLEAN, defaultValue: false }, 
    requiere_estudio: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, {
    tableName: 'tipos_turno', 
    timestamps: true,
    underscored: true
  });

  TipoTurno.associate = function(models) {
    TipoTurno.hasMany(models.ListaEspera, { foreignKey: 'tipo_turno_id', as: 'listas_espera'});
  };

  return TipoTurno;
};
