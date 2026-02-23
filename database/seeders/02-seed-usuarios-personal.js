
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
        { id: 10, dni: '01234567', nombre: 'Jorge', apellido: 'Díaz', email: 'paciente3@email.com', password: hashedPassword, rol_principal_id: 4, rol_secundario_id: null, estado: 'Activo', telefono: '26001234567', fecha_nacimiento: '1965-09-12', sexo: 'Masculino', created_at: new Date(), updated_at: new Date() },
        { id: 11, dni: '11223344', nombre: 'Dra. Carmen', apellido: 'Gutiérrez', email: 'carmen@hospital.com', password: hashedPassword, rol_principal_id: 2, rol_secundario_id: null, estado: 'Activo', telefono: '26011223344', fecha_nacimiento: '1975-09-12', sexo: 'Femenino', created_at: new Date(), updated_at: new Date() },
        { id: 12, dni: '22334455', nombre: 'Dr. Luis', apellido: 'Hernández', email: 'luis@hospital.com', password: hashedPassword, rol_principal_id: 2, rol_secundario_id: null, estado: 'Activo', telefono: '26022334455', fecha_nacimiento: '1983-04-28', sexo: 'Masculino', created_at: new Date(), updated_at: new Date() },
        { id: 13, dni: '33445566', nombre: 'Dra. Patricia', apellido: 'Silva', email: 'patricia@hospital.com', password: hashedPassword, rol_principal_id: 2, rol_secundario_id: null, estado: 'Activo', telefono: '26033445566', fecha_nacimiento: '1988-11-15', sexo: 'Femenino', created_at: new Date(), updated_at: new Date() },
        { id: 14, dni: '44556677', nombre: 'Dr. Fernando', apellido: 'Mendoza', email: 'fernando@hospital.com', password: hashedPassword, rol_principal_id: 2, rol_secundario_id: null, estado: 'Activo', telefono: '26044556677', fecha_nacimiento: '1979-07-03', sexo: 'Masculino', created_at: new Date(), updated_at: new Date() },
  
        // ENFERMEROS ADICIONALES
        { id: 15, dni: '55667788', nombre: 'Andrea', apellido: 'Castro', email: 'andrea@hospital.com', password: hashedPassword, rol_principal_id: 3, rol_secundario_id: null, estado: 'Activo', telefono: '26055667788', fecha_nacimiento: '1990-02-20', sexo: 'Femenino', created_at: new Date(), updated_at: new Date() },
        { id: 16, dni: '66778899', nombre: 'Javier', apellido: 'Romero', email: 'javier@hospital.com', password: hashedPassword, rol_principal_id: 3, rol_secundario_id: null, estado: 'Activo', telefono: '26066778899', fecha_nacimiento: '1987-05-14', sexo: 'Masculino', created_at: new Date(), updated_at: new Date() },
        { id: 17, dni: '77889900', nombre: 'Mónica', apellido: 'Vargas', email: 'monica@hospital.com', password: hashedPassword, rol_principal_id: 3, rol_secundario_id: null, estado: 'Activo', telefono: '26077889900', fecha_nacimiento: '1993-08-30', sexo: 'Femenino', created_at: new Date(), updated_at: new Date() },
        { id: 18, dni: '88990011', nombre: 'Laura', apellido: 'Pérez', email: 'laura@hospital.com', password: hashedPassword, rol_principal_id: 3, rol_secundario_id: null, estado: 'Activo', telefono: '26088990011', fecha_nacimiento: '1991-03-25', sexo: 'Femenino', created_at: new Date(), updated_at: new Date() },
        { id: 19, dni: '99001122', nombre: 'Roberto', apellido: 'Gómez', email: 'roberto@hospital.com', password: hashedPassword, rol_principal_id: 3, rol_secundario_id: null, estado: 'Activo', telefono: '26099001122', fecha_nacimiento: '1989-06-14', sexo: 'Masculino', created_at: new Date(), updated_at: new Date() },
        { id: 20, dni: '00112233', nombre: 'Carolina', apellido: 'Ruiz', email: 'carolina@hospital.com', password: hashedPassword, rol_principal_id: 3, rol_secundario_id: null, estado: 'Activo', telefono: '26000112233', fecha_nacimiento: '1994-12-08', sexo: 'Femenino', created_at: new Date(), updated_at: new Date() },
        { id: 21, dni: '21000000', nombre: 'Dr. Consulta', apellido: 'General', email: 'consulta@hospital.com', password: hashedPassword, rol_principal_id: 2, rol_secundario_id: null, estado: 'Activo', telefono: '26021000000', fecha_nacimiento: '1976-08-19', sexo: 'Masculino', created_at: new Date(), updated_at: new Date() },
        { id: 22, dni: '22000000', nombre: 'Dr. Internación', apellido: 'Clínica', email: 'internacion@hospital.com', password: hashedPassword, rol_principal_id: 2, rol_secundario_id: null, estado: 'Activo', telefono: '26022000000', fecha_nacimiento: '1981-12-03', sexo: 'Masculino', created_at: new Date(), updated_at: new Date() },
        { id: 23, dni: '23000000', nombre: 'María', apellido: 'Fernández', email: 'mariaf@hospital.com', password: hashedPassword, rol_principal_id: 3, rol_secundario_id: null, estado: 'Activo', telefono: '26023000000', fecha_nacimiento: '1990-05-15', sexo: 'Femenino', created_at: new Date(), updated_at: new Date() }
        ], { transaction });

      // ===================================
      // TURNOS PERSONAL
      // ===================================

      await queryInterface.bulkInsert('turnospersonal', [
      // Dr. Juan Pérez (usuario_id: 3) - Emergencias
      { id: 1, usuario_id: 3, tipo: 'Guardia Activa', dias: 'Lunes,Miércoles,Viernes', hora_inicio: '08:00:00', hora_fin: '16:00:00', sector_id: 1, created_at: new Date(), updated_at: new Date() },
  
      // Dra. Ana Martínez (usuario_id: 4) - Consultorios (Pediatría)
      { id: 2, usuario_id: 4, tipo: 'Atencion', dias: 'Martes,Jueves', hora_inicio: '14:00:00', hora_fin: '22:00:00', sector_id: 2, created_at: new Date(), updated_at: new Date() },
  
      // Enfermera Laura López (usuario_id: 6) - Internación
      { id: 3, usuario_id: 6, tipo: 'Guardia Activa', dias: 'Lunes,Miércoles,Viernes', hora_inicio: '06:00:00', hora_fin: '14:00:00', sector_id: 3, created_at: new Date(), updated_at: new Date() },
  
      // Turno Mañana (06:00 - 14:00) - Emergencias
      { id: 4, usuario_id: 11, tipo: 'Guardia Activa', dias: 'Lunes,Martes,Miércoles,Jueves,Viernes,Sábado,Domingo', hora_inicio: '06:00:00', hora_fin: '14:00:00', sector_id: 1, created_at: new Date(), updated_at: new Date() },
      { id: 5, usuario_id: 15, tipo: 'Guardia Activa', dias: 'Lunes,Martes,Miércoles,Jueves,Viernes,Sábado,Domingo', hora_inicio: '06:00:00', hora_fin: '14:00:00', sector_id: 1, created_at: new Date(), updated_at: new Date() },
  
      // Turno Tarde (14:00 - 22:00) - Emergencias
      { id: 6, usuario_id: 12, tipo: 'Guardia Activa', dias: 'Lunes,Martes,Miércoles,Jueves,Viernes,Sábado,Domingo', hora_inicio: '14:00:00', hora_fin: '22:00:00', sector_id: 1, created_at: new Date(), updated_at: new Date() },
      { id: 7, usuario_id: 16, tipo: 'Guardia Activa', dias: 'Lunes,Martes,Miércoles,Jueves,Viernes,Sábado,Domingo', hora_inicio: '14:00:00', hora_fin: '22:00:00', sector_id: 1, created_at: new Date(), updated_at: new Date() },
  
      // Turno Noche (22:00 - 06:00) - Emergencias
      { id: 8, usuario_id: 13, tipo: 'Guardia Activa', dias: 'Lunes,Martes,Miércoles,Jueves,Viernes,Sábado,Domingo', hora_inicio: '22:00:00', hora_fin: '06:00:00', sector_id: 1, created_at: new Date(), updated_at: new Date() },
  
      // SECTOR 2: CONSULTORIOS EXTERNOS (08:00 - 20:00)
      // Consulta General - NUEVO MÉDICO (usuario_id: 21)
      { id: 9, usuario_id: 21, tipo: 'Atencion Programada', dias: 'Lunes,Miércoles,Viernes', hora_inicio: '08:00:00', hora_fin: '16:00:00', sector_id: 2, created_at: new Date(), updated_at: new Date() },
  
      // Pediatría - Dr. Luis Hernández (usuario_id: 12)
      { id: 10, usuario_id: 12, tipo: 'Atencion Programada', dias: 'Martes,Jueves', hora_inicio: '09:00:00', hora_fin: '17:00:00', sector_id: 2, created_at: new Date(), updated_at: new Date() },
  
      // Ginecología - Dra. Patricia Silva (usuario_id: 13)
      { id: 11, usuario_id: 13, tipo: 'Atencion Programada', dias: 'Lunes,Miércoles', hora_inicio: '10:00:00', hora_fin: '18:00:00', sector_id: 2, created_at: new Date(), updated_at: new Date() },
  
      // Enfermería Consultorios - María Fernández (usuario_id: 23)
      { id: 12, usuario_id: 23, tipo: 'Atencion', dias: 'Lunes,Martes,Miércoles,Jueves,Viernes', hora_inicio: '08:00:00', hora_fin: '16:00:00', sector_id: 2, created_at: new Date(), updated_at: new Date() },
  
      // SECTOR 3: INTERNACIÓN (24hs) - NUEVO MÉDICO (usuario_id: 22)
      { id: 13, usuario_id: 22, tipo: 'Guardia Pasiva', dias: 'Lunes,Miércoles,Viernes', hora_inicio: '08:00:00', hora_fin: '20:00:00', sector_id: 3, created_at: new Date(), updated_at: new Date() },
      { id: 14, usuario_id: 17, tipo: 'Guardia Pasiva', dias: 'Lunes,Martes,Miércoles,Jueves,Viernes,Sábado,Domingo', hora_inicio: '07:00:00', hora_fin: '19:00:00', sector_id: 3, created_at: new Date(), updated_at: new Date() },

      // SECTOR 4: QUIRÓFANO (07:00 - 19:00) - Dr. Roberto Fernández (usuario_id: 5)
      { id: 15, usuario_id: 5, tipo: 'Cirugía Programada', dias: 'Martes,Jueves', hora_inicio: '07:00:00', hora_fin: '15:00:00', sector_id: 4, created_at: new Date(), updated_at: new Date() },
      { id: 16, usuario_id: 18, tipo: 'Instrumentista', dias: 'Martes,Jueves', hora_inicio: '07:00:00', hora_fin: '15:00:00', sector_id: 4, created_at: new Date(), updated_at: new Date() },
  
      // SECTOR 5: UTI (24hs) - Dr. Fernando Mendoza (usuario_id: 14)
      { id: 17, usuario_id: 14, tipo: 'Guardia Activa', dias: 'Lunes,Miércoles,Viernes', hora_inicio: '08:00:00', hora_fin: '20:00:00', sector_id: 5, created_at: new Date(), updated_at: new Date() },
      { id: 18, usuario_id: 20, tipo: 'Guardia Activa', dias: 'Lunes,Martes,Miércoles,Jueves,Viernes,Sábado,Domingo', hora_inicio: '07:00:00', hora_fin: '19:00:00', sector_id: 5, created_at: new Date(), updated_at: new Date() },
  
      // SECTOR 6: LABORATORIO (07:00 - 15:00) - Andrea Castro (usuario_id: 15)
      { id: 19, usuario_id: 15, tipo: 'Laboratorio', dias: 'Lunes,Martes,Miércoles,Jueves,Viernes', hora_inicio: '07:00:00', hora_fin: '15:00:00', sector_id: 6, created_at: new Date(), updated_at: new Date() },
  
      // SECTOR 7: IMAGENOLOGÍA (08:00 - 16:00) - Javier Romero (usuario_id: 16)
      { id: 20, usuario_id: 16, tipo: 'Imagenología', dias: 'Lunes,Martes,Miércoles,Jueves,Viernes', hora_inicio: '08:00:00', hora_fin: '16:00:00', sector_id: 7, created_at: new Date(), updated_at: new Date() },
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
      // MÉDICO 1: Dr. Juan Pérez - Emergencias
      { id: 1, usuario_id: 3, matricula: 'MN-12345', especialidad_id: 1, sector_id: 1, created_at: new Date(), updated_at: new Date() },
  
      // MÉDICO 2: Dra. Ana Martínez - Consultorios (Pediatría)
      { id: 2, usuario_id: 4, matricula: 'MN-23456', especialidad_id: 2, sector_id: 2, created_at: new Date(), updated_at: new Date() },
  
      // MÉDICO 3: Dr. Roberto Fernández - Quirófano
      { id: 3, usuario_id: 5, matricula: 'MN-34567', especialidad_id: 6, sector_id: 4, created_at: new Date(), updated_at: new Date() },
  
      // MÉDICO 4: Dra. Carmen Gutiérrez - Emergencias
      { id: 4, usuario_id: 11, matricula: 'MN-45678', especialidad_id: 1, sector_id: 1, created_at: new Date(), updated_at: new Date() },
  
      // MÉDICO 5: Dr. Luis Hernández - Consultorios (Pediatría) - CAMBIADO de usuario_id 12
      { id: 5, usuario_id: 12, matricula: 'MN-56789', especialidad_id: 2, sector_id: 2, created_at: new Date(), updated_at: new Date() },
  
      // MÉDICO 6: Dra. Patricia Silva - Consultorios (Ginecología)
      { id: 6, usuario_id: 13, matricula: 'MN-67890', especialidad_id: 3, sector_id: 2, created_at: new Date(), updated_at: new Date() },
  
      // MÉDICO 7: Dr. Fernando Mendoza - UTI
      { id: 7, usuario_id: 14, matricula: 'MN-78901', especialidad_id: 4, sector_id: 5, created_at: new Date(), updated_at: new Date() },
  
      // MÉDICO 8: Andrea Castro (Bioquímica) - Laboratorio
      { id: 8, usuario_id: 15, matricula: 'MN-89012', especialidad_id: 7, sector_id: 6, created_at: new Date(), updated_at: new Date() },
  
      // MÉDICO 9: Javier Romero (Radiólogo) - Imagenología
      { id: 9, usuario_id: 16, matricula: 'MN-90123', especialidad_id: 5, sector_id: 7, created_at: new Date(), updated_at: new Date() },
  
      // MÉDICO 10: AGREGAR NUEVO MÉDICO para Consulta General (usuario 21)
      { id: 10, usuario_id: 21, matricula: 'MN-12945', especialidad_id: 1, sector_id: 2, created_at: new Date(), updated_at: new Date() },
  
      // MÉDICO 11: AGREGAR NUEVO MÉDICO para Internación (usuario 22)
      { id: 11, usuario_id: 22, matricula: 'MN-23460', especialidad_id: 1, sector_id: 3, created_at: new Date(), updated_at: new Date() },
      ], { transaction });
        


      // ===================================
      // ENFERMEROS
      // ===================================
      await queryInterface.bulkInsert('enfermeros', [
      // Enfermera Laura López (usuario_id: 6) - Internación
      { id: 1, usuario_id: 6, sector_id: 3, matricula: 'ENF-1001', nivel: 'Licenciado', estado: 'Activo', fecha_ingreso: '2020-01-15', created_at: new Date(), updated_at: new Date() },
  
      // Enfermero Miguel Torres (usuario_id: 7) - Emergencias
      { id: 2, usuario_id: 7, sector_id: 1, matricula: 'ENF-1002', nivel: 'Técnico', estado: 'Activo', fecha_ingreso: '2021-03-20', created_at: new Date(), updated_at: new Date() },

      // Sector 1: Emergencias - Andrea Castro (usuario_id: 15)
      { id: 3, usuario_id: 15, sector_id: 1, matricula: 'ENF-1003', nivel: 'Licenciado', estado: 'Activo', fecha_ingreso: '2019-05-10', created_at: new Date(), updated_at: new Date() },
  
      // Sector 1: Emergencias - Javier Romero (usuario_id: 16)
      { id: 4, usuario_id: 16, sector_id: 1, matricula: 'ENF-1004', nivel: 'Técnico', estado: 'Activo', fecha_ingreso: '2020-08-15', created_at: new Date(), updated_at: new Date() },
  
      // Sector 2: Consultorios Externos - NUEVA ENFERMERA (usuario_id: 23)
      { id: 5, usuario_id: 23, sector_id: 2, matricula: 'ENF-1005', nivel: 'Licenciado', estado: 'Activo', fecha_ingreso: '2021-01-20', created_at: new Date(), updated_at: new Date() },
  
      // Sector 3: Internación - Mónica Vargas (usuario_id: 17)
      { id: 6, usuario_id: 17, sector_id: 3, matricula: 'ENF-1006', nivel: 'Licenciado', estado: 'Activo', fecha_ingreso: '2018-11-05', created_at: new Date(), updated_at: new Date() },
  
      // Sector 3: Internación - Laura Pérez (usuario_id: 18)
      { id: 7, usuario_id: 18, sector_id: 3, matricula: 'ENF-1007', nivel: 'Técnico', estado: 'Activo', fecha_ingreso: '2022-03-12', created_at: new Date(), updated_at: new Date() },
  
      // Sector 4: Quirófano - Roberto Gómez (usuario_id: 19)
      { id: 8, usuario_id: 19, sector_id: 4, matricula: 'ENF-1008', nivel: 'Instrumentista', estado: 'Activo', fecha_ingreso: '2017-09-25', created_at: new Date(), updated_at: new Date() },
  
      // Sector 5: UTI - Carolina Ruiz (usuario_id: 20)
      { id: 9, usuario_id: 20, sector_id: 5, matricula: 'ENF-1009', nivel: 'Licenciado', estado: 'Activo', fecha_ingreso: '2016-07-18', created_at: new Date(), updated_at: new Date() },
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