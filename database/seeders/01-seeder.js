module.exports = {
  up: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkInsert('Roles', [
        { id: 1, nombre: 'Administrativo', created_at: new Date(), updated_at: new Date() },
        { id: 2, nombre: 'Medico', created_at: new Date(), updated_at: new Date() },
        { id: 3, nombre: 'Enfermero', created_at: new Date(), updated_at: new Date() },
        { id: 4, nombre: 'Paciente', created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      await queryInterface.bulkInsert('TiposDeServicio', [
        { id: 1, nombre: 'General', descripcion: 'Servicio general' },
        { id: 2, nombre: 'Quirurgico', descripcion: 'Servicio quirúrgico' }
      ], { transaction });

      await queryInterface.bulkInsert('TiposInternacion', [
        { id: 1, nombre: 'UTI', descripcion: 'Unidad de Terapia Intensiva' },
        { id: 2, nombre: 'General', descripcion: 'Internación general' }
      ], { transaction });

      await queryInterface.bulkInsert('TiposDiagnostico', [
        { id: 1, nombre: 'Primario', descripcion: 'Diagnóstico principal' },
        { id: 2, nombre: 'Secundario', descripcion: 'Diagnóstico secundario' }
      ], { transaction });

      await queryInterface.bulkInsert('TiposEstudio', [
        { id: 1, nombre: 'Radiografía', descripcion: 'Estudio de imágenes' },
        { id: 2, nombre: 'Laboratorio', descripcion: 'Análisis clínicos' }
      ], { transaction });

      await queryInterface.bulkInsert('TiposTurno', [
        { id: 1, nombre: 'Consulta', descripcion: 'Turno para consulta médica' },
        { id: 2, nombre: 'Estudio', descripcion: 'Turno para estudio' }
      ], { transaction });

      await queryInterface.bulkInsert('MotivosAdmision', [
        { id: 1, nombre: 'Cirugía', descripcion: 'Admisión para procedimiento quirúrgico' },
        { id: 2, nombre: 'Consulta', descripcion: 'Admisión para evaluación médica' }
      ], { transaction });

      await queryInterface.bulkInsert('FormasIngreso', [
        { id: 1, nombre: 'Urgencia', descripcion: 'Ingreso por emergencia' },
        { id: 2, nombre: 'Programado', descripcion: 'Ingreso planificado' }
      ], { transaction });

      await queryInterface.bulkInsert('MotivosConsultas', [
        { id: 1, nombre: 'Dolor torácico', descripcion: 'Consulta por dolor en el pecho', created_at: new Date(), updated_at: new Date() },
        { id: 2, nombre: 'Fractura', descripcion: 'Consulta por lesión ósea', created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      await queryInterface.bulkInsert('ObrasSociales', [
        { id: 1, nombre: 'OSDE', descripcion: 'Obra social privada', created_at: new Date(), updated_at: new Date() },
        { id: 2, nombre: 'Swiss Medical', descripcion: 'Obra social privada', created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      await queryInterface.bulkInsert('Especialidades', [
        { id: 1, nombre: 'Cardiología', descripcion: 'Especialidad cardíaca', created_at: new Date(), updated_at: new Date() },
        { id: 2, nombre: 'Traumatología', descripcion: 'Especialidad ósea', created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      await queryInterface.bulkInsert('Sectores', [
        { id: 1, nombre: 'Emergencias', descripcion: 'Sector de urgencias', created_at: new Date(), updated_at: new Date() },
        { id: 2, nombre: 'Traumatología', descripcion: 'Sector traumatológico', created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      await queryInterface.bulkInsert('Tratamientos', [
        { id: 1, nombre: 'Antibióticos', descripcion: 'Tratamiento con antibióticos', created_at: new Date(), updated_at: new Date() },
        { id: 2, nombre: 'Fisioterapia', descripcion: 'Rehabilitación física', created_at: new Date(), updated_at: new Date() }
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
      await queryInterface.bulkDelete('Tratamientos', null, { transaction });
      await queryInterface.bulkDelete('Sectores', null, { transaction });
      await queryInterface.bulkDelete('Especialidades', null, { transaction });
      await queryInterface.bulkDelete('ObrasSociales', null, { transaction });
      await queryInterface.bulkDelete('MotivosConsultas', null, { transaction });
      await queryInterface.bulkDelete('FormasIngreso', null, { transaction });
      await queryInterface.bulkDelete('MotivosAdmision', null, { transaction });
      await queryInterface.bulkDelete('TiposTurno', null, { transaction });
      await queryInterface.bulkDelete('TiposEstudio', null, { transaction });
      await queryInterface.bulkDelete('TiposDiagnostico', null, { transaction });
      await queryInterface.bulkDelete('TiposInternacion', null, { transaction });
      await queryInterface.bulkDelete('TiposDeServicio', null, { transaction });
      await queryInterface.bulkDelete('Roles', null, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};