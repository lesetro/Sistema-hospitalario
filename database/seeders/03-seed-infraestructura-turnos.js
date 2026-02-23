
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
        // Sector 3: Urgencias (habitaciones 1-11, 17-19)
        { id: 1, tipo_de_servicio_id: 6, tipo: 'Doble', numero: '008', sector_id: 3, sexo_permitido: 'Masculino', created_at: new Date(), updated_at: new Date() },
        { id: 2, tipo_de_servicio_id: 6, tipo: 'Doble', numero: '009', sector_id: 3, sexo_permitido: 'Mixto', created_at: new Date(), updated_at: new Date() },
        { id: 11, tipo_de_servicio_id: 6, tipo: 'Doble', numero: '010', sector_id: 3, sexo_permitido: 'Mixto', created_at: new Date(), updated_at: new Date() },
        { id: 12, tipo_de_servicio_id: 6, tipo: 'Doble', numero: '011', sector_id: 3, sexo_permitido: 'Mixto', created_at: new Date(), updated_at: new Date() },
        { id: 13, tipo_de_servicio_id: 6, tipo: 'Doble', numero: '012', sector_id: 3, sexo_permitido: 'Mixto', created_at: new Date(), updated_at: new Date() },
        { id: 14, tipo_de_servicio_id: 6, tipo: 'Individual', numero: '013', sector_id: 3, sexo_permitido: 'Mixto', created_at: new Date(), updated_at: new Date() },
        { id: 15, tipo_de_servicio_id: 6, tipo: 'Individual', numero: '014', sector_id: 3, sexo_permitido: 'Mixto', created_at: new Date(), updated_at: new Date() },
        { id: 16, tipo_de_servicio_id: 6, tipo: 'Individual', numero: '015', sector_id: 3, sexo_permitido: 'Mixto', created_at: new Date(), updated_at: new Date() },
        { id: 17, tipo_de_servicio_id: 6, tipo: 'Individual', numero: '016', sector_id: 3, sexo_permitido: 'Mixto', created_at: new Date(), updated_at: new Date() },
        { id: 18, tipo_de_servicio_id: 7, tipo: 'Doble', numero: '017', sector_id: 3, sexo_permitido: 'Mixto', created_at: new Date(), updated_at: new Date() },
        { id: 19, tipo_de_servicio_id: 7, tipo: 'Doble', numero: '018', sector_id: 3, sexo_permitido: 'Mixto', created_at: new Date(), updated_at: new Date() },
        
        // Sector 4: Terapia Intensiva (habitaciones 3, 20)
        { id: 3, tipo_de_servicio_id: 9, tipo: 'Individual', numero: '019', sector_id: 1, sexo_permitido: 'Mixto', created_at: new Date(), updated_at: new Date() },
        { id: 20, tipo_de_servicio_id: 8, tipo: 'Individual', numero: '018', sector_id: 4, sexo_permitido: 'Mixto', created_at: new Date(), updated_at: new Date() },
        
        // Sector 2: Consultorios Externos (habitaciones 4-6)
        { id: 4, tipo_de_servicio_id: 3, tipo: 'Individual', numero: '001', sector_id: 2, sexo_permitido: 'Mixto', created_at: new Date(), updated_at: new Date() },
        { id: 5, tipo_de_servicio_id: 4, tipo: 'Individual', numero: '002', sector_id: 2, sexo_permitido: 'Mixto', created_at: new Date(), updated_at: new Date() },
        { id: 6, tipo_de_servicio_id: 5, tipo: 'Individual', numero: '003', sector_id: 2, sexo_permitido: 'Mixto', created_at: new Date(), updated_at: new Date() },
        
        // Sector 1: Guardia (habitaciones 7-8)
        { id: 7, tipo_de_servicio_id: 1, tipo: 'Colectiva', numero: '004', sector_id: 1, sexo_permitido: 'Mixto', created_at: new Date(), updated_at: new Date() },
        { id: 8, tipo_de_servicio_id: 2, tipo: 'Colectiva', numero: '005', sector_id: 1, sexo_permitido: 'Mixto', created_at: new Date(), updated_at: new Date() },
        
        // Sector 7: Cirugía (habitaciones 9-10)
        { id: 9, tipo_de_servicio_id: 14, tipo: 'Individual', numero: '006', sector_id: 7, sexo_permitido: 'Mixto', created_at: new Date(), updated_at: new Date() },
        { id: 10, tipo_de_servicio_id: 15, tipo: 'Individual', numero: '007', sector_id: 7, sexo_permitido: 'Mixto', created_at: new Date(), updated_at: new Date() },
        
        // Sector 6: Pediatría (habitaciones 21-22)
        { id: 21, tipo_de_servicio_id: 12, tipo: 'Colectiva', numero: '020', sector_id: 6, sexo_permitido: 'Mixto', created_at: new Date(), updated_at: new Date() },
        { id: 22, tipo_de_servicio_id: 13, tipo: 'Colectiva', numero: '021', sector_id: 6, sexo_permitido: 'Mixto', created_at: new Date(), updated_at: new Date() },
        
        // Sector 5: Maternidad (habitaciones 23-24)
        { id: 23, tipo_de_servicio_id: 10, tipo: 'Colectiva', numero: '023', sector_id: 5, sexo_permitido: 'Mixto', created_at: new Date(), updated_at: new Date() },
        { id: 24, tipo_de_servicio_id: 11, tipo: 'Colectiva', numero: '024', sector_id: 5, sexo_permitido: 'Mixto', created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      // CAMAS
      await queryInterface.bulkInsert('camas', [
      { id: 1, habitacion_id: 1, numero: '101-A', sexo_ocupante: null, estado: 'Libre', fecha_fin_limpieza: null, created_at: new Date(), updated_at: new Date() },
      { id: 2, habitacion_id: 1, numero: '101-B', sexo_ocupante: 'Masculino', estado: 'Ocupada', fecha_fin_limpieza: null, created_at: new Date(), updated_at: new Date() },
      { id: 3, habitacion_id: 2, numero: '102-A', sexo_ocupante: 'Masculino', estado: 'Ocupada', fecha_fin_limpieza: null, created_at: new Date(), updated_at: new Date() },
      { id: 4, habitacion_id: 3, numero: '201-U', sexo_ocupante: null, estado: 'Libre', fecha_fin_limpieza: null, created_at: new Date(), updated_at: new Date() },
      { id: 5, habitacion_id: 4, numero: '001-A', sexo_ocupante: null, estado: 'Libre', fecha_fin_limpieza: null, created_at: new Date(), updated_at: new Date() },
      { id: 6, habitacion_id: 5, numero: '002-A', sexo_ocupante: null, estado: 'Libre', fecha_fin_limpieza: null, created_at: new Date(), updated_at: new Date() },
      { id: 7, habitacion_id: 6, numero: '003-A', sexo_ocupante: null, estado: 'Libre', fecha_fin_limpieza: null, created_at: new Date(), updated_at: new Date() },
      { id: 8, habitacion_id: 7, numero: '004-01', sexo_ocupante: null, estado: 'Libre', fecha_fin_limpieza: null, created_at: new Date(), updated_at: new Date() },
      { id: 9, habitacion_id: 7, numero: '004-02', sexo_ocupante: null, estado: 'Libre', fecha_fin_limpieza: null, created_at: new Date(), updated_at: new Date() },
      { id: 10, habitacion_id: 7, numero: '004-03', sexo_ocupante: null, estado: 'Libre', fecha_fin_limpieza: null, created_at: new Date(), updated_at: new Date() },
      { id: 11, habitacion_id: 7, numero: '004-04', sexo_ocupante: null, estado: 'Libre', fecha_fin_limpieza: null, created_at: new Date(), updated_at: new Date() },
      { id: 12, habitacion_id: 7, numero: '004-05', sexo_ocupante: null, estado: 'Libre', fecha_fin_limpieza: null, created_at: new Date(), updated_at: new Date() },
      { id: 13, habitacion_id: 7, numero: '004-06', sexo_ocupante: null, estado: 'Libre', fecha_fin_limpieza: null, created_at: new Date(), updated_at: new Date() },
      { id: 14, habitacion_id: 7, numero: '004-07', sexo_ocupante: null, estado: 'Libre', fecha_fin_limpieza: null, created_at: new Date(), updated_at: new Date() },
      { id: 15, habitacion_id: 7, numero: '004-08', sexo_ocupante: null, estado: 'Libre', fecha_fin_limpieza: null, created_at: new Date(), updated_at: new Date() },
      { id: 16, habitacion_id: 7, numero: '004-09', sexo_ocupante: null, estado: 'Libre', fecha_fin_limpieza: null, created_at: new Date(), updated_at: new Date() },
      { id: 17, habitacion_id: 7, numero: '004-10', sexo_ocupante: null, estado: 'Libre', fecha_fin_limpieza: null, created_at: new Date(), updated_at: new Date() },
      { id: 18, habitacion_id: 8, numero: '005-01', sexo_ocupante: null, estado: 'Libre', fecha_fin_limpieza: null, created_at: new Date(), updated_at: new Date() },
      { id: 19, habitacion_id: 8, numero: '005-02', sexo_ocupante: null, estado: 'Libre', fecha_fin_limpieza: null, created_at: new Date(), updated_at: new Date() },
      { id: 20, habitacion_id: 8, numero: '005-03', sexo_ocupante: null, estado: 'Libre', fecha_fin_limpieza: null, created_at: new Date(), updated_at: new Date() },
      { id: 21, habitacion_id: 8, numero: '005-04', sexo_ocupante: null, estado: 'Libre', fecha_fin_limpieza: null, created_at: new Date(), updated_at: new Date() },
      { id: 22, habitacion_id: 8, numero: '005-05', sexo_ocupante: null, estado: 'Libre', fecha_fin_limpieza: null, created_at: new Date(), updated_at: new Date() },
      { id: 23, habitacion_id: 8, numero: '005-06', sexo_ocupante: null, estado: 'Libre', fecha_fin_limpieza: null, created_at: new Date(), updated_at: new Date() },
      { id: 24, habitacion_id: 9, numero: '006-01', sexo_ocupante: null, estado: 'Libre', fecha_fin_limpieza: null, created_at: new Date(), updated_at: new Date() },
      { id: 25, habitacion_id: 9, numero: '006-02', sexo_ocupante: null, estado: 'Libre', fecha_fin_limpieza: null, created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      // LISTAS DE ESPERA
      await queryInterface.bulkInsert('turnos', [
  { 
    id: 1, 
    fecha: '2025-11-26', 
    hora_inicio: '09:00:00', 
    hora_fin: '09:30:00', 
    estado: 'CONFIRMADO', 
    paciente_id: 1, 
    medico_id: 1, 
    usuario_id: 8, 
    sector_id: 2, 
    tipo_servicio_id: 3, 
    created_at: new Date(), 
    updated_at: new Date() 
  },
  { 
    id: 2, 
    fecha: '2025-11-27', 
    hora_inicio: '10:00:00', 
    hora_fin: '10:30:00', 
    estado: 'PENDIENTE', 
    paciente_id: 2, 
    medico_id: null, 
    usuario_id: 9, 
    sector_id: 7, 
    tipo_servicio_id: 14, 
    created_at: new Date(), 
    updated_at: new Date() 
  }
], { transaction });

      
      await queryInterface.bulkInsert('listasesperas', [
  { 
    id: 1, 
    paciente_id: 2, 
    tipo_turno_id: 1, // Consulta
    tipo_estudio_id: null, 
    especialidad_id: 1, // Clínica Médica
    prioridad: 'MEDIA', 
    estado: 'PENDIENTE', 
    habitacion_id: null, 
    creador_tipo: 'ADMINISTRATIVO', 
    tipo_servicio_id: 3, 
    creador_id: 1, 
    fecha_registro: '2025-11-20', 
    turno_id: null,
    medico_id: null,  // ← AGREGAR si falta
    created_at: new Date(), 
    updated_at: new Date() 
  },
  { 
    id: 2, 
    paciente_id: 3, 
    tipo_turno_id: 2, // Estudio
    tipo_estudio_id: 1, // Rayos X de Tórax
    especialidad_id: null, 
    prioridad: 'ALTA', 
    estado: 'PENDIENTE', 
    habitacion_id: null, 
    creador_tipo: 'ADMINISTRATIVO', 
    tipo_servicio_id: 14, // ← AGREGADO: Radiografía (ID 14)
    creador_id: 2, 
    fecha_registro: '2025-11-22', 
    turno_id: null,
    medico_id: null,  // ← AGREGAR si falta
    created_at: new Date(), 
    updated_at: new Date() 
  }
      ], { transaction });


      // ADMISIONES
      await queryInterface.bulkInsert('admisiones', [
        { 
          id: 1, 
          paciente_id: 1, 
          administrativo_id: 1, 
          estado: 'Completada', 
          fecha: '2025-11-25 08:30:00', 
          medico_id: 1, 
          sector_id: 2, 
          motivo_id: 1, 
          forma_ingreso_id: 4, 
          turno_id: 1,  
          especialidad_id: 1, 
          tipo_estudio_id: null, 
          motivo_consulta_id: null, 
          created_at: new Date(), 
          updated_at: new Date() 
        }
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