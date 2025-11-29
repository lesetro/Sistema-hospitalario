
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize, options) => {
    const transaction = options.transaction;
    try {
      console.log('🌱 Seeder 03: Cargando infraestructura y turnos...');

      // DIAGNOSTICOS
      await queryInterface.bulkInsert('diagnosticos', [
        { id: 1, codigo: 'I10', tipo_diagnostico_id: 1, nombre: 'Hipertensión Esencial', descripcion: 'Presión arterial elevada', created_at: new Date(), updated_at: new Date() },
        { id: 2, codigo: 'E11', tipo_diagnostico_id: 1, nombre: 'Diabetes Mellitus Tipo 2', descripcion: 'Trastorno metabólico', created_at: new Date(), updated_at: new Date() },
        { id: 3, codigo: 'J18', tipo_diagnostico_id: 1, nombre: 'Neumonía', descripcion: 'Infección pulmonar', created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      // HABITACIONES
      await queryInterface.bulkInsert('habitaciones', [
        { id: 1, tipo_de_servicio_id: 1, tipo: 'Colectiva', numero: '101', sector_id: 3, sexo_permitido: 'Masculino', created_at: new Date(), updated_at: new Date() },
        { id: 2, tipo_de_servicio_id: 1, tipo: 'Colectiva', numero: '102', sector_id: 3, sexo_permitido: 'Femenino', created_at: new Date(), updated_at: new Date() },
        { id: 3, tipo_de_servicio_id: 2, tipo: 'Individual', numero: '201', sector_id: 4, sexo_permitido: 'Mixto', created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      // CAMAS
      await queryInterface.bulkInsert('camas', [
        { id: 1, habitacion_id: 1, numero: '101-A', sexo_ocupante: null, estado: 'Libre', fecha_fin_limpieza: null, created_at: new Date(), updated_at: new Date() },
        { id: 2, habitacion_id: 1, numero: '101-B', sexo_ocupante: 'Masculino', estado: 'Ocupada', fecha_fin_limpieza: null, created_at: new Date(), updated_at: new Date() },
        { id: 3, habitacion_id: 2, numero: '102-A', sexo_ocupante: 'Femenino', estado: 'Ocupada', fecha_fin_limpieza: null, created_at: new Date(), updated_at: new Date() },
        { id: 4, habitacion_id: 3, numero: '201-U', sexo_ocupante: null, estado: 'Libre', fecha_fin_limpieza: null, created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      // LISTAS DE ESPERA
      await queryInterface.bulkInsert('listasesperas', [
        { id: 1, paciente_id: 2, tipo_turno_id: 1, tipo_estudio_id: null, especialidad_id: 1, prioridad: 'MEDIA', estado: 'PENDIENTE', habitacion_id: null, creador_tipo: 'ADMINISTRATIVO', creador_id: 1, fecha_registro: '2025-11-20', turno_id: null, created_at: new Date(), updated_at: new Date() },
        { id: 2, paciente_id: 3, tipo_turno_id: 2, tipo_estudio_id: 1, especialidad_id: null, prioridad: 'ALTA', estado: 'PENDIENTE', habitacion_id: null, creador_tipo: 'ADMINISTRATIVO', creador_id: 2, fecha_registro: '2025-11-22', turno_id: null, created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      // TURNOS
      await queryInterface.bulkInsert('turnos', [
        { id: 1, fecha: '2025-11-26', hora_inicio: '09:00:00', hora_fin: '09:30:00', estado: 'CONFIRMADO', paciente_id: 1, medico_id: 1, usuario_id: 8, sector_id: 2, created_at: new Date(), updated_at: new Date() },
        { id: 2, fecha: '2025-11-27', hora_inicio: '10:00:00', hora_fin: '10:30:00', estado: 'PENDIENTE', paciente_id: 2, medico_id: null, usuario_id: 9, sector_id: 7, created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      // ADMISIONES
      await queryInterface.bulkInsert('admisiones', [
        { id: 1, paciente_id: 1, administrativo_id: 1, estado: 'Completada', fecha: '2025-11-25 08:30:00', medico_id: 1, sector_id: 2, motivo_id: 1, forma_ingreso_id: 4, turno_id: 1, especialidad_id: 1, tipo_estudio_id: null, motivo_consulta_id: null, created_at: new Date(), updated_at: new Date() },
        { id: 2, paciente_id: 2, administrativo_id: 2, estado: 'Pendiente', fecha: '2025-11-25 14:00:00', medico_id: null, sector_id: 1, motivo_id: 2, forma_ingreso_id: 3, turno_id: null, especialidad_id: null, tipo_estudio_id: null, motivo_consulta_id: null, created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      console.log('✅ Seeder 03: Infraestructura y turnos cargados exitosamente');
    } catch (error) {
      console.error('❌ Error en Seeder 03:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize, options) => {
    const transaction = options.transaction;
    try {
      await queryInterface.bulkDelete('admisiones', null, { transaction });
      await queryInterface.bulkDelete('turnos', null, { transaction });
      await queryInterface.bulkDelete('listasesperas', null, { transaction });
      await queryInterface.bulkDelete('camas', null, { transaction });
      await queryInterface.bulkDelete('habitaciones', null, { transaction });
      await queryInterface.bulkDelete('diagnosticos', null, { transaction });
      console.log('✅ Seeder 03: Revertido exitosamente');
    } catch (error) {
      console.error('❌ Error al revertir Seeder 03:', error.message);
      throw error;
    }
  }
};