
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize, options) => {
    const transaction = options.transaction;
    try {
      console.log('🌱 Seeder 04: Cargando evaluaciones...');

      // EVALUACIONES MEDICAS
      await queryInterface.bulkInsert('evaluacionesmedicas', [
        { id: 1, paciente_id: 1, medico_id: 1, fecha: '2025-11-25 09:15:00', diagnostico_id: 1, turno_id: null, observaciones_diagnostico: 'Hipertensión controlada con medicación', tratamiento_id: 1, created_at: new Date(), updated_at: new Date() },
        { id: 2, paciente_id: 3, medico_id: 2, fecha: '2025-11-25 10:00:00', diagnostico_id: 2, turno_id: null, observaciones_diagnostico: 'Diabetes tipo 2. Ajuste de insulina', tratamiento_id: 2, created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      // ESTUDIOS SOLICITADOS
      await queryInterface.bulkInsert('estudiossolicitados', [
        { id: 1, paciente_id: 1, evaluacion_medica_id: 1, tipo_estudio_id: 1, urgencia: 'Normal', estado: 'Pendiente', observaciones: 'Radiografía de tórax de control', created_at: new Date(), updated_at: new Date() },
        { id: 2, paciente_id: 3, evaluacion_medica_id: 2, tipo_estudio_id: 4, urgencia: 'Alta', estado: 'Pendiente', observaciones: 'Glucemia en ayunas urgente', created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      // TURNOS ESTUDIOS
      await queryInterface.bulkInsert('turnosestudios', [
        { id: 1, estudio_solicitado_id: 1, fecha: '2025-11-27', hora: '08:00:00', estado: 'Pendiente', resultado: null, lista_espera_id: 2, created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      // PROCEDIMIENTOS PRE QUIRURGICOS
      await queryInterface.bulkInsert('procedimientosprequirurgicos', [
        { id: 1, evaluacion_medica_id: 1, nombre: 'Preparación Pre-Quirúrgica', descripcion: 'Ayuno de 8 horas', estado: 'Pendiente', created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      // PROCEDIMIENTOS ENFERMERIA
      await queryInterface.bulkInsert('procedimientosenfermeria', [
        { id: 1, evaluacion_medica_id: 1, tratamiento_id: 3, nombre: 'Administración de Suero', descripcion: 'Solución fisiológica 1000ml IV', duracion_estimada: 120, requiere_preparacion: false, created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      // EVALUACIONES ENFERMERIA
      await queryInterface.bulkInsert('evaluacionesenfermeria', [
        { id: 1, paciente_id: 1, enfermero_id: 1, medico_id: 1, fecha: '2025-11-25 09:00:00', signos_vitales: 'PA: 130/85, FC: 78, FR: 16, T: 36.5°C', procedimiento_pre_quirurgico_id: null, nivel_triaje: 'Verde', evaluacion_medica_id: 1, observaciones: 'Paciente estable', procedimiento_enfermeria_id: 1, tipo_egreso: 'PENDIENTE_EVALUACION', lista_espera_generada_id: null, created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      // CONTROLES ENFERMERIA
      await queryInterface.bulkInsert('controlesenfermeria', [
        { id: 1, evaluacion_enfermeria_id: 1, alergias: 'Penicilina', evaluacion_medica_id: 1, antecedentes_familiares: 'Padre: Hipertensión', antecedentes_personales: 'Hipertensión hace 5 años', grupo_sanguineo: 'O', factor_rh: 'Positivo', peso: 78.5, altura: 1.75, presion_arterial: '130/85', frecuencia_cardiaca: '78', frecuencia_respiratoria: 16, temperatura: 36.5, nivel_oxigeno: '98%', nivel_glucosa: 105.0, created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      console.log('✅ Seeder 04: Evaluaciones cargadas exitosamente');
    } catch (error) {
      console.error('❌ Error en Seeder 04:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize, options) => {
    const transaction = options.transaction;
    try {
      await queryInterface.bulkDelete('controlesenfermeria', null, { transaction });
      await queryInterface.bulkDelete('evaluacionesenfermeria', null, { transaction });
      await queryInterface.bulkDelete('procedimientosenfermeria', null, { transaction });
      await queryInterface.bulkDelete('procedimientosprequirurgicos', null, { transaction });
      await queryInterface.bulkDelete('turnosestudios', null, { transaction });
      await queryInterface.bulkDelete('estudiossolicitados', null, { transaction });
      await queryInterface.bulkDelete('evaluacionesmedicas', null, { transaction });
      console.log('✅ Seeder 04: Revertido exitosamente');
    } catch (error) {
      console.error('❌ Error al revertir Seeder 04:', error.message);
      throw error;
    }
  }
};