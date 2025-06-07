module.exports = (sequelize, DataTypes) => {
  const Cama = sequelize.define(
    "Cama",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      habitacion_id: { type: DataTypes.INTEGER, allowNull: false },
      numero: { type: DataTypes.STRING(10), allowNull: false },
      estado: {
        type: DataTypes.ENUM("Libre", "Ocupada", "EnLimpieza"),
        defaultValue: "Libre",
      },
      fecha_fin_limpieza: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: "Camas",
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['habitacion_id'] }]
      
      });
  Cama.afterUpdate(async (cama, options) => {
    if (cama.estado === "EnLimpieza" && !cama.fecha_fin_limpieza) {
      const fechaFinLimpieza = new Date();
      fechaFinLimpieza.setHours(fechaFinLimpieza.getHours() + 2); // Estimar 2 horas
      await cama.update({ fecha_fin_limpieza: fechaFinLimpieza });
    } else if (cama.estado === "Libre" && cama.fecha_fin_limpieza) {
      await cama.update({ fecha_fin_limpieza: null });
    }
  });
  Cama.beforeUpdate(async (cama, options) => {
    if (cama.estado === "Libre" && cama.previous("estado") === "Ocupada") {
      const internacionActiva = await sequelize.models.Internacion.findOne({
        where: { cama_id: cama.id, fecha_fin: null },
      });
      if (internacionActiva) {
        throw new Error(
          "No se puede liberar la cama porque está asociada a una internación activa"
        );
      }
    }
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
