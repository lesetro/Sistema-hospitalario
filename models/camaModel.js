module.exports = (sequelize, DataTypes) => {
  const Cama = sequelize.define(
    "Cama",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      habitacion_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: "habitaciones", key: "id" } },
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
          { fields: ['habitacion_id'] },
          { fields: ['estado'] },  
          { fields: ['estado', 'sexo_ocupante'] }
        ]
      });
      


  Cama.associate = function (models) {
    Cama.belongsTo(models.Habitacion, {
      foreignKey: "habitacion_id",
      as: "habitacion",
    });
    Cama.hasMany(models.Internacion, {
      foreignKey: "cama_id",
      as: "internaciones",
    });
  };

  return Cama;
};
