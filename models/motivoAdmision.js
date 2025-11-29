module.exports = (sequelize, DataTypes) => {
  const MotivoAdmision = sequelize.define('MotivoAdmision', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    descripcion: { type: DataTypes.STRING(255), allowNull: true }
  }, {
    tableName: 'motivosadmision',
    timestamps: true,
    underscored: true
  });

  MotivoAdmision.associate = function(models) {
    MotivoAdmision.hasMany(models.Admision, { foreignKey: 'motivo_id', as: 'admisiones' });
  };

  return MotivoAdmision;
};