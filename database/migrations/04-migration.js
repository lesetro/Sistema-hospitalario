module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable('EvaluacionesMedicas', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        paciente_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Pacientes', key: 'usuario_id' } },
        medico_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Medicos', key: 'usuario_id' } },
        tratamiento_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'Tratamientos', key: 'id' } },
        fecha: { type: Sequelize.DATE, allowNull: false },
        observaciones_diagnostico: { type: Sequelize.TEXT, allowNull: true },
        diagnostico_id: {type: Sequelize.INTEGER,allowNull: true, references: { model: "Diagnosticos", key: "id" },},
        estudio_solicitado_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: "estudios_solicitados", key: "id" },},

        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      }, { transaction, indexes: [{ fields: ['paciente_id'] }, { fields: ['medico_id'] }, { fields: ['tratamiento_id'] }] });

      await queryInterface.createTable('Diagnosticos', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        codigo: { type: Sequelize.STRING(20), allowNull: false, unique: true },
        tipoDiagnostico_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'TiposDiagnostico', key: 'id' } },
        nombre: { type: Sequelize.STRING(100), allowNull: false },
        descripcion: { type: Sequelize.TEXT, allowNull: true },

        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      }, { transaction,  indexes: [
      { fields: ['codigo'], unique: true },
      { fields: ['tipoDiagnostico_id'] },
      { fields: ['nombre'] }

    ]

  });
      await queryInterface.createTable('EstudiosSolicitados', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        paciente_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Pacientes', key: 'id' } },
        evaluacion_medica_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'EvaluacionesMedicas', key: 'id' } },
        tipo_estudio_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'TiposEstudio', key: 'id' } },
        estado: { type: Sequelize.ENUM('Pendiente', 'Realizado', 'Cancelado'), defaultValue: 'Pendiente' },
        observaciones: { type: Sequelize.TEXT, allowNull: true },

        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      }, { transaction, indexes: [
      { fields: ['evaluacion_medica_id'] },
      { fields: ['paciente_id'] },
      { fields: ['tipo_estudio_id'] },
      { fields: ['estado'] }
    ]

  });
      await queryInterface.createTable('TurnosEstudios', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        estudio_solicitado_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'EstudiosSolicitados', key: 'id' } },
        fecha: { type: Sequelize.DATEONLY, allowNull: false },
        hora: { type: Sequelize.TIME, allowNull: false },
        estado: { type: Sequelize.ENUM('Pendiente', 'Realizado', 'Cancelado'), defaultValue: 'Pendiente' },
        resultado: { type: Sequelize.TEXT, allowNull: true },

        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      }, { transaction, indexes: [
      { fields: ['estudio_solicitado_id'] },
      { fields: ['fecha', 'hora'] },
      { fields: ['estado'] }]
  });
      await queryInterface.createTable('ListasEsperas', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        paciente_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Pacientes', key: 'id' } },
        especialidad_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'Especialidades', key: 'id' } },
        prioridad: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        tipo: {type: Sequelize.ENUM("ESTUDIO", "EVALUACION", "INTERNACION", "CIRUGIA"), allowNull: false,},
        tipo_estudio_id: { type: Sequelize.INTEGER,allowNull: true, references: { model: "TiposEstudio", key: "id" },},
        estado: {  type: Sequelize.ENUM( "PENDIENTE", "ASIGNADO","CANCELADO", "COMPLETADO"), allowNull: false,defaultValue: "PENDIENTE",},
        fecha_registro: { type: Sequelize.DATE, allowNull: false },

        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      }, { transaction, indexes: [
        // Índice para búsquedas por tipo y prioridad
        {
          fields: ["tipo", "prioridad", "estado"],
        }]}
      );
      await queryInterface.createTable('EvaluacionesEnfermeria', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        paciente_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Pacientes', key: 'usuario_id' } },
        enfermero_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Enfermeros', key: 'usuario_id' } },
        medico_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Medicos', key: 'usuario_id' } },
        fecha: { type: Sequelize.DATE, allowNull: false },
        signos_vitales: { type: Sequelize.JSON, allowNull: true },
        procedimiento_pre_quirurgico_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'ProcedimientosPreQuirurgicos', key: 'id' } },
        nivel_triaje: { type: Sequelize.ENUM('Rojo', 'Amarillo', 'Verde', 'Negro'), allowNull: true },
        observaciones: { type: Sequelize.TEXT, allowNull: true },
        procedimiento_enfermeria_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'ProcedimientosEnfermeria', key: 'id' } },

        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      }, { transaction, indexes: [{ fields: ['paciente_id'] }, { fields: ['enfermero_id'] }, { fields: ['medico_id'] }, { fields: ['procedimiento_pre_quirurgico_id'] }, { fields: ['procedimiento_enfermeria_id'] }] });

      await queryInterface.createTable('ProcedimientosEnfermeria', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        evaluacion_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'EvaluacionesEnfermeria', key: 'id' } },
        tratamiento_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'Tratamientos', key: 'id' } },
        descripcion: { type: Sequelize.TEXT, allowNull: false },
        duracion_estimada: { type: Sequelize.INTEGER, allowNull: true }, 
        requiere_preparacion: { type: Sequelize.BOOLEAN, defaultValue: false },

        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      }, { transaction, indexes: [{ fields: ['evaluacion_id'] }, { fields: ['tratamiento_id'] }] }),

      await queryInterface.createTable('ProcedimientosPreQuirurgicos', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        evaluacion_medica_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'EvaluacionesMedicas', key: 'id' } },
        nombre: { type: Sequelize.STRING(100), allowNull: false }, 
        descripcion: { type: Sequelize.TEXT, allowNull: true },
        estado: { type: Sequelize.ENUM('Pendiente', 'Completado'), defaultValue: 'Pendiente' },

        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      }, { transaction, indexes: [{ fields: ['evaluacion_id'] }] }),

      await queryInterface.createTable('ControlesEnfermeria', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        evaluacion_enfermeria_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'EvaluacionesEnfermeria', key: 'id' } },
        alergias: { type: Sequelize.TEXT, allowNull: true },
        antecedentes_familiares: { type: Sequelize.TEXT, allowNull: true },
        antecedentes_personales: { type: Sequelize.TEXT, allowNull: true },
        grupo_sanguineo: { type: Sequelize.STRING, allowNull: true },
        factor_rh: { type: Sequelize.ENUM('Positivo', 'Negativo'), allowNull: true },
        peso: { type: Sequelize.FLOAT, allowNull: true },
        altura: { type: Sequelize.FLOAT, allowNull: true },
        presion_arterial: { type: Sequelize.FLOAT, allowNull: true },
        frecuencia_cardiaca: { type: Sequelize.STRING, allowNull: true },
        frecuencia_respiratoria: { type: Sequelize.INTEGER, allowNull: true },
        temperatura: { type: Sequelize.FLOAT, allowNull: true },
        nivel_oxigeno: { type: Sequelize.STRING, allowNull: true },
        nivel_glucosa: { type: Sequelize.FLOAT, allowNull: true },
        nivel_colesterol: { type: Sequelize.STRING, allowNull: true },
        nivel_trigliceridos: { type: Sequelize.STRING, allowNull: true },
        nivel_creatinina: { type: Sequelize.STRING, allowNull: true },
        nivel_urea: { type: Sequelize.STRING, allowNull: true },
        nivel_acido_urico: { type: Sequelize.STRING, allowNull: true },
        nivel_hb: { type: Sequelize.STRING, allowNull: true },
        nivel_hct: { type: Sequelize.STRING, allowNull: true },
        nivel_leucocitos: { type: Sequelize.STRING, allowNull: true },
        nivel_plaquetas: { type: Sequelize.STRING, allowNull: true },
        nivel_proteinas: { type: Sequelize.STRING, allowNull: true },
        nivel_albumina: { type: Sequelize.STRING, allowNull: true },
        nivel_globulina: { type: Sequelize.STRING, allowNull: true },
        nivel_fosfatasa: { type: Sequelize.STRING, allowNull: true },

        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      }, { transaction, indexes: [{ fields: ['evaluacion_enfermeria_id'] }] }),

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('ControlesEnfermeria', { transaction });
      await queryInterface.dropTable('ProcedimientosPreQuirurgicos', { transaction });
      await queryInterface.dropTable('ProcedimientosEnfermeria', { transaction });
      await queryInterface.dropTable('EvaluacionesEnfermeria', { transaction });
      await queryInterface.dropTable('ListasEsperas', { transaction });
      await queryInterface.dropTable('TurnosEstudios', { transaction });
      await queryInterface.dropTable('EstudiosSolicitados', { transaction });
      await queryInterface.dropTable('Diagnosticos', { transaction });
      await queryInterface.dropTable('EvaluacionesMedicas', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};