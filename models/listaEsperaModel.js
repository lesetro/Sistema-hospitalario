// Cambiar a un diseño más estructurado:
module.exports = (sequelize, DataTypes) => {
  const ListaEspera = sequelize.define(
    "ListaEspera",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      paciente_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Pacientes", key: "id" },
      },
      tipo: {
        type: DataTypes.ENUM("ESTUDIO", "EVALUACION", "INTERNACION", "CIRUGIA"),
        allowNull: false,
      },
      // Campos específicos por tipo
      tipo_estudio_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "TiposEstudio", key: "id" },
      }, // puede que no siempre se pidan estudios
      especialidad_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "Especialidades", key: "id" },
      },

      prioridad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 2, // 1=Alta, 2=Media, 3=Baja
      },
      estado: {
        type: DataTypes.ENUM(
          "PENDIENTE",
          "ASIGNADO",
          "CANCELADO",
          "COMPLETADO"
        ),
        allowNull: false,
        defaultValue: "PENDIENTE",
      },
      fecha_registro: { type: DataTypes.DATE, allowNull: false },
    },
    {
      tableName: "listas_espera",
      timestamps: true,
      underscored: true,
      indexes: [
        // Índice para búsquedas por tipo y prioridad
        {
          fields: ["tipo", "prioridad", "estado"],
        },
      ],
    }
  );
  ListaEspera.beforeCreate(async (lista, options) => {
    if (lista.tipo === "ESTUDIO" && !lista.tipo_estudio_id) {
      throw new Error(
        "tipo_estudio_id es requerido para listas de espera de tipo ESTUDIO"
      );
    }
    if (lista.tipo === "EVALUACION" && !lista.especialidad_id) {
      throw new Error(
        "especialidad_id es requerido para listas de espera de tipo EVALUACION"
      );
    }
    if (lista.prioridad < 1 || lista.prioridad > 3) {
      throw new Error("La prioridad debe estar entre 1 (Alta) y 3 (Baja)");
    }
  });
  ListaEspera.beforeUpdate(async (lista, options) => {
    if (lista.estado === "ASIGNADO" && !lista.turno_id) {
      throw new Error("No se puede marcar como ASIGNADO sin un turno asociado");
    }
    if (lista.estado === "COMPLETADO") {
      const turno = await sequelize.models.Turno.findOne({
        where: { lista_espera_id: lista.id },
      });
      if (!turno || turno.estado !== "COMPLETADO") {
        throw new Error(
          "El turno asociado debe estar COMPLETADO para marcar la lista como COMPLETADA"
        );
      }
    }
  });

  ListaEspera.associate = function (models) {
    ListaEspera.belongsTo(models.Paciente, {
      foreignKey: "paciente_id",
      as: "paciente",
    });
    ListaEspera.belongsTo(models.TipoEstudio, {
      foreignKey: "tipo_estudio_id",
      as: "tipo_estudio",
      constraints: false,
    });
    ListaEspera.belongsTo(models.Especialidad, {
      foreignKey: "especialidad_id",
      as: "especialidad",
      constraints: false,
    });
    ListaEspera.hasOne(models.turno, {
      foreignKey: "lista_espera_id",
      as: "turno",
      constraints: false,
    });
  };

  return ListaEspera;
};
