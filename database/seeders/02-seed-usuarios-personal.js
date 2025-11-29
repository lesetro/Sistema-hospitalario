
'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize, options) => {
    const transaction = options.transaction;
    try {
      console.log('🌱 Seeder 02: Cargando usuarios y personal...');

      const hashedPassword = await bcrypt.hash('password123', 10);

      // ===================================
      // USUARIOS
      // ===================================
      await queryInterface.bulkInsert('usuarios', [
        // Administrativos
        { id: 1, dni: '12345678', nombre: 'María', apellido: 'González', email: 'admin@hospital.com', password: hashedPassword, rol_principal_id: 1, rol_secundario_id: null, estado: 'Activo', telefono: '26012345678', fecha_nacimiento: '1985-03-15', sexo: 'Femenino', created_at: new Date(), updated_at: new Date() },
        { id: 2, dni: '23456789', nombre: 'Carlos', apellido: 'Rodríguez', email: 'admin2@hospital.com', password: hashedPassword, rol_principal_id: 1, rol_secundario_id: null, estado: 'Activo', telefono: '26023456789', fecha_nacimiento: '1990-07-22', sexo: 'Masculino', created_at: new Date(), updated_at: new Date() },
        
        // Médicos
        { id: 3, dni: '34567890', nombre: 'Dr. Juan', apellido: 'Pérez', email: 'medico1@hospital.com', password: hashedPassword, rol_principal_id: 2, rol_secundario_id: null, estado: 'Activo', telefono: '26034567890', fecha_nacimiento: '1980-05-10', sexo: 'Masculino', created_at: new Date(), updated_at: new Date() },
        { id: 4, dni: '45678901', nombre: 'Dra. Ana', apellido: 'Martínez', email: 'medico2@hospital.com', password: hashedPassword, rol_principal_id: 2, rol_secundario_id: null, estado: 'Activo', telefono: '26045678901', fecha_nacimiento: '1982-11-25', sexo: 'Femenino', created_at: new Date(), updated_at: new Date() },
        { id: 5, dni: '56789012', nombre: 'Dr. Roberto', apellido: 'Fernández', email: 'medico3@hospital.com', password: hashedPassword, rol_principal_id: 2, rol_secundario_id: null, estado: 'Activo', telefono: '26056789012', fecha_nacimiento: '1978-02-14', sexo: 'Masculino', created_at: new Date(), updated_at: new Date() },
        
        // Enfermeros
        { id: 6, dni: '67890123', nombre: 'Laura', apellido: 'López', email: 'enfermera1@hospital.com', password: hashedPassword, rol_principal_id: 3, rol_secundario_id: null, estado: 'Activo', telefono: '26067890123', fecha_nacimiento: '1992-08-30', sexo: 'Femenino', created_at: new Date(), updated_at: new Date() },
        { id: 7, dni: '78901234', nombre: 'Miguel', apellido: 'Torres', email: 'enfermero1@hospital.com', password: hashedPassword, rol_principal_id: 3, rol_secundario_id: null, estado: 'Activo', telefono: '26078901234', fecha_nacimiento: '1988-04-18', sexo: 'Masculino', created_at: new Date(), updated_at: new Date() },
        
        // Pacientes
        { id: 8, dni: '89012345', nombre: 'Pedro', apellido: 'Sánchez', email: 'paciente1@email.com', password: hashedPassword, rol_principal_id: 4, rol_secundario_id: null, estado: 'Activo', telefono: '26089012345', fecha_nacimiento: '1970-12-05', sexo: 'Masculino', created_at: new Date(), updated_at: new Date() },
        { id: 9, dni: '90123456', nombre: 'Sofía', apellido: 'Ramírez', email: 'paciente2@email.com', password: hashedPassword, rol_principal_id: 4, rol_secundario_id: null, estado: 'Activo', telefono: '26090123456', fecha_nacimiento: '1995-06-20', sexo: 'Femenino', created_at: new Date(), updated_at: new Date() },
        { id: 10, dni: '01234567', nombre: 'Jorge', apellido: 'Díaz', email: 'paciente3@email.com', password: hashedPassword, rol_principal_id: 4, rol_secundario_id: null, estado: 'Activo', telefono: '26001234567', fecha_nacimiento: '1965-09-12', sexo: 'Masculino', created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      // ===================================
      // TURNOS PERSONAL
      // ===================================
      await queryInterface.bulkInsert('turnospersonal', [
        { id: 1, usuario_id: 3, tipo: 'Guardia Activa', dias: 'Lunes,Miércoles,Viernes', hora_inicio: '08:00:00', hora_fin: '16:00:00', sector_id: 2, created_at: new Date(), updated_at: new Date() },
        { id: 2, usuario_id: 4, tipo: 'Atencion', dias: 'Martes,Jueves', hora_inicio: '14:00:00', hora_fin: '22:00:00', sector_id: 2, created_at: new Date(), updated_at: new Date() },
        { id: 3, usuario_id: 6, tipo: 'Guardia Activa', dias: 'Lunes,Miércoles,Viernes', hora_inicio: '06:00:00', hora_fin: '14:00:00', sector_id: 3, created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      // ===================================
      // ADMINISTRATIVOS
      // ===================================
      await queryInterface.bulkInsert('administrativos', [
        { id: 1, usuario_id: 1, sector_id: 8, turno_id: null, responsabilidad: 'Expediente', descripcion: 'Gestión de historias clínicas', estado: 'Activo', created_at: new Date(), updated_at: new Date() },
        { id: 2, usuario_id: 2, sector_id: 1, turno_id: null, responsabilidad: 'Turnos', descripcion: 'Coordinación de turnos', estado: 'Activo', created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      // ===================================
      // MEDICOS
      // ===================================
      await queryInterface.bulkInsert('medicos', [
        { id: 1, usuario_id: 3, matricula: 'MN-12345', especialidad_id: 1, sector_id: 2, created_at: new Date(), updated_at: new Date() },
        { id: 2, usuario_id: 4, matricula: 'MN-23456', especialidad_id: 2, sector_id: 2, created_at: new Date(), updated_at: new Date() },
        { id: 3, usuario_id: 5, matricula: 'MN-34567', especialidad_id: 6, sector_id: 4, created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      // ===================================
      // ENFERMEROS
      // ===================================
      await queryInterface.bulkInsert('enfermeros', [
        { id: 1, usuario_id: 6, sector_id: 3, matricula: 'ENF-1001', nivel: 'Licenciado', estado: 'Activo', fecha_ingreso: '2020-01-15', created_at: new Date(), updated_at: new Date() },
        { id: 2, usuario_id: 7, sector_id: 1, matricula: 'ENF-1002', nivel: 'Técnico', estado: 'Activo', fecha_ingreso: '2021-03-20', created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      // ===================================
      // PACIENTES
      // ===================================
      await queryInterface.bulkInsert('pacientes', [
        { id: 1, usuario_id: 8, administrativo_id: 1, obra_social_id: 1, fecha_ingreso: '2025-01-15', fecha_egreso: null, estado: 'Activo', observaciones: 'Paciente con hipertensión controlada', created_at: new Date(), updated_at: new Date() },
        { id: 2, usuario_id: 9, administrativo_id: 2, obra_social_id: 2, fecha_ingreso: '2025-02-20', fecha_egreso: null, estado: 'Activo', observaciones: null, created_at: new Date(), updated_at: new Date() },
        { id: 3, usuario_id: 10, administrativo_id: 1, obra_social_id: 3, fecha_ingreso: '2025-03-10', fecha_egreso: null, estado: 'Activo', observaciones: 'Paciente diabético tipo 2', created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      console.log('✅ Seeder 02: Usuarios y personal cargados exitosamente');
    } catch (error) {
      console.error('❌ Error en Seeder 02:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize, options) => {
    const transaction = options.transaction;
    try {
      await queryInterface.bulkDelete('pacientes', null, { transaction });
      await queryInterface.bulkDelete('enfermeros', null, { transaction });
      await queryInterface.bulkDelete('medicos', null, { transaction });
      await queryInterface.bulkDelete('administrativos', null, { transaction });
      await queryInterface.bulkDelete('turnospersonal', null, { transaction });
      await queryInterface.bulkDelete('usuarios', null, { transaction });

      console.log('✅ Seeder 02: Revertido exitosamente');
    } catch (error) {
      console.error('❌ Error al revertir Seeder 02:', error.message);
      throw error;
    }
  }
};