module.exports = (sequelize, DataTypes) => {
  const Admision = sequelize.define('Admision', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    paciente_id: { type: DataTypes.INTEGER, allowNull: false },
    administrativo_id: { type: DataTypes.INTEGER, allowNull: false },
    estado: { type: DataTypes.ENUM('Pendiente', 'Cancelada', 'Completada'), defaultValue: 'Pendiente' },
    fecha: { type: DataTypes.DATE, allowNull: false },
    motivo_id: { type: DataTypes.INTEGER, allowNull: false },
    forma_ingreso_id: { type: DataTypes.INTEGER, allowNull: false },
    turno_id: { type: DataTypes.INTEGER, allowNull: true },

  }, {
    tableName: 'Admisiones',
    timestamps: true,
    underscored: true
  });

  Admision.associate = function(models) {
    Admision.belongsTo(models.Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
    Admision.belongsTo(models.Administrativo, { foreignKey: 'administrativo_id', as: 'administrativo' });
    Admision.belongsTo(models.MotivoAdmision, { foreignKey: 'motivo_id', as: 'motivo' });
    Admision.belongsTo(models.FormaIngreso, { foreignKey: 'forma_ingreso_id', as: 'forma_ingreso' });
    Admision.belongsTo(models.Turno, { foreignKey: 'turno_id', as: 'turno' });
  };

  return Admision;
};
