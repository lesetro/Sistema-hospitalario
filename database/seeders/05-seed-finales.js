'use strict';

module.exports = {
  up: async (queryInterface, Sequelize, options) => {
    const transaction = options.transaction;
    try {
      console.log('🌱 Seeder 05: Cargando tablas finales...');

      // INTERNACIONES
      await queryInterface.bulkInsert('internaciones', [
        { id: 1, paciente_id: 1, medico_id: 1, cama_id: 2, tipo_internacion_id: 1, administrativo_id: 1, evaluacion_medica_id: 1, es_prequirurgica: false, estado_operacion: 'No aplica', estado_estudios: 'Pendientes', estado_paciente: 'Estable', fecha_inicio: '2025-11-25 10:00:00', fecha_cirugia: null, obra_social_id: 1, fecha_alta: null, lista_espera_id: 1, admision_id: 1, habitacion_id: 1, created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      // INTERVENCIONES QUIRURGICAS
      await queryInterface.bulkInsert('intervencionesquirurgicas', [
        { id: 1, paciente_id: 1, medico_id: 3, habitacion_id: 3, evaluacion_medica_id: 1, tipo_procedimiento: 'Apendicectomía', fecha_inicio: '2025-11-28 14:00:00', fecha_fin: null, lista_espera_id: 1, resultado_cirugia: null, observaciones: null, created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      // ALTAS MEDICAS
      await queryInterface.bulkInsert('altasmedicas', [
        { id: 1, paciente_id: 1, medico_id: 1, fecha_alta: '2025-11-30', tipo_alta: 'Medica', instrucciones_post_alta: 'Reposo 7 días. Control en 15 días.', internacion_id: 1, estado_paciente: 'Estable', created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      // HISTORIALES MEDICOS
      await queryInterface.bulkInsert('historialesmedicos', [
        { id: 1, paciente_id: 1, admision_id: 1, motivo_consulta_id: 1, descripcion: 'Paciente ingresa por dolor torácico. Evaluado en emergencias.', tipo_evento: 'Consulta', fecha: '2025-11-25 08:30:00', created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      // FACTURAS
      await queryInterface.bulkInsert('facturas', [
        { id: 1, paciente_id: 1, monto: 15000.00, obra_social_id: 1, descripcion: 'Consulta médica, estudios y medicación', fecha_emision: '2025-11-25', estado: 'Pendiente', admision_id: 1, tipo_pago: 'Obra Social', created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      // PAGOS
      await queryInterface.bulkInsert('pagos', [
        { id: 1, paciente_id: 1, factura_id: 1, obra_social_id: 1, monto: 15000.00, fecha: '2025-11-25', metodo: 'Obra Social', estado: 'Completado', motivo_rechazo: null, created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      // SOLICITUDES DERIVACIONES
      await queryInterface.bulkInsert('solicitudesderivaciones', [
        { id: 1, paciente_id: 2, origen_id: 1, destino_id: 3, tipo: 'Interna', estado: 'Pendiente', fecha: '2025-11-25 15:00:00', motivo: 'Requiere internación para observación', responsable_id: null, created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      // RECETAS CERTIFICADOS
      await queryInterface.bulkInsert('recetascertificados', [
        { id: 1, paciente_id: 1, medico_id: 1, tipo: 'Receta Medica', contenido: 'Enalapril 10mg - 1 comp cada 12 hs por 30 días', fecha: '2025-11-25', evaluacion_medica_id: 1, created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      // NOTICIAS
      await queryInterface.bulkInsert('noticias', [
        { id: 1, titulo: 'Nuevo horario de atención', texto: 'A partir del 1 de diciembre, el horario de consultorios externos será de 8:00 a 20:00 hs.', fecha: '2025-11-25', autor_id: 1, created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      // NOTIFICACIONES
      await queryInterface.bulkInsert('notificaciones', [
        { id: 1, usuario_id: 8, mensaje: 'Su turno para el día 26/11 a las 09:00 hs está confirmado.', leida: false, created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      // RECLAMOS
      await queryInterface.bulkInsert('reclamos', [
        { id: 1, usuario_id: 8, texto: 'Demora excesiva en la sala de espera (más de 2 horas)', fecha: '2025-11-25', estado: 'Pendiente', created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      console.log('✅ Seeder 05: Tablas finales cargadas exitosamente');
      console.log('🎉 TODOS LOS SEEDERS COMPLETADOS');
    } catch (error) {
      console.error('❌ Error en Seeder 05:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize, options) => {
    const transaction = options.transaction;
    try {
      await queryInterface.bulkDelete('reclamos', null, { transaction });
      await queryInterface.bulkDelete('notificaciones', null, { transaction });
      await queryInterface.bulkDelete('noticias', null, { transaction });
      await queryInterface.bulkDelete('recetascertificados', null, { transaction });
      await queryInterface.bulkDelete('solicitudesderivaciones', null, { transaction });
      await queryInterface.bulkDelete('pagos', null, { transaction });
      await queryInterface.bulkDelete('facturas', null, { transaction });
      await queryInterface.bulkDelete('historialesmedicos', null, { transaction });
      await queryInterface.bulkDelete('altasmedicas', null, { transaction });
      await queryInterface.bulkDelete('intervencionesquirurgicas', null, { transaction });
      await queryInterface.bulkDelete('internaciones', null, { transaction });
      console.log('✅ Seeder 05: Revertido exitosamente');
    } catch (error) {
      console.error('❌ Error al revertir Seeder 05:', error.message);
      throw error;
    }
  }
};