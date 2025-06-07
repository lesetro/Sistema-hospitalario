module.exports = {
  up: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction });
      // 1. Clear existing data with correct table names
      await queryInterface.bulkDelete('tratamientos', null, { transaction });
      await queryInterface.bulkDelete('sectores', null, { transaction });
      await queryInterface.bulkDelete('especialidades', null, { transaction });
      await queryInterface.bulkDelete('obrassociales', null, { transaction });
      await queryInterface.bulkDelete('motivosconsultas', null, { transaction });
      await queryInterface.bulkDelete('formasingreso', null, { transaction });
      await queryInterface.bulkDelete('motivosadmision', null, { transaction });
      await queryInterface.bulkDelete('tipos_turno', null, { transaction });
      await queryInterface.bulkDelete('tiposestudio', null, { transaction });
      await queryInterface.bulkDelete('tiposdiagnostico', null, { transaction });
      await queryInterface.bulkDelete('tiposinternacion', null, { transaction });
      await queryInterface.bulkDelete('tiposdeservicio', null, { transaction });
      await queryInterface.bulkDelete('roles', null, { transaction });

         // 2. Resetear auto-incrementos
    await queryInterface.sequelize.query('ALTER TABLE Usuarios AUTO_INCREMENT = 1', { transaction });
      // Roles
      
      const existingRoles = await queryInterface.sequelize.query(

        'SELECT nombre FROM roles WHERE nombre IN (:nombres)',
        {
          replacements: { nombres: ['Administrativo', 'Medico', 'Enfermero', 'Paciente'] },
          type: queryInterface.sequelize.QueryTypes.SELECT,
          transaction
        }
      );
      const existingRoleNames = existingRoles.map(role => role.nombre);
      const rolesToInsert = [
        { nombre: 'Administrativo',  descripcion: 'sin comentario',created_at: new Date(), updated_at: new Date() },
        { nombre: 'Medico', descripcion: 'sin comentario', created_at: new Date(), updated_at: new Date() },
        { nombre: 'Enfermero', descripcion: 'sin comentario', created_at: new Date(), updated_at: new Date() },
        { nombre: 'Paciente', descripcion: 'sin comentario', created_at: new Date(), updated_at: new Date() }
      ].filter(role => !existingRoleNames.includes(role.nombre));
      if (rolesToInsert.length > 0) {
        await queryInterface.bulkInsert('roles', rolesToInsert, { transaction });
      }

      // TiposDeServicio
      const existingServicios = await queryInterface.sequelize.query(
        'SELECT nombre FROM tiposdeservicio WHERE nombre IN (:nombres)',
        {
          replacements: { nombres: ['General', 'Quirurgico'] },
          type: queryInterface.sequelize.QueryTypes.SELECT,
          transaction
        }
      );
      const existingServicioNames = existingServicios.map(s => s.nombre);
      const serviciosToInsert = [
        { nombre: 'General', descripcion: 'Servicio general', created_at: new Date(), updated_at: new Date() },
        { nombre: 'Quirurgico', descripcion: 'Servicio quirúrgico', created_at: new Date(), updated_at: new Date() }
      ].filter(s => !existingServicioNames.includes(s.nombre));
      if (serviciosToInsert.length > 0) {
        await queryInterface.bulkInsert('tiposdeservicio', serviciosToInsert, { transaction });
      }

      // TiposInternacion
      const existingInternaciones = await queryInterface.sequelize.query(
        'SELECT nombre FROM tiposinternacion WHERE nombre IN (:nombres)',
        {
          replacements: { nombres: ['UTI', 'General'] },
          type: queryInterface.sequelize.QueryTypes.SELECT,
          transaction
        }
      );
      const existingInternacionNames = existingInternaciones.map(i => i.nombre);
      const internacionesToInsert = [
        { nombre: 'UTI', descripcion: 'Unidad de Terapia Intensiva', created_at: new Date(), updated_at: new Date() },
        { nombre: 'General', descripcion: 'Internación general', created_at: new Date(), updated_at: new Date() }
      ].filter(i => !existingInternacionNames.includes(i.nombre));
      if (internacionesToInsert.length > 0) {
        await queryInterface.bulkInsert('tiposinternacion', internacionesToInsert, { transaction });
      }

      // TiposDiagnostico
      const existingDiagnosticos = await queryInterface.sequelize.query(
        'SELECT nombre FROM tiposdiagnostico WHERE nombre IN (:nombres)',
        {
          replacements: { nombres: ['Primario', 'Secundario'] },
          type: queryInterface.sequelize.QueryTypes.SELECT,
          transaction
        }
      );
      const existingDiagnosticoNames = existingDiagnosticos.map(d => d.nombre);
      const diagnosticosToInsert = [
        { nombre: 'Primario', descripcion: 'Diagnóstico principal', created_at: new Date(), updated_at: new Date() },
        { nombre: 'Secundario', descripcion: 'Diagnóstico secundario', created_at: new Date(), updated_at: new Date() }
      ].filter(d => !existingDiagnosticoNames.includes(d.nombre));
      if (diagnosticosToInsert.length > 0) {
        await queryInterface.bulkInsert('tiposdiagnostico', diagnosticosToInsert, { transaction });
      }

      // TiposEstudio
      const existingEstudios = await queryInterface.sequelize.query(
        'SELECT nombre FROM tiposestudio WHERE nombre IN (:nombres)',
        {
          replacements: { nombres: ['Radiografía', 'Laboratorio'] },
          type: queryInterface.sequelize.QueryTypes.SELECT,
          transaction
        }
      );
      const existingEstudioNames = existingEstudios.map(e => e.nombre);
      const estudiosToInsert = [
        { nombre: 'Radiografía', descripcion: 'Estudio de imágenes', created_at: new Date(), updated_at: new Date() },
        { nombre: 'Laboratorio', descripcion: 'Análisis clínicos', created_at: new Date(), updated_at: new Date() }
      ].filter(e => !existingEstudioNames.includes(e.nombre));
      if (estudiosToInsert.length > 0) {
        await queryInterface.bulkInsert('tiposestudio', estudiosToInsert, { transaction });
      }

      // TiposTurno
      const existingTurnos = await queryInterface.sequelize.query(
        'SELECT nombre FROM tipos_turno WHERE nombre IN (:nombres)',
        {
          replacements: { nombres: ['Consulta', 'Estudio'] },
          type: queryInterface.sequelize.QueryTypes.SELECT,
          transaction
        }
      );
      const existingTurnoNames = existingTurnos.map(t => t.nombre);
      const turnosToInsert = [
        { nombre: 'Consulta', descripcion: 'Turno para consulta médica', created_at: new Date(), updated_at: new Date() },
        { nombre: 'Estudio', descripcion: 'Turno para estudio', created_at: new Date(), updated_at: new Date() }
      ].filter(t => !existingTurnoNames.includes(t.nombre));
      if (turnosToInsert.length > 0) {
        await queryInterface.bulkInsert('tipos_turno', turnosToInsert, { transaction });
      }

      // MotivosAdmision
      const existingMotivosAdm = await queryInterface.sequelize.query(
        'SELECT nombre FROM motivosadmision WHERE nombre IN (:nombres)',
        {
          replacements: { nombres: ['Consulta médica', 'Urgencia', 'Cirugía'] },
          type: queryInterface.sequelize.QueryTypes.SELECT,
          transaction
        }
      );
      const existingMotivoAdmNames = existingMotivosAdm.map(m => m.nombre);
      const motivosAdmToInsert = [
        { nombre: 'Consulta médica', descripcion: 'Admisión para evaluación médica', created_at: new Date(), updated_at: new Date() },
        { nombre: 'Urgencia', descripcion: 'Admisión por urgencia', created_at: new Date(), updated_at: new Date() },
        { nombre: 'Cirugía', descripcion: 'Admisión para procedimiento quirúrgico', created_at: new Date(), updated_at: new Date() }
      ].filter(m => !existingMotivoAdmNames.includes(m.nombre));
      if (motivosAdmToInsert.length > 0) {
        await queryInterface.bulkInsert('motivosadmision', motivosAdmToInsert, { transaction });
      }

      // FormasIngreso
      const existingFormas = await queryInterface.sequelize.query(
        'SELECT nombre FROM formasingreso WHERE nombre IN (:nombres)',
        {
          replacements: { nombres: ['Ambulatorio', 'Emergencia', 'Programado'] },
          type: queryInterface.sequelize.QueryTypes.SELECT,
          transaction
        }
      );
      const existingFormaNames = existingFormas.map(f => f.nombre);
      const formasToInsert = [
        { nombre: 'Ambulatorio', descripcion: 'Ingreso ambulatorio', created_at: new Date(), updated_at: new Date() },
        { nombre: 'Emergencia', descripcion: 'Ingreso por emergencia', created_at: new Date(), updated_at: new Date() },
        { nombre: 'Programado', descripcion: 'Ingreso planificado', created_at: new Date(), updated_at: new Date() }
      ].filter(f => !existingFormaNames.includes(f.nombre));
      if (formasToInsert.length > 0) {
        await queryInterface.bulkInsert('formasingreso', formasToInsert, { transaction });
      }

      // MotivosConsultas
      const existingMotivosCon = await queryInterface.sequelize.query(
        'SELECT nombre FROM motivosconsultas WHERE nombre IN (:nombres)',
        {
          replacements: { nombres: ['Dolor torácico', 'Fractura'] },
          type: queryInterface.sequelize.QueryTypes.SELECT,
          transaction
        }
      );
      const existingMotivoConNames = existingMotivosCon.map(m => m.nombre);
      const motivosConToInsert = [
        { nombre: 'Dolor torácico', descripcion: 'Consulta por dolor en el pecho', created_at: new Date(), updated_at: new Date() },
        { nombre: 'Fractura', descripcion: 'Consulta por lesión ósea', created_at: new Date(), updated_at: new Date() }
      ].filter(m => !existingMotivoConNames.includes(m.nombre));
      if (motivosConToInsert.length > 0) {
        await queryInterface.bulkInsert('motivosconsultas', motivosConToInsert, { transaction });
      }

      // ObrasSociales
      const existingObras = await queryInterface.sequelize.query(
        'SELECT nombre FROM obrassociales WHERE nombre IN (:nombres)',
        {
          replacements: { nombres: ['OSDE', 'Swiss Medical'] },
          type: queryInterface.sequelize.QueryTypes.SELECT,
          transaction
        }
      );
      const existingObraNames = existingObras.map(o => o.nombre);
      const obrasToInsert = [
        { nombre: 'OSDE', descripcion: 'Obra social privada', created_at: new Date(), updated_at: new Date() },
        { nombre: 'Swiss Medical', descripcion: 'Obra social privada', created_at: new Date(), updated_at: new Date() }
      ].filter(o => !existingObraNames.includes(o.nombre));
      if (obrasToInsert.length > 0) {
        await queryInterface.bulkInsert('obrassociales', obrasToInsert, { transaction });
      }

      // Especialidades
      const existingEspecialidades = await queryInterface.sequelize.query(
        'SELECT nombre FROM especialidades WHERE nombre IN (:nombres)',
        {
          replacements: { nombres: ['Cardiología', 'Traumatología'] },
          type: queryInterface.sequelize.QueryTypes.SELECT,
          transaction
        }
      );
      const existingEspecialidadNames = existingEspecialidades.map(e => e.nombre);
      const especialidadesToInsert = [
        { nombre: 'Cardiología',  descripcion: 'Especialidad cardíaca',created_at: new Date(), updated_at: new Date() },
        { nombre: 'Traumatología', descripcion: 'Especialidad ósea', created_at: new Date(), updated_at: new Date() }
      ].filter(e => !existingEspecialidadNames.includes(e.nombre));
      if (especialidadesToInsert.length > 0) {
        await queryInterface.bulkInsert('especialidades', especialidadesToInsert, { transaction });
      }

      // Sectores
      const existingSectores = await queryInterface.sequelize.query(
        'SELECT nombre FROM sectores WHERE nombre IN (:nombres)',
        {
          replacements: { nombres: ['Administración', 'Recepción', 'Emergencias', 'Traumatología'] },
          type: queryInterface.sequelize.QueryTypes.SELECT,
          transaction
        }
      );
      const existingSectorNames = existingSectores.map(s => s.nombre);
      const sectoresToInsert = [
        { nombre: 'Administración',descripcion: ' antibióticos', created_at: new Date(), updated_at: new Date() },
        { nombre: 'Recepción', descripcion: ' farmacia',created_at: new Date(), updated_at: new Date() },
        { nombre: 'Emergencias', descripcion: ' clinica medica',created_at: new Date(), updated_at: new Date() },
        { nombre: 'Traumatología', descripcion: ' quirofanos',created_at: new Date(), updated_at: new Date() }
      ].filter(s => !existingSectorNames.includes(s.nombre));
      if (sectoresToInsert.length > 0) {
        await queryInterface.bulkInsert('sectores', sectoresToInsert, { transaction });
      }

      // Tratamientos
      const existingTratamientos = await queryInterface.sequelize.query(
        'SELECT nombre FROM tratamientos WHERE nombre IN (:nombres)',
        {
          replacements: { nombres: ['Antibióticos', 'Fisioterapia'] },
          type: queryInterface.sequelize.QueryTypes.SELECT,
          transaction
        }
      );
      const existingTratamientoNames = existingTratamientos.map(t => t.nombre);
      const tratamientosToInsert = [
        { nombre: 'Antibióticos', descripcion: ' antibióticos', created_at: new Date(), updated_at: new Date() },
        { nombre: 'Fisioterapia', descripcion: 'Rehabilitación física', created_at: new Date(), updated_at: new Date() }
      ].filter(t => !existingTratamientoNames.includes(t.nombre));
      if (tratamientosToInsert.length > 0) {
        await queryInterface.bulkInsert('tratamientos', tratamientosToInsert, { transaction });
      }
      // 1. Clear existing data with correct table names
      await queryInterface.bulkDelete('administrativos', null, { transaction });
      await queryInterface.bulkDelete('enfermeros', null, { transaction });
      await queryInterface.bulkDelete('medicos', null, { transaction });
      await queryInterface.bulkDelete('pacientes', null, { transaction });
      await queryInterface.bulkDelete('usuarios', null, { transaction });

      // 2. Reset auto-increment
      await queryInterface.sequelize.query('ALTER TABLE usuarios AUTO_INCREMENT = 1', { transaction });

      // 3. Insert Usuarios
      await queryInterface.bulkInsert('usuarios', [
        { rol_id: 1,dni: '00000001', nombre: 'Admin 1', apellido: `Torres`,password: '123456789',sexo: 'Masculino', fecha_nacimiento: '1990-01-15', email: 'admin1@hospital.com', created_at: new Date(), updated_at: new Date() },
        { rol_id: 2,dni: '00000002', nombre: 'Dr. García', apellido: `Torres`,password: '123456789',sexo: 'Masculino', fecha_nacimiento: '1990-01-15', email: 'garcia@hospital.com', created_at: new Date(), updated_at: new Date() },
        { rol_id: 3, dni: '00000003',nombre: 'Enf. López', apellido: `Torres`,password: '123456789', sexo: 'Masculino',fecha_nacimiento: '1990-01-15', email: 'lopez@hospital.com', created_at: new Date(), updated_at: new Date() },
        { rol_id: 4,dni: '00000004', nombre: 'Juan Pérez', apellido: `Torres`,password: '123456789',sexo: 'Masculino', fecha_nacimiento: '1990-01-15', email: 'perez@hospital.com', created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      // 4. Get inserted usuarios and obrassociales for foreign keys
      const usuarios = await queryInterface.sequelize.query(
        'SELECT id, nombre FROM usuarios WHERE email IN (:emails)',
        {
          replacements: { emails: ['admin1@hospital.com', 'garcia@hospital.com', 'lopez@hospital.com', 'perez@hospital.com'] },
          type: queryInterface.sequelize.QueryTypes.SELECT,
          transaction
        }
      );

      const obrasSociales = await queryInterface.sequelize.query(
        'SELECT id, nombre FROM obrassociales WHERE nombre = :nombre',
        {
          replacements: { nombre: 'OSDE' },
          type: queryInterface.sequelize.QueryTypes.SELECT,
          transaction
        }
      );

      const sectores = await queryInterface.sequelize.query(
        'SELECT id, nombre FROM sectores WHERE nombre = :nombre',
        {
          replacements: { nombre: 'Administración' },
          type: queryInterface.sequelize.QueryTypes.SELECT,
          transaction
        }
      );

      const especialidades = await queryInterface.sequelize.query(
        'SELECT id, nombre FROM especialidades WHERE nombre = :nombre',
        {
          replacements: { nombre: 'Cardiología' },
          type: queryInterface.sequelize.QueryTypes.SELECT,
          transaction
        }
      );

      // 5. Insert Pacientes
      const pacienteUsuario = usuarios.find(u => u.nombre === 'Juan Pérez');
      const obraSocial = obrasSociales.find(o => o.nombre === 'OSDE');
      if (pacienteUsuario && obraSocial) {
        await queryInterface.bulkInsert('pacientes', [
          {
            usuario_id: 1,
            obra_social_id: 1, // OSDE
            administrativo_id: 1,
            fecha_nacimiento: new Date('1985-05-15'),
            fecha_ingreso: new Date('2023-01-10'),
            estado: 'Activo',
            fecha_egreso: new Date('2023-01-10'),
            observaciones: 'Alergia a la penicilina',
            created_at: new Date(),
            updated_at: new Date()
          },
          { 
            usuario_id: 4,
            obra_social_id: 2, // Swiss Medical
            administrativo_id: 1,
            fecha_nacimiento: new Date('1990-07-02'),
            fecha_ingreso: new Date('2023-02-20'),
            estado: 'Activo',
            fecha_egreso: new Date('2023-01-10'),
            observaciones: 'Control anual',
            created_at: new Date(),
            updated_at: new Date()
      },
      
        ], { transaction });
      }

      // 6. Insert Medicos
      const medicoUsuario = usuarios.find(u => u.nombre === 'Dr. García');
      const especialidad = especialidades.find(e => e.nombre === 'Cardiología');
      const sector = sectores.find(s => s.nombre === 'Administración');
      if (medicoUsuario && especialidad && sector) {
        await queryInterface.bulkInsert('medicos', [
          {
            usuario_id: medicoUsuario.id,
            especialidad_id: especialidad.id,
            sector_id: sector.id,
            matricula: 'MED123',
            created_at: new Date(),
            updated_at: new Date()
          }
        ], { transaction });
      }

      // 7. Insert Enfermeros
      const enfermeroUsuario = usuarios.find(u => u.nombre === 'Enf. López');
      if (enfermeroUsuario && sector) {
        await queryInterface.bulkInsert('enfermeros', [
          {
            usuario_id: enfermeroUsuario.id,
            sector_id: sector.id,
            created_at: new Date(),
            updated_at: new Date()
          }
        ], { transaction });
      }

      // 8. Insert Administrativos
      const adminUsuario = usuarios.find(u => u.nombre === 'Admin 1');
      if (adminUsuario && sector) {
        await queryInterface.bulkInsert('administrativos', [
          {
            usuario_id: adminUsuario.id,
            sector_id: sector.id,
            turno_id: null, // Will be assigned later if needed
            responsabilidad: 'General',
            estado: 'Activo',
            descripcion: 'Administrativo general',
            created_at: new Date(),
            updated_at: new Date()
          }
        ], { transaction });
      }

      // 9. Update administrativo_id in Pacientes
      const admin = await queryInterface.sequelize.query(
        'SELECT id FROM administrativos WHERE usuario_id = :usuario_id',
        {
          replacements: { usuario_id: adminUsuario.id },
          type: queryInterface.sequelize.QueryTypes.SELECT,
          transaction
        }
      );
      if (admin.length > 0) {
        await queryInterface.bulkUpdate('pacientes', {
          administrativo_id: admin[0].id
        }, { usuario_id: pacienteUsuario.id }, { transaction });
      }
       await queryInterface.bulkDelete('Admisiones', null, { transaction });
      await queryInterface.bulkDelete('Turnos', null, { transaction });
      await queryInterface.bulkDelete('TurnosPersonal', null, { transaction });
      await queryInterface.bulkDelete('Camas', null, { transaction });
      await queryInterface.bulkDelete('Habitaciones', null, { transaction });
      await queryInterface.bulkInsert('Habitaciones', [
        {
          id: 1,
          tipo_servicio_id: 1,
          tipo_internacion_id: 2,
          numero: '101',
          tipo_habitacion: 'General',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          tipo_servicio_id: 2,
          tipo_internacion_id: 1,
          numero: 'Q1',
          tipo_habitacion: 'Quirofano',
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { transaction });

      await queryInterface.bulkInsert('Camas', [
        {
          id: 1,
          habitacion_id: 1,
          numero: '101-A',
          estado: 'Disponible',
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { transaction });

      await queryInterface.bulkInsert('TurnosPersonal', [
        {
          id: 1,
          sector_id: 1,
          hora_inicio: '2025-05-30 08:00:00',
          hora_fin: '2025-05-30 16:00:00',
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { transaction });

      await queryInterface.bulkInsert('Turnos', [
        {
          id: 1,
          paciente_id: 4,
          medico_id: 2,
          tipo_turno_id: 1,
          fecha: '2025-05-30 10:00:00',
          estado: 'Pendiente',
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { transaction });

      await queryInterface.bulkInsert('Admisiones', [
        {
          id: 1,
          paciente_id: 4,
          administrativo_id: 1,
          estado: 'Pendiente',
          fecha: '2025-05-30',
          motivo_id: 1,
          medico_id: 1, 
          sector_id: 1,
          especialidad_id: 1,
          tipo_estudio_id: null,
          forma_ingreso_id: 1,
          turno_id: 1,
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { transaction });

      // Actualizar turno_id en Administrativos
      await queryInterface.bulkUpdate('Administrativos', {
        turno_id: 1
      }, { usuario_id: 1 }, { transaction });


       await queryInterface.bulkDelete('ControlesEnfermeria', null, { transaction });
      await queryInterface.bulkDelete('ProcedimientosPreQuirurgicos', null, { transaction });
      await queryInterface.bulkDelete('ProcedimientosEnfermeria', null, { transaction });
      await queryInterface.bulkDelete('EvaluacionesEnfermeria', null, { transaction });
      await queryInterface.bulkDelete('ListasEsperas', null, { transaction });
      await queryInterface.bulkDelete('TurnosEstudios', null, { transaction });
      await queryInterface.bulkDelete('EstudiosSolicitados', null, { transaction });
      await queryInterface.bulkDelete('Diagnosticos', null, { transaction });
      await queryInterface.bulkDelete('EvaluacionesMedicas', null, { transaction });

   
      await queryInterface.bulkInsert(
        "EvaluacionesMedicas",
        [
          {
            id: 1,
            paciente_id: 101,
            medico_id: 201,
            tratamiento_id: 301,
            fecha: new Date("2023-05-15T10:30:00"),
            observaciones_diagnostico:
              "Paciente presenta fiebre persistente y dolor de cabeza",
            diagnostico_id: 401,
            estudio_solicitado_id: 501,
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 2,
            paciente_id: 102,
            medico_id: 202,
            tratamiento_id: 302,
            fecha: new Date("2023-05-16T11:15:00"),
            observaciones_diagnostico:
              "Control postoperatorio sin complicaciones",
            diagnostico_id: 402,
            estudio_solicitado_id: 502,
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 3,
            paciente_id: 103,
            medico_id: 203,
            tratamiento_id: null,
            fecha: new Date("2023-05-17T09:00:00"),
            observaciones_diagnostico:
              "Paciente con síntomas de alergia estacional",
            diagnostico_id: 403,
            estudio_solicitado_id: 503,
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 4,
            paciente_id: 104,
            medico_id: 204,
            tratamiento_id: 303,
            fecha: new Date("2023-05-18T16:45:00"),
            observaciones_diagnostico: "Seguimiento de tratamiento crónico",
            diagnostico_id: 404,
            estudio_solicitado_id: null,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        "Diagnosticos",
        [
          {
            id: 401,
            codigo: "J18.9",
            tipoDiagnostico_id: 1,
            nombre: "Neumonía, no especificada",
            descripcion: "Infección pulmonar de causa no determinada",
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 402,
            codigo: "Z48.0",
            tipoDiagnostico_id: 2,
            nombre: "Atención a herida quirúrgica",
            descripcion: "Control postoperatorio de herida",
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 403,
            codigo: "J30.9",
            tipoDiagnostico_id: 1,
            nombre: "Rinitis alérgica no especificada",
            descripcion: "Alergia nasal con estornudos y congestión",
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 404,
            codigo: "I10",
            tipoDiagnostico_id: 3,
            nombre: "Hipertensión esencial",
            descripcion:
              "Presión arterial elevada sin causa secundaria identificable",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        "EstudiosSolicitados",
        [
          {
            id: 501,
            paciente_id: 101,
            evaluacion_medica_id: 1,
            tipo_estudio_id: 1,
            estado: "Pendiente",
            observaciones: "Realizar en ayunas",
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 502,
            paciente_id: 102,
            evaluacion_medica_id: 2,
            tipo_estudio_id: 2,
            estado: "Realizado",
            observaciones: "Resultados dentro de parámetros normales",
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 503,
            paciente_id: 103,
            evaluacion_medica_id: 3,
            tipo_estudio_id: 3,
            estado: "Pendiente",
            observaciones: "Confirmar alergenos específicos",
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 504,
            paciente_id: 104,
            evaluacion_medica_id: 4,
            tipo_estudio_id: 4,
            estado: "Cancelado",
            observaciones: "Paciente no asistió a la cita",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        "TurnosEstudios",
        [
          {
            id: 1,
            estudio_solicitado_id: 501,
            fecha: new Date("2023-05-20"),
            hora: "08:30:00",
            estado: "Pendiente",
            resultado: null,
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 2,
            estudio_solicitado_id: 502,
            fecha: new Date("2023-05-18"),
            hora: "10:15:00",
            estado: "Realizado",
            resultado: "Hemograma completo dentro de parámetros normales",
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 3,
            estudio_solicitado_id: 503,
            fecha: new Date("2023-05-22"),
            hora: "14:00:00",
            estado: "Pendiente",
            resultado: null,
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 4,
            estudio_solicitado_id: 504,
            fecha: new Date("2023-05-19"),
            hora: "16:45:00",
            estado: "Cancelado",
            resultado: null,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        "ListasEsperas",
        [
          {
            id: 1,
            paciente_id: 101,
            especialidad_id: 1,
            prioridad: 2,
            tipo: "EVALUACION",
            tipo_estudio_id: null,
            estado: "PENDIENTE",
            fecha_registro: new Date("2023-05-10T09:15:00"),
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 2,
            paciente_id: 102,
            especialidad_id: null,
            prioridad: 1,
            tipo: "ESTUDIO",
            tipo_estudio_id: 2,
            estado: "ASIGNADO",
            fecha_registro: new Date("2023-05-11T10:30:00"),
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 3,
            paciente_id: 103,
            especialidad_id: 3,
            prioridad: 3,
            tipo: "INTERNACION",
            tipo_estudio_id: null,
            estado: "COMPLETADO",
            fecha_registro: new Date("2023-05-12T14:45:00"),
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 4,
            paciente_id: 104,
            especialidad_id: 2,
            prioridad: 1,
            tipo: "CIRUGIA",
            tipo_estudio_id: null,
            estado: "PENDIENTE",
            fecha_registro: new Date("2023-05-13T16:20:00"),
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        "EvaluacionesEnfermeria",
        [
          {
            id: 1,
            paciente_id: 101,
            enfermero_id: 301,
            medico_id: 201,
            fecha: new Date("2023-05-14T08:30:00"),
            signos_vitales:'{"presion":"120/85","pulso":68,"temp":37.0}',
            procedimiento_pre_quirurgico_id: 1,
            nivel_triaje: "Verde",
            observaciones: "Paciente estable, sin quejas",
            procedimiento_enfermeria_id: 1,
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 2,
            paciente_id: 102,
            enfermero_id: 302,
            medico_id: 202,
            fecha: new Date("2023-05-15T10:15:00"),
            signos_vitales:'{"presion":"130/85","pulso":68,"temp":37.0}',
            procedimiento_pre_quirurgico_id: null,
            nivel_triaje: "Amarillo",
            observaciones: "Paciente con dolor moderado",
            procedimiento_enfermeria_id: 2,
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 3,
            paciente_id: 103,
            enfermero_id: 303,
            medico_id: 203,
            fecha: new Date("2023-05-16T13:45:00"),
            signos_vitales: '{"presion":"110/85","pulso":90,"temp":37.0}',
            procedimiento_pre_quirurgico_id: 2,
            nivel_triaje: "Verde",
            observaciones: "Preparación para cirugía programada",
            procedimiento_enfermeria_id: null,
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 4,
            paciente_id: 104,
            enfermero_id: 304,
            medico_id: 204,
            fecha: new Date("2023-05-17T16:20:00"),
            signos_vitales: '{"presion":"150/75","pulso":88,"temp":41.0}',
            procedimiento_pre_quirurgico_id: null,
            nivel_triaje: "Rojo",
            observaciones: "Paciente con dificultad respiratoria",
            procedimiento_enfermeria_id: 3,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        "ProcedimientosEnfermeria",
        [
          {
            id: 1,
            evaluacion_id: 1,
            tratamiento_id: 301,
            descripcion: "Aplicación de vacuna antigripal",
            duracion_estimada: 15,
            requiere_preparacion: false,
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 2,
            evaluacion_id: 2,
            tratamiento_id: 302,
            descripcion: "Curación de herida postquirúrgica",
            duracion_estimada: 30,
            requiere_preparacion: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 3,
            evaluacion_id: 4,
            tratamiento_id: null,
            descripcion: "Administración de oxígeno complementario",
            duracion_estimada: 45,
            requiere_preparacion: false,
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 4,
            evaluacion_id: 3,
            tratamiento_id: 303,
            descripcion: "Preparación preoperatoria",
            duracion_estimada: 60,
            requiere_preparacion: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        "ProcedimientosPreQuirurgicos",
        [
          {
            id: 1,
            evaluacion_medica_id: 1,
            nombre: "Preparación intestinal",
            descripcion: "Dieta líquida y laxantes previo a colonoscopía",
            estado: "Completado",
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 2,
            evaluacion_medica_id: 3,
            nombre: "Ayuno prequirúrgico",
            descripcion: "8 horas de ayuno antes de cirugía programada",
            estado: "Pendiente",
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 3,
            evaluacion_medica_id: 2,
            nombre: "Pruebas de coagulación",
            descripcion: "Estudios de coagulación previo a cirugía mayor",
            estado: "Completado",
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 4,
            evaluacion_medica_id: 4,
            nombre: "Evaluación cardiológica",
            descripcion: "Evaluación preoperatoria por cardiología",
            estado: "Pendiente",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        "ControlesEnfermeria",
        [
          {
            id: 1,
            evaluacion_enfermeria_id: 1,
            alergias: "Penicilina, sulfas",
            antecedentes_familiares:
              "Padre con diabetes, madre con hipertensión",
            antecedentes_personales: "Asma en la infancia",
            grupo_sanguineo: "A",
            factor_rh: "Positivo",
            peso: 68.5,
            altura: 1.72,
            presion_arterial: 120,
            frecuencia_cardiaca: "72 lpm",
            frecuencia_respiratoria: 16,
            temperatura: 36.5,
            nivel_oxigeno: "98%",
            nivel_glucosa: 92,
            nivel_colesterol: "180 mg/dL",
            nivel_trigliceridos: "120 mg/dL",
            nivel_creatinina: "0.9 mg/dL",
            nivel_urea: "28 mg/dL",
            nivel_acido_urico: "5.2 mg/dL",
            nivel_hb: "14 g/dL",
            nivel_hct: "42%",
            nivel_leucocitos: "7500/mm3",
            nivel_plaquetas: "250000/mm3",
            nivel_proteinas: "7.2 g/dL",
            nivel_albumina: "4.0 g/dL",
            nivel_globulina: "3.2 g/dL",
            nivel_fosfatasa: "80 UI/L",
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 2,
            evaluacion_enfermeria_id: 2,
            alergias: "Ninguna conocida",
            antecedentes_familiares: "Abuela con cáncer de mama",
            antecedentes_personales: "Apéndicectomía a los 15 años",
            grupo_sanguineo: "B",
            factor_rh: "Negativo",
            peso: 75.2,
            altura: 1.68,
            presion_arterial: 130,
            frecuencia_cardiaca: "68 lpm",
            frecuencia_respiratoria: 18,
            temperatura: 37.0,
            nivel_oxigeno: "96%",
            nivel_glucosa: 105,
            nivel_colesterol: "210 mg/dL",
            nivel_trigliceridos: "150 mg/dL",
            nivel_creatinina: "1.1 mg/dL",
            nivel_urea: "32 mg/dL",
            nivel_acido_urico: "6.0 mg/dL",
            nivel_hb: "13 g/dL",
            nivel_hct: "39%",
            nivel_leucocitos: "8200/mm3",
            nivel_plaquetas: "210000/mm3",
            nivel_proteinas: "7.0 g/dL",
            nivel_albumina: "3.8 g/dL",
            nivel_globulina: "3.2 g/dL",
            nivel_fosfatasa: "85 UI/L",
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 3,
            evaluacion_enfermeria_id: 3,
            alergias: "Mariscos, yodo",
            antecedentes_familiares: "Padre con enfermedad coronaria",
            antecedentes_personales: "Hipertensión controlada",
            grupo_sanguineo: "O",
            factor_rh: "Positivo",
            peso: 82.0,
            altura: 1.75,
            presion_arterial: 135,
            frecuencia_cardiaca: "76 lpm",
            frecuencia_respiratoria: 17,
            temperatura: 36.8,
            nivel_oxigeno: "97%",
            nivel_glucosa: 98,
            nivel_colesterol: "195 mg/dL",
            nivel_trigliceridos: "140 mg/dL",
            nivel_creatinina: "1.0 mg/dL",
            nivel_urea: "30 mg/dL",
            nivel_acido_urico: "5.8 mg/dL",
            nivel_hb: "15 g/dL",
            nivel_hct: "45%",
            nivel_leucocitos: "6800/mm3",
            nivel_plaquetas: "230000/mm3",
            nivel_proteinas: "7.4 g/dL",
            nivel_albumina: "4.2 g/dL",
            nivel_globulina: "3.2 g/dL",
            nivel_fosfatasa: "75 UI/L",
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 4,
            evaluacion_enfermeria_id: 4,
            alergias: "Polvo, ácaros",
            antecedentes_familiares: "Madre con artritis reumatoide",
            antecedentes_personales: "Diabetes tipo 2",
            grupo_sanguineo: "AB",
            factor_rh: "Positivo",
            peso: 90.5,
            altura: 1.8,
            presion_arterial: 140,
            frecuencia_cardiaca: "82 lpm",
            frecuencia_respiratoria: 20,
            temperatura: 37.2,
            nivel_oxigeno: "92%",
            nivel_glucosa: 160,
            nivel_colesterol: "230 mg/dL",
            nivel_trigliceridos: "180 mg/dL",
            nivel_creatinina: "1.3 mg/dL",
            nivel_urea: "38 mg/dL",
            nivel_acido_urico: "6.5 mg/dL",
            nivel_hb: "14.5 g/dL",
            nivel_hct: "43%",
            nivel_leucocitos: "9000/mm3",
            nivel_plaquetas: "240000/mm3",
            nivel_proteinas: "7.6 g/dL",
            nivel_albumina: "4.1 g/dL",
            nivel_globulina: "3.5 g/dL",
            nivel_fosfatasa: "90 UI/L",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );
      await queryInterface.bulkDelete('RecetasCertificados', null, { transaction });
      await queryInterface.bulkDelete('Reclamos', null, { transaction });
      await queryInterface.bulkDelete('Notificaciones', null, { transaction });
      await queryInterface.bulkDelete('Noticias', null, { transaction });
      await queryInterface.bulkDelete('AltasMedicas', null, { transaction });
      await queryInterface.bulkDelete('Pagos', null, { transaction });
      await queryInterface.bulkDelete('Facturas', null, { transaction });
      await queryInterface.bulkDelete('HistorialesMedicos', null, { transaction });
      await queryInterface.bulkDelete('SolicitudesDerivaciones', null, { transaction });
      await queryInterface.bulkDelete('IntervencionesQuirurgicas', null, { transaction });
      await queryInterface.bulkDelete('Internaciones', null, { transaction });
      
    
      await queryInterface.bulkInsert('Internaciones', [
        {
          id: 1,
          paciente_id: 4,
          cama_id: 1,
          admision_id: 1,
          fecha_inicio: '2025-05-20',
          fecha_fin: null,
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { transaction });

      await queryInterface.bulkInsert('IntervencionesQuirurgicas', [
        {
          id: 1,
          paciente_id: 4,
          medico_id: 2,
          habitacion_id: 2,
          internacion_id: 1,
          procedimiento_pre_quirurgico_id: 1,
          fecha: '2025-05-21',
          resultado: 'Exito',
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { transaction });

      await queryInterface.bulkInsert('SolicitudesDerivaciones', [
        {
          id: 1,
          paciente_id: 4,
          origen_id: 1,
          destino_id: 2,
          tipo: 'Interna',
          estado: 'Pendiente',
          fecha: '2025-05-20',
          motivo: 'Evaluación traumatológica',
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { transaction });

      await queryInterface.bulkInsert('HistorialesMedicos', [
        {
          id: 1,
          paciente_id: 4,
          motivo_consulta_id: 1,
          descripcion: 'Consulta por dolor torácico',
          tipo_evento: 'Consulta',
          fecha: '2025-05-20',
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { transaction });

      await queryInterface.bulkInsert('Facturas', [
        {
          id: 1,
          paciente_id: 4,
          admision_id: 1,
          monto: 1500.50,
          descripcion: 'Consulta y estudios',
          fecha_emision: '2025-05-20',
          estado: 'Pendiente',
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { transaction });

      await queryInterface.bulkInsert('Pagos', [
        {
          id: 1,
          factura_id: 1,
          obra_social_id: 1,
          paciente_id: 4,
          monto: 1500.50,
          fecha: '2025-05-21',
          metodo: 'Obra Social',
          estado: 'Completado',
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { transaction });

      await queryInterface.bulkInsert('AltasMedicas', [
        {
          id: 1,
          paciente_id: 4,
          medico_id: 2,
          internacion_id: 1,
          fecha_alta: '2025-05-25',
          tipo_alta: 'Medica',
          estado_paciente: 'Estable',
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { transaction });

      await queryInterface.bulkInsert('Noticias', [
        {
          id: 1,
          titulo: 'Nuevo horario de atención',
          contenido: 'El hospital amplía su horario.',
          usuario_id: 1,
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { transaction });

      await queryInterface.bulkInsert('Notificaciones', [
        {
          id: 1,
          usuario_id: 4,
          mensaje: 'Nueva factura generada.',
          leida: false,
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { transaction });

      await queryInterface.bulkInsert('Reclamos', [
        {
          id: 1,
          paciente_id: 4,
          descripcion: 'Demora en atención',
          estado: 'Pendiente',
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { transaction });

      await queryInterface.bulkInsert('RecetasCertificados', [
        {
          id: 1,
          paciente_id: 4,
          medico_id: 2,
          tipo: 'Receta',
          descripcion: 'Medicación para dolor',
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { transaction });

 await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction });
      await transaction.commit();
      console.log('✅ \u2705 \u2705Seeder "up" ejecutado correctamente');
    } catch (error) {
      console.error('❌Error en seeder "up":', error.message);
      await transaction.rollback();
      throw error;
    }
   
  },
  
  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkDelete('tratamientos', null, { transaction });
      await queryInterface.bulkDelete('sectores', null, { transaction });
      await queryInterface.bulkDelete('especialidades', null, { transaction });
      await queryInterface.bulkDelete('obrassociales', null, { transaction });
      await queryInterface.bulkDelete('motivosconsultas', null, { transaction });
      await queryInterface.bulkDelete('formasingreso', null, { transaction });
      await queryInterface.bulkDelete('motivosadmision', null, { transaction });
      await queryInterface.bulkDelete('tipos_turno', null, { transaction });
      await queryInterface.bulkDelete('tiposestudio', null, { transaction });
      await queryInterface.bulkDelete('tiposdiagnostico', null, { transaction });
      await queryInterface.bulkDelete('tiposinternacion', null, { transaction });
      await queryInterface.bulkDelete('tiposdeservicio', null, { transaction });
      await queryInterface.bulkDelete('roles', null, { transaction });
      await queryInterface.bulkDelete('Administrativos', null, { transaction });
      await queryInterface.bulkDelete('Enfermeros', null, { transaction });
      await queryInterface.bulkDelete('Medicos', null, { transaction });
      await queryInterface.bulkDelete('Pacientes', null, { transaction });
      await queryInterface.bulkDelete('Usuarios', null, { transaction });
      await queryInterface.bulkDelete('Admisiones', null, { transaction });
      await queryInterface.bulkDelete('Turnos', null, { transaction });
      await queryInterface.bulkDelete('TurnosPersonal', null, { transaction });
      await queryInterface.bulkDelete('Camas', null, { transaction });
      await queryInterface.bulkDelete('Habitaciones', null, { transaction });
      await queryInterface.bulkDelete('ControlesEnfermeria', null, { transaction });
      await queryInterface.bulkDelete('ProcedimientosPreQuirurgicos', null, { transaction });
      await queryInterface.bulkDelete('ProcedimientosEnfermeria', null, { transaction });
      await queryInterface.bulkDelete('EvaluacionesEnfermeria', null, { transaction });
      await queryInterface.bulkDelete('ListasEsperas', null, { transaction });
      await queryInterface.bulkDelete('TurnosEstudios', null, { transaction });
      await queryInterface.bulkDelete('EstudiosSolicitados', null, { transaction });
      await queryInterface.bulkDelete('Diagnosticos', null, { transaction });
      await queryInterface.bulkDelete('EvaluacionesMedicas', null, { transaction });
      await queryInterface.bulkDelete('RecetasCertificados', null, { transaction });
      await queryInterface.bulkDelete('Reclamos', null, { transaction });
      await queryInterface.bulkDelete('Notificaciones', null, { transaction });
      await queryInterface.bulkDelete('Noticias', null, { transaction });
      await queryInterface.bulkDelete('AltasMedicas', null, { transaction });
      await queryInterface.bulkDelete('Pagos', null, { transaction });
      await queryInterface.bulkDelete('Facturas', null, { transaction });
      await queryInterface.bulkDelete('HistorialesMedicos', null, { transaction });
      await queryInterface.bulkDelete('SolicitudesDerivaciones', null, { transaction });
      await queryInterface.bulkDelete('IntervencionesQuirurgicas', null, { transaction });
      await queryInterface.bulkDelete('Internaciones', null, { transaction });

      await transaction.commit();
      console.log('✅ Seeder "down" ejecutado correctamente: datos eliminados');
    } catch (error) {
      await transaction.rollback();
      console.error('❌Error en seeder "down":', error.message);
      throw error;
    }
  }
};