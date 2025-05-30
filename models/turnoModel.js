const evaluacionMedicaModel = require("./evaluacionMedicaModel");
const listaEsperaModel = require("./listaEsperaModel");

module.exports = (sequelize, DataTypes) => {
  const Turno = sequelize.define(
    "Turno",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tipo_turno_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "tipos_turno", key: "id" },
      },
      // Campos
      fecha: { type: DataTypes.DATEONLY, allowNull: false },
      hora_inicio: { type: DataTypes.TIME, allowNull: false },
      hora_fin: { type: DataTypes.TIME, allowNull: true },
      estado: {
        type: DataTypes.ENUM(
          "PENDIENTE",
          "CONFIRMADO",
          "COMPLETADO",
          "CANCELADO"
        ),
        defaultValue: "PENDIENTE",
      },

      // Campos específicos para tipo MEDICO
      paciente_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "Pacientes", key: "id" },
      },
      medico_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "Medicos", key: "usuario_id" },
      },
      listaEsperaModel_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "ListasEspera", key: "id" },
      },

      usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "Usuarios", key: "id" },
      },
      sector_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "Sectores", key: "id" },
      },
    },
    {
      tableName: "turnos",
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ["tipo", "fecha", "estado"] },
        { fields: ["paciente_id", `estado`] },
        { fields: ["medico_id"] },
        { fields: ["usuario_id"] },
        { fields: ["sector_id"] },
        { fields: ["listaEsperaModel_id"] },
      ],
    }
  );
  Turno.beforeCreate(async (turno, options) => {
    if (turno.tipo === "MEDICO" && (!turno.paciente_id || !turno.medico_id)) {
      throw new Error(
        "paciente_id y medico_id son requeridos para turnos de tipo MEDICO"
      );
    }
    if (turno.tipo === "ESTUDIO" && !turno.paciente_id) {
      throw new Error("paciente_id es requerido para turnos de tipo ESTUDIO");
    }
    if (turno.tipo === "PERSONAL" && (!turno.usuario_id || !turno.sector_id)) {
      throw new Error(
        "usuario_id y sector_id son requeridos para turnos de tipo PERSONAL"
      );
    }
  });
  Turno.afterUpdate(async (turno, options) => {
    if (
      turno.lista_espera_id &&
      ["COMPLETADO", "CANCELADO"].includes(turno.estado)
    ) {
      await sequelize.models.ListaEspera.update(
        { estado: turno.estado },
        { where: { id: turno.lista_espera_id } }
      );
    }
  });

  Turno.associate = function (models) {
    Turno.belongsTo(models.Paciente, {
      foreignKey: "paciente_id",
      as: "paciente",
    });
    Turno.belongsTo(models.Medico, { foreignKey: "medico_id", as: "medico" });
    Turno.belongsTo(models.Usuario, {
      foreignKey: "usuario_id",
      as: "usuario",
    });
    Turno.belongsTo(models.Sector, { foreignKey: "sector_id", as: "sector" });
    Turno.belongsTo(models.ListaEspera, {
      foreignKey: "lista_espera_id",
      as: "lista_espera",
      constraints: false,
    });
    Turno.hasOne(models.EvaluacionMedica, {
      foreignKey: "turno_id",
      as: "evaluacionMedica",
    });
    Turno.belongsTo(models.TipoTurno, {
      foreignKey: "tipo_turno_id",
      as: "tipoTurno",
    });
  };
  return Turno;
};
