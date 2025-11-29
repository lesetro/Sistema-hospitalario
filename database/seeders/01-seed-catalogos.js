
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize, options) => {
    const transaction = options.transaction;
    try {
      console.log('🌱 Seeder 01: Cargando catálogos...');

      // ===================================
      // ROLES
      // ===================================
      await queryInterface.bulkInsert('roles', [
        { id: 1, nombre: 'Administrativo', descripcion: 'Personal administrativo del hospital', created_at: new Date(), updated_at: new Date() },
        { id: 2, nombre: 'Medico', descripcion: 'Médicos profesionales', created_at: new Date(), updated_at: new Date() },
        { id: 3, nombre: 'Enfermero', descripcion: 'Personal de enfermería', created_at: new Date(), updated_at: new Date() },
        { id: 4, nombre: 'Paciente', descripcion: 'Pacientes del hospital', created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      // ===================================
      // SECTORES
      // ===================================
      await queryInterface.bulkInsert('sectores', [
        { id: 1, nombre: 'Emergencias', descripcion: 'Sector de urgencias y emergencias', created_at: new Date(), updated_at: new Date() },
        { id: 2, nombre: 'Consultorios Externos', descripcion: 'Consultas programadas', created_at: new Date(), updated_at: new Date() },
        { id: 3, nombre: 'Internación', descripcion: 'Hospitalización general', created_at: new Date(), updated_at: new Date() },
        { id: 4, nombre: 'Quirófano', descripcion: 'Área quirúrgica', created_at: new Date(), updated_at: new Date() },
        { id: 5, nombre: 'UTI', descripcion: 'Unidad de Terapia Intensiva', created_at: new Date(), updated_at: new Date() },
        { id: 6, nombre: 'Laboratorio', descripcion: 'Análisis clínicos', created_at: new Date(), updated_at: new Date() },
        { id: 7, nombre: 'Imagenología', descripcion: 'Estudios de imagen', created_at: new Date(), updated_at: new Date() },
        { id: 8, nombre: 'Administración', descripcion: 'Oficinas administrativas', created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      // ===================================
      // ESPECIALIDADES
      // ===================================
      await queryInterface.bulkInsert('especialidades', [
        { id: 1, nombre: 'Clínica Médica', descripcion: 'Medicina general', created_at: new Date(), updated_at: new Date() },
        { id: 2, nombre: 'Cardiología', descripcion: 'Enfermedades del corazón', created_at: new Date(), updated_at: new Date() },
        { id: 3, nombre: 'Traumatología', descripcion: 'Lesiones y fracturas', created_at: new Date(), updated_at: new Date() },
        { id: 4, nombre: 'Pediatría', descripcion: 'Medicina infantil', created_at: new Date(), updated_at: new Date() },
        { id: 5, nombre: 'Ginecología', descripcion: 'Salud femenina', created_at: new Date(), updated_at: new Date() },
        { id: 6, nombre: 'Cirugía General', descripcion: 'Procedimientos quirúrgicos', created_at: new Date(), updated_at: new Date() },
        { id: 7, nombre: 'Neurología', descripcion: 'Sistema nervioso', created_at: new Date(), updated_at: new Date() },
        { id: 8, nombre: 'Dermatología', descripcion: 'Enfermedades de la piel', created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      // ===================================
      // OBRAS SOCIALES
      // ===================================
      await queryInterface.bulkInsert('obrassociales', [
        { id: 1, nombre: 'OSDE', descripcion: 'Obra Social de Empleados', created_at: new Date(), updated_at: new Date() },
        { id: 2, nombre: 'Swiss Medical', descripcion: 'Medicina prepaga', created_at: new Date(), updated_at: new Date() },
        { id: 3, nombre: 'PAMI', descripcion: 'Programa de Atención Médica Integral', created_at: new Date(), updated_at: new Date() },
        { id: 4, nombre: 'Medifé', descripcion: 'Medicina prepaga', created_at: new Date(), updated_at: new Date() },
        { id: 5, nombre: 'Particular', descripcion: 'Sin cobertura', created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      // ===================================
      // TIPOS DE SERVICIO
      // ===================================
      await queryInterface.bulkInsert('tiposdeservicio', [
        { id: 1, nombre: 'Clínico', descripcion: 'Servicio de clínica médica', created_at: new Date(), updated_at: new Date() },
        { id: 2, nombre: 'Quirúrgico', descripcion: 'Servicio quirúrgico', created_at: new Date(), updated_at: new Date() },
        { id: 3, nombre: 'Cuidados Intensivos', descripcion: 'UTI y cuidados críticos', created_at: new Date(), updated_at: new Date() },
        { id: 4, nombre: 'Ambulatorio', descripcion: 'Atención sin internación', created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      // ===================================
      // TIPOS DE INTERNACION
      // ===================================
      await queryInterface.bulkInsert('tiposinternacion', [
        { id: 1, nombre: 'Clínica', descripcion: 'Internación clínica general', tipo_habitacion: 'Colectiva', cantidad_camas: 4, cantidad_enfermeros: 2, estado_paciente: 'Sin_Evaluar', created_at: new Date(), updated_at: new Date() },
        { id: 2, nombre: 'Quirúrgica', descripcion: 'Post-operatorio', tipo_habitacion: 'Doble', cantidad_camas: 2, cantidad_enfermeros: 3, estado_paciente: 'Sin_Evaluar', created_at: new Date(), updated_at: new Date() },
        { id: 3, nombre: 'UTI', descripcion: 'Cuidados intensivos', tipo_habitacion: 'Individual', cantidad_camas: 1, cantidad_enfermeros: 5, estado_paciente: 'Critico', created_at: new Date(), updated_at: new Date() },
        { id: 4, nombre: 'Pediatría', descripcion: 'Internación pediátrica', tipo_habitacion: 'Colectiva', cantidad_camas: 4, cantidad_enfermeros: 2, estado_paciente: 'Sin_Evaluar', created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      // ===================================
      // TIPOS DE DIAGNOSTICO
      // ===================================
      await queryInterface.bulkInsert('tiposdiagnostico', [
        { id: 1, nombre: 'Primario', descripcion: 'Diagnóstico principal', sistema_clasificacion: 'CIE-10' },
        { id: 2, nombre: 'Secundario', descripcion: 'Diagnóstico complementario', sistema_clasificacion: 'CIE-10' },
        { id: 3, nombre: 'Diferencial', descripcion: 'Diagnóstico por descarte', sistema_clasificacion: 'CIE-10' }
      ], { transaction });

      // ===================================
      // TIPOS DE ESTUDIO
      // ===================================
      await queryInterface.bulkInsert('tiposestudio', [
        { id: 1, nombre: 'Radiografía de Tórax', categoria: 'Imagenología', requiere_ayuno: false, created_at: new Date(), updated_at: new Date() },
        { id: 2, nombre: 'Ecografía Abdominal', categoria: 'Imagenología', requiere_ayuno: true, created_at: new Date(), updated_at: new Date() },
        { id: 3, nombre: 'Hemograma Completo', categoria: 'Laboratorio', requiere_ayuno: false, created_at: new Date(), updated_at: new Date() },
        { id: 4, nombre: 'Glucemia', categoria: 'Laboratorio', requiere_ayuno: true, created_at: new Date(), updated_at: new Date() },
        { id: 5, nombre: 'Electrocardiograma', categoria: 'Fisiológico', requiere_ayuno: false, created_at: new Date(), updated_at: new Date() },
        { id: 6, nombre: 'Tomografía Computada', categoria: 'Imagenología', requiere_ayuno: false, created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      // ===================================
      // TIPOS DE TURNO
      // ===================================
      await queryInterface.bulkInsert('tipos_turno', [
        { id: 1, nombre: 'Consulta', descripcion: 'Consulta médica general', requiere_especialidad: true, requiere_estudio: false, created_at: new Date(), updated_at: new Date() },
        { id: 2, nombre: 'Estudio', descripcion: 'Realización de estudios', requiere_especialidad: false, requiere_estudio: true, created_at: new Date(), updated_at: new Date() },
        { id: 3, nombre: 'Guardia', descripcion: 'Atención de urgencia', requiere_especialidad: false, requiere_estudio: false, created_at: new Date(), updated_at: new Date() },
        { id: 4, nombre: 'Programado', descripcion: 'Procedimiento programado', requiere_especialidad: true, requiere_estudio: false, created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      // ===================================
      // MOTIVOS DE ADMISION
      // ===================================
      await queryInterface.bulkInsert('motivosadmision', [
        { id: 1, nombre: 'Consulta Médica', descripcion: 'Evaluación médica general', created_at: new Date(), updated_at: new Date() },
        { id: 2, nombre: 'Urgencia', descripcion: 'Atención de urgencia', created_at: new Date(), updated_at: new Date() },
        { id: 3, nombre: 'Cirugía Programada', descripcion: 'Procedimiento quirúrgico planificado', created_at: new Date(), updated_at: new Date() },
        { id: 4, nombre: 'Internación', descripcion: 'Requerimiento de hospitalización', created_at: new Date(), updated_at: new Date() },
        { id: 5, nombre: 'Estudios', descripcion: 'Realización de estudios complementarios', created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      // ===================================
      // FORMAS DE INGRESO
      // ===================================
      await queryInterface.bulkInsert('formasingreso', [
        { id: 1, nombre: 'Ambulancia', descripcion: 'Ingreso por servicio de emergencias', created_at: new Date(), updated_at: new Date() },
        { id: 2, nombre: 'Derivación', descripcion: 'Derivado desde otro centro', created_at: new Date(), updated_at: new Date() },
        { id: 3, nombre: 'Espontánea', descripcion: 'Ingreso por cuenta propia', created_at: new Date(), updated_at: new Date() },
        { id: 4, nombre: 'Programada', descripcion: 'Admisión con turno previo', created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      // ===================================
      // MOTIVOS DE CONSULTA
      // ===================================
      await queryInterface.bulkInsert('motivosconsultas', [
        { id: 1, nombre: 'Dolor Torácico', descripcion: 'Molestia en el pecho', created_at: new Date(), updated_at: new Date() },
        { id: 2, nombre: 'Fiebre', descripcion: 'Temperatura corporal elevada', created_at: new Date(), updated_at: new Date() },
        { id: 3, nombre: 'Cefalea', descripcion: 'Dolor de cabeza', created_at: new Date(), updated_at: new Date() },
        { id: 4, nombre: 'Dolor Abdominal', descripcion: 'Molestia en el abdomen', created_at: new Date(), updated_at: new Date() },
        { id: 5, nombre: 'Control de Rutina', descripcion: 'Chequeo preventivo', created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      // ===================================
      // TRATAMIENTOS
      // ===================================
      await queryInterface.bulkInsert('tratamientos', [
        { id: 1, nombre: 'Antibiótico Terapia', descripcion: 'Tratamiento con antibióticos', created_at: new Date(), updated_at: new Date() },
        { id: 2, nombre: 'Analgesia', descripcion: 'Control del dolor', created_at: new Date(), updated_at: new Date() },
        { id: 3, nombre: 'Hidratación Parenteral', descripcion: 'Administración de sueros IV', created_at: new Date(), updated_at: new Date() },
        { id: 4, nombre: 'Oxigenoterapia', descripcion: 'Suministro de oxígeno', created_at: new Date(), updated_at: new Date() },
        { id: 5, nombre: 'Reposo', descripcion: 'Descanso y observación', created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      console.log('✅ Seeder 01: Catálogos cargados exitosamente');
    } catch (error) {
      console.error('❌ Error en Seeder 01:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize, options) => {
    const transaction = options.transaction;
    try {
      await queryInterface.bulkDelete('tratamientos', null, { transaction });
      await queryInterface.bulkDelete('motivosconsultas', null, { transaction });
      await queryInterface.bulkDelete('formasingreso', null, { transaction });
      await queryInterface.bulkDelete('motivosadmision', null, { transaction });
      await queryInterface.bulkDelete('tipos_turno', null, { transaction });
      await queryInterface.bulkDelete('tiposestudio', null, { transaction });
      await queryInterface.bulkDelete('tiposdiagnostico', null, { transaction });
      await queryInterface.bulkDelete('tiposinternacion', null, { transaction });
      await queryInterface.bulkDelete('tiposdeservicio', null, { transaction });
      await queryInterface.bulkDelete('obrassociales', null, { transaction });
      await queryInterface.bulkDelete('especialidades', null, { transaction });
      await queryInterface.bulkDelete('sectores', null, { transaction });
      await queryInterface.bulkDelete('roles', null, { transaction });

      console.log('✅ Seeder 01: Revertido exitosamente');
    } catch (error) {
      console.error('❌ Error al revertir Seeder 01:', error.message);
      throw error;
    }
  }
};