module.exports = (sequelize, DataTypes) => {
  //suponemos que el medico que lo reciba necesita ver que se registro por eso el turno
  // y que se le pueda hacer una evaluacion medica
  // de aqui podemos solicitarle EstudiosSolicitados, RecetasCertificados, ProcedimientosPreQuirurgicos, ProcedimientosEnfermeria
  const EvaluacionMedica = sequelize.define(
    "evaluacionmedica",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      paciente_id: { type: DataTypes.INTEGER, allowNull: false },
      medico_id: { type: DataTypes.INTEGER, allowNull: false },
      fecha: { type: DataTypes.DATE, allowNull: false },
      diagnostico_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "diagnosticos", key: "id" },
      },
      estudio_solicitado_id: { type: DataTypes.INTEGER, allowNull: true },
      observaciones_diagnostico: { type: DataTypes.TEXT, allowNull: true },
      tratamiento_id: { type: DataTypes.INTEGER,allowNull: true,references: { model: "tratamientos", key: "id" },},
    },
    {
      tableName: "evaluacionesmedicas",
      timestamps: true,
      underscored: true,
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
      if (
        turno.paciente_id !== evaluacion.paciente_id ||
        turno.medico_id !== evaluacion.medico_id
      ) {
        throw new Error(
          "El paciente y médico del turno deben coincidir con la evaluación"
        );
      }
    }
  });

  EvaluacionMedica.associate = function (models) {
    EvaluacionMedica.belongsTo(models.paciente, {
      foreignKey: "paciente_id",
      as: "paciente",
    });
    EvaluacionMedica.belongsTo(models.medico, {
      foreignKey: "medico_id",
      as: "medico",
    });
    EvaluacionMedica.belongsTo(models.tratamiento, {
      foreignKey: "tratamiento_id",
      as: "tratamiento",
    });
    EvaluacionMedica.belongsTo(models.estudiosolicitado, {
      foreignKey: "estudio_solicitado_id",
      as: "estudio_solicitado",
    });
    EvaluacionMedica.hasMany(models.recetacertificado, {
      foreignKey: "evaluacion_medica_id",
      as: "recetas_certificados",
    });
    EvaluacionMedica.hasMany(models.procedimientoprequirurgico, {
      foreignKey: "evaluacion_medica_id",
      as: "procedimientos_pre_quirurgicos",
    });
    EvaluacionMedica.hasMany(models.procedimientoenfermeria, {
      foreignKey: "evaluacion_medica_id",
      as: "procedimientos_enfermeria",
    });
    EvaluacionMedica.hasMany(models.evaluacionenfermeria, {
      foreignKey: "evaluacion_medica_id",
      as: "evaluaciones_enfermeria",
    });
    EvaluacionMedica.belongsTo(models.diagnostico, {
      foreignKey: "diagnostico_id",
      as: "diagnostico",
    });
    EvaluacionMedica.hasMany(models.turno, {
      foreignKey: "evaluacion_medica_id",
      as: "turnos",
    });
  };

  return EvaluacionMedica;
};
