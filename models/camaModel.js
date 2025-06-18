module.exports = (sequelize, DataTypes) => {
  const Cama = sequelize.define(
    "cama",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      habitacion_id: { type: DataTypes.INTEGER, allowNull: false },
      numero: { type: DataTypes.STRING(10), allowNull: false },
      sexo_ocupante: { type: DataTypes.ENUM('Masculino', 'Femenino', 'Otro'), allowNull: true },
      estado: { type: DataTypes.ENUM("Libre", "Ocupada", "EnLimpieza"),defaultValue: "Libre",},
      fecha_fin_limpieza: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: "camas",
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['habitacion_id'] }]
      
      });


  Cama.associate = function (models) {
    Cama.belongsTo(models.habitacion, {
      foreignKey: "habitacion_id",
      as: "habitacion",
    });
    Cama.hasMany(models.internacion, {
      foreignKey: "cama_id",
      as: "internaciones",
    });
  };

  return Cama;
};
