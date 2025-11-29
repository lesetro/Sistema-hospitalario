module.exports = (sequelize, DataTypes) => {
  //suponemos que el medico que lo reciba necesita ver que se registro por eso el turno
  // y que se le pueda hacer una evaluacion medica
  // de aqui podemos solicitarle EstudiosSolicitados, ProcedimientosPreQuirurgicos, ProcedimientosEnfermeria
  const EvaluacionMedica = sequelize.define(
    "EvaluacionMedica",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      paciente_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: "pacientes", key: "id" } },
      medico_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: "medicos", key: "id" } },
      fecha: { type: DataTypes.DATE, allowNull: false },
      diagnostico_id: { type: DataTypes.INTEGER, allowNull: true,references: { model: "diagnosticos", key: "id" }},
      turno_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'turnos', key: 'id' } },
      estudio_solicitado_id: { type: DataTypes.INTEGER, allowNull: true , references: { model: "estudiossolicitados", key: "id" }},
      observaciones_diagnostico: { type: DataTypes.TEXT, allowNull: true },
      tratamiento_id: { type: DataTypes.INTEGER,allowNull: true,references: { model: "tratamientos", key: "id" }},
    },
    {
      tableName: "evaluacionesmedicas",
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ["paciente_id"] },
        { fields: ["medico_id"] },
        { fields: ["diagnostico_id"] },
        { fields: ["turno_id"] },
        { fields: ["estudio_solicitado_id"] },
        { fields: ["tratamiento_id"] },
      ],
    }
  );
  EvaluacionMedica.beforeCreate(async (evaluacion, options) => {
    if (evaluacion.turno_id) {
      const turno = await sequelize.models.Turno.findByPk(evaluacion.turno_id);
      if (!turno) {
        throw new Error("El turno especificado no existe");
      }
      if (turno.estado !== "COMPLETADO") {
        throw new Error(
          "El turno debe estar COMPLETADO para crear una evaluación médica"
        );
      }
    }
  });

  EvaluacionMedica.associate = function (models) {
    EvaluacionMedica.belongsTo(models.Paciente, {
      foreignKey: "paciente_id",
      as: "paciente",
    });
    EvaluacionMedica.belongsTo(models.Medico, {
      foreignKey: "medico_id",
      as: "medico",
    });
    EvaluacionMedica.belongsTo(models.Tratamiento, {
      foreignKey: "tratamiento_id",
      as: "tratamiento",
    });
    EvaluacionMedica.belongsTo(models.EstudioSolicitado, {
      foreignKey: "estudio_solicitado_id",
      as: "estudio_solicitado",
    });
    EvaluacionMedica.hasMany(models.RecetaCertificado, {
      foreignKey: "evaluacion_medica_id",
      as: "recetas_certificados",
    });
    EvaluacionMedica.hasMany(models.ProcedimientoPreQuirurgico, {
      foreignKey: "evaluacion_medica_id",
      as: "procedimientos_pre_quirurgicos",
    });
    EvaluacionMedica.hasMany(models.ProcedimientoEnfermeria, {
      foreignKey: "evaluacion_medica_id",
      as: "procedimientos_enfermeria",
    });
    EvaluacionMedica.hasMany(models.EvaluacionEnfermeria, {
      foreignKey: "evaluacion_medica_id",
      as: "evaluaciones_enfermeria",
    });
    EvaluacionMedica.belongsTo(models.Diagnostico, {
      foreignKey: "diagnostico_id",
      as: "diagnostico",
    });
    EvaluacionMedica.hasMany(models.Turno, {
      foreignKey: "evaluacion_medica_id",
      as: "turnos",
    });
  };

  return EvaluacionMedica;
};
