module.exports = {
  up: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkInsert('EvaluacionesMedicas', [
        {
          id: 1,
          paciente_id: 4,
          medico_id: 2,
          tratamiento_id: 1,
          fecha: '2025-05-20',
          observaciones: 'Paciente con dolor torácico',
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { transaction });

      await queryInterface.bulkInsert('Diagnosticos', [
        {
          id: 1,
          evaluacion_medica_id: 1,
          tipo_diagnostico_id: 1,
          descripcion: 'Angina de pecho',
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { transaction });

      await queryInterface.bulkInsert('EstudiosSolicitados', [
        {
          id: 1,
          evaluacion_medica_id: 1,
          tipo_estudio_id: 1,
          estado: 'Pendiente',
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { transaction });

      await queryInterface.bulkInsert('TurnosEstudios', [
        {
          id: 1,
          estudio_solicitado_id: 1,
          fecha: '2025-06-01',
          hora: '09:00',
          estado: 'Pendiente',
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { transaction });

      await queryInterface.bulkInsert('ListasEsperas', [
        {
          id: 1,
          paciente_id: 4,
          especialidad_id: 1,
          turno_id: null,
          estudio_id: 1,
          prioridad: 1,
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { transaction });

      await queryInterface.bulkInsert('EvaluacionesEnfermeria', [
        {
          id: 1,
          paciente_id: 4,
          enfermero_id: 3,
          medico_id: 2,
          fecha: '2025-05-20',
          nivel_triaje: 'Verde',
          observaciones: 'Paciente estable',
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { transaction });

      await queryInterface.bulkInsert('ProcedimientosEnfermeria', [
        {
          id: 1,
          evaluacion_id: 1,
          tratamiento_id: 1,
          descripcion: 'Administración de analgésicos',
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { transaction });

      await queryInterface.bulkInsert('ProcedimientosPreQuirurgicos', [
        {
          id: 1,
          evaluacion_id: 1,
          descripcion: 'Preparación para cirugía cardíaca',
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { transaction });

      await queryInterface.bulkInsert('ControlesEnfermeria', [
        {
          id: 1,
          evaluacion_enfermeria_id: 1,
          alergias: 'Ninguna',
          peso: 70.5,
          altura: 1.65,
          presion_arterial: 120.0,
          frecuencia_cardiaca: 80,
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkDelete('ControlesEnfermeria', null, { transaction });
      await queryInterface.bulkDelete('ProcedimientosPreQuirurgicos', null, { transaction });
      await queryInterface.bulkDelete('ProcedimientosEnfermeria', null, { transaction });
      await queryInterface.bulkDelete('EvaluacionesEnfermeria', null, { transaction });
      await queryInterface.bulkDelete('ListasEsperas', null, { transaction });
      await queryInterface.bulkDelete('TurnosEstudios', null, { transaction });
      await queryInterface.bulkDelete('EstudiosSolicitados', null, { transaction });
      await queryInterface.bulkDelete('Diagnosticos', null, { transaction });
      await queryInterface.bulkDelete('EvaluacionesMedicas', null, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};