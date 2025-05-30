`use strict`;
const bcrypt = require("bcryptjs");
module.exports = async function() {
  up: async (queryInterface, Sequelize) => {

    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1. Tabla roles
      await queryInterface.createTable('roles', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        nombre: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { transaction });
      // 2. Tabla tipos_servicio
      await queryInterface.createTable('tipos_servicio', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        nombre: {
          type: Sequelize.STRING(100),
          allowNull: false
        },
        descripcion: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { transaction });
      // 3. Tabla tipos_internacion
      await queryInterface.createTable('tipos_internacion', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        nombre: {
          type: Sequelize.STRING(100),
          allowNull: false
        },
        descripcion: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        tipo_habitacion: {
          type: Sequelize.STRING(50),
          allowNull: false
        },
        cantidad_camas: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        cantidad_enfermeros: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        estado_paciente_default: {
          type: Sequelize.STRING(50),
          allowNull: false
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { transaction });
      // 4. Tabla tipos_diagnostico
      await queryInterface.createTable('tipos_diagnostico', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        nombre: {
          type: Sequelize.STRING(100),
          allowNull: false
        },
        descripcion: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        sistema_clasificacion: {
          type: Sequelize.STRING(20),
          allowNull: false
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { transaction });
      // 5. Tabla tipos_estudio
      await queryInterface.createTable('tipos_estudio', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        nombre: {
          type: Sequelize.STRING(100),
          allowNull: false
        },
        categoria: {
          type: Sequelize.STRING(50),
          allowNull: false
        },
        requiere_ayuno: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { transaction });
      // 6. Tabla tipos_turno
      await queryInterface.createTable('tipos_turno', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        nombre: {
          type: Sequelize.STRING(50),
          allowNull: false
        },
        descripcion: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { transaction });
      // 7. Tabla obras_sociales
      await queryInterface.createTable('obras_sociales', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        nombre: {
          type: Sequelize.STRING(100),
          allowNull: false
        },
        descripcion: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { transaction });
      // 8. Tabla especialidades
      await queryInterface.createTable('especialidades', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        nombre: {
          type: Sequelize.STRING(100),
          allowNull: false
        },
        descripcion: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { transaction });
      // 9. Tabla usuarios
      await queryInterface.createTable('usuarios', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        dni: {
          type: Sequelize.STRING(20),
          allowNull: false,
          unique: true
        },
        nombre: {
          type: Sequelize.STRING(100),
          allowNull: false
        },
        email: {
          type: Sequelize.STRING(100),
          allowNull: false,
          unique: true
        },
        password: {
          type: Sequelize.STRING(255),
          allowNull: false
        },
        rol_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'roles', key: 'id' }
        },
        telefono: {
          type: Sequelize.STRING(20),
          allowNull: true
        },
        fecha_nacimiento: {
          type: Sequelize.DATEONLY,
          allowNull: true
        },
        sexo: {
          type: Sequelize.STRING(10),
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { transaction });
      // 10. Tabla medicos
      await queryInterface.createTable('medicos', {
        usuario_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          references: { model: 'usuarios', key: 'id' }
        },
        matricula: {
          type: Sequelize.STRING(20),
          allowNull: false,
          unique: true
        },
        especialidad_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'especialidades', key: 'id' }
        },
        sector_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'sectores', key: 'id' }
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { transaction });
      // 11. Tabla enfermeros
      await queryInterface.createTable('enfermeros', {
        usuario_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          references: { model: 'usuarios', key: 'id' }
        },
        sector_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'sectores', key: 'id' }
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { transaction });
      // 12. Tabla administrativos
      await queryInterface.createTable('administrativos', {
        usuario_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          references: {
            model: 'usuarios',
            key: 'id'
          }
        },
        sector_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'sectores',
            key: 'id'
          }
        },
        responsabilidad: {
          type: Sequelize.ENUM('Expediente', 'Turnos', 'Legajos', 'Derivaciones', 'General', 'Otros'),
          defaultValue: 'General'
        },
        descripcion: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { transaction });
      // 13. Tabla sectores
      await queryInterface.createTable('sectores', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        nombre: {
          type: Sequelize.STRING(100),
          allowNull: false,
          unique: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { transaction });

      // 14. Tabla pacientes
      await queryInterface.createTable('pacientes', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        dni: {
          type: Sequelize.STRING(20),
          allowNull: false,
          unique: true
        },
        nombre: {
          type: Sequelize.STRING(100),
          allowNull: false
        },
        usuario_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'usuarios',
            key: 'id'
          }
        },
        administrativo_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'administrativos',
            key: 'usuario_id'
          }
        },
        obra_social_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'obras_sociales',
            key: 'id'
          }
        },
        fecha_nacimiento: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        sexo: {
          type: Sequelize.ENUM('Masculino', 'Femenino', 'Otro'),
          allowNull: true
        },
        fecha_ingreso: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        fecha_egreso: {
          type: Sequelize.DATEONLY,
          allowNull: true
        },
        estado: {
          type: Sequelize.ENUM('Activo', 'Inactivo', 'Baja'),
          defaultValue: 'Activo'
        },
        observaciones: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { transaction });

      // 15. Tabla habitaciones
      await queryInterface.createTable('habitaciones', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        codigo: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true
        },
        tipo: {
          type: Sequelize.ENUM('Individual', 'Doble', 'Colectiva'),
          allowNull: false
        },
        sexo_permitido: {
          type: Sequelize.ENUM('Masculino', 'Femenino', 'Mixto'),
          defaultValue: 'Mixto'
        },
        tipo_internacion_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'tipos_internacion',
            key: 'id'
          }
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { transaction });

      // 16. Tabla camas
      await queryInterface.createTable('camas', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        habitacion_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'habitaciones',
            key: 'id'
          }
        },
        numero: {
          type: Sequelize.STRING(10),
          allowNull: false
        },
        estado: {
          type: Sequelize.ENUM('Libre', 'Ocupada', 'EnLimpieza'),
          defaultValue: 'Libre'
        },
        fecha_fin_limpieza: {
          type: Sequelize.DATE,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { transaction });

      // 17. Tabla listas_espera
      await queryInterface.createTable('listas_espera', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        paciente_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'pacientes',
            key: 'id'
          }
        },
        tipo: {
          type: Sequelize.ENUM('ESTUDIO', 'EVALUACION', 'INTERNACION', 'CIRUGIA'),
          allowNull: false
        },
        tipo_estudio_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'tipos_estudio',
            key: 'id'
          }
        },
        especialidad_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'especialidades',
            key: 'id'
          }
        },
        prioridad: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 2
        },
        estado: {
          type: Sequelize.ENUM('PENDIENTE', 'ASIGNADO', 'CANCELADO', 'COMPLETADO'),
          defaultValue: 'PENDIENTE'
        },
        fecha_registro: {
          type: Sequelize.DATE,
          allowNull: false
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { transaction });

      // 18. Tabla turnos
      await queryInterface.createTable('turnos', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        paciente_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'pacientes',
            key: 'id'
          }
        },
        medico_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'medicos',
            key: 'usuario_id'
          }
        },
        especialidad_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'especialidades',
            key: 'id'
          }
        },
        fecha: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        hora: {
          type: Sequelize.TIME,
          allowNull: false
        },
        estado: {
          type: Sequelize.ENUM('PENDIENTE', 'ATENDIDO', 'CANCELADO'),
          defaultValue: 'PENDIENTE'
        },
        observaciones: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { transaction });

      // 19. Tabla turnos_personal
      await queryInterface.createTable('turnos_personal', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        usuario_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'usuarios',
            key: 'id'
          }
        },
        tipo: {
          type: Sequelize.ENUM('GUARDIA_ACTIVA', 'GUARDIA_PASIVA', 'ATENCION'),
          allowNull: false
        },
        dias: {
          type: Sequelize.STRING(100),
          allowNull: false
        },
        hora_inicio: {
          type: Sequelize.TIME,
          allowNull: false
        },
        hora_fin: {
          type: Sequelize.TIME,
          allowNull: false
        },
        sector_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'sectores',
            key: 'id'
          }
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { transaction });

      // 20. Tabla estudios_solicitados
      await queryInterface.createTable('estudios_solicitados', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        evaluacion_medica_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'evaluaciones_medicas',
            key: 'id'
          }
        },
        paciente_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'pacientes',
            key: 'id'
          }
        },
        tipo_estudio_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'tipos_estudio',
            key: 'id'
          }
        },
        urgencia: {
          type: Sequelize.ENUM('NORMAL', 'ALTA'),
          defaultValue: 'NORMAL'
        },
        estado: {
          type: Sequelize.ENUM('PENDIENTE', 'REALIZADO', 'CANCELADO'),
          defaultValue: 'PENDIENTE'
        },
        observaciones: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { transaction });

      // 21. Tabla turnos_estudios
      await queryInterface.createTable('turnos_estudios', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        estudio_solicitado_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'estudios_solicitados',
            key: 'id'
          }
        },
        fecha: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        hora: {
          type: Sequelize.TIME,
          allowNull: false
        },
        estado: {
          type: Sequelize.ENUM('PENDIENTE', 'REALIZADO', 'CANCELADO'),
          defaultValue: 'PENDIENTE'
        },
        resultado: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { transaction });

      // 22. Tabla diagnosticos
      await queryInterface.createTable('diagnosticos', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        tipoDiagnostico_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'tipos_diagnostico',
            key: 'id'
          }
        },
        nombre: {
          type: Sequelize.STRING(100),
          allowNull: false
        },
        descripcion: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { transaction });

      // 23. Tabla evaluaciones_medicas
      await queryInterface.createTable('evaluaciones_medicas', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        paciente_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'pacientes',
            key: 'id'
          }
        },
        medico_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'medicos',
            key: 'usuario_id'
          }
        },
        fecha: {
          type: Sequelize.DATE,
          allowNull: false
        },
        diagnostico_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'diagnosticos',
            key: 'id'
          }
        },
        tratamiento_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'tratamientos',
            key: 'id'
          }
        },
        estudio_solicitado_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'estudios_solicitados',
            key: 'id'
          }
        },
        observaciones: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { transaction });

      // 24. Tabla internaciones
      await queryInterface.createTable('internaciones', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        paciente_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'pacientes',
            key: 'id'
          }
        },
        medico_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'medicos',
            key: 'usuario_id'
          }
        },
        cama_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'camas',
            key: 'id'
          }
        },
        tipo_internacion_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'tipos_internacion',
            key: 'id'
          }
        },
        administrativo_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'administrativos',
            key: 'usuario_id'
          }
        },
        evaluacion_medica_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'evaluaciones_medicas',
            key: 'id'
          }
        },
        intervencion_quirurgica_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'intervenciones_quirurgicas',
            key: 'id'
          }
        },
        es_prequirurgica: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        estado_operacion: {
          type: Sequelize.ENUM('Prequirurgico', 'Postquirurgico', 'No aplica'),
          defaultValue: 'No aplica'
        },
        estado_estudios: {
          type: Sequelize.ENUM('Completos', 'Pendientes'),
          defaultValue: 'Pendientes'
        },
        estado_paciente: {
          type: Sequelize.ENUM('Estable', 'Grave', 'Crítico'),
          defaultValue: 'Sin Evaluar'
        },
        fecha_inicio: {
          type: Sequelize.DATE,
          allowNull: false
        },
        fecha_cirugia: {
          type: Sequelize.DATE,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { transaction });

      // 25. Tabla intervenciones_quirurgicas
      await queryInterface.createTable('intervenciones_quirurgicas', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        paciente_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'pacientes',
            key: 'id'
          }
        },
        medico_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'medicos',
            key: 'usuario_id'
          }
        },
        quirofano_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'quirofanos',
            key: 'id'
          }
        },
        evaluacion_medica_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'evaluaciones_medicas',
            key: 'id'
          }
        },
        tipo_procedimiento: {
          type: Sequelize.STRING(100),
          allowNull: false
        },
        fecha_inicio: {
          type: Sequelize.DATE,
          allowNull: false
        },
        fecha_fin: {
          type: Sequelize.DATE,
          allowNull: true
        },
        resultado_cirugia: {
          type: Sequelize.ENUM('Fallecio', 'NecesitaInternacionHabitacion', 'NecesitaInternacionUCI', 'AltaDirecta', 'Complicaciones'),
          allowNull: true
        },
        observaciones: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { transaction });

      // 26. Tabla procedimientos_enfermeria
      await queryInterface.createTable('procedimientos_enfermeria', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        nombre: {
          type: Sequelize.STRING(100),
          allowNull: false
        },
        descripcion: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        duracion_estimada: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        requiere_preparacion: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        evaluacion_medica_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'evaluaciones_medicas',
            key: 'id'
          }
        },
        tratamiento_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'tratamientos',
            key: 'id'
          }
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { transaction });

      // 27. Tabla procedimientos_pre_quirurgicos
      await queryInterface.createTable('procedimientos_pre_quirurgicos', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        evaluacion_medica_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'evaluaciones_medicas',
            key: 'id'
          }
        },
        nombre: {
          type: Sequelize.STRING(100),
          allowNull: false
        },
        descripcion: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        estado: {
          type: Sequelize.ENUM('Pendiente', 'Completado'),
          defaultValue: 'Pendiente'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { transaction });

      // 28. Tabla recetas_certificados
      await queryInterface.createTable('recetas_certificados', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        evaluacion_medica_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'evaluaciones_medicas',
            key: 'id'
          }
        },
        tipo: {
          type: Sequelize.ENUM('RECETA', 'CERTIFICADO'),
          allowNull: false
        },
        contenido: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        fecha: {
          type: Sequelize.DATE,
          allowNull: false
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { transaction });
      // 29. Tabla tratamientos
      await queryInterface.createTable('tratamientos', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        paciente_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'pacientes',
            key: 'id'
          }
        },
        evaluacion_medica_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'evaluaciones_medicas',
            key: 'id'
          }
        },
        descripcion: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        fecha_inicio: {
          type: Sequelize.DATE,
          allowNull: false
        },
        fecha_fin_estimada: {
          type: Sequelize.DATE,
          allowNull: true
        },
        estado: {
          type: Sequelize.ENUM('Activo', 'Finalizado', 'Suspendido'),
          defaultValue: 'Activo'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { transaction });
      // 30. Tabla quirofanos
      




      // Roles del sistema
      await queryInterface.bulkInsert(
        "roles",
        [
          {
            id: 1,
            nombre: "Administrador",
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 2,
            nombre: "Médico",
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 3,
            nombre: "Enfermero",
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 4,
            nombre: "Paciente",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      // Tipos de servicio
      await queryInterface.bulkInsert(
        "tipos_servicio",
        [
          {
            id: 1,
            nombre: "Quirúrgico",
            descripcion: "Servicios quirúrgicos especializados",
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 2,
            nombre: "Clínico",
            descripcion: "Atención clínica general",
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 3,
            nombre: "Diagnóstico",
            descripcion: "Servicios de diagnóstico por imágenes y laboratorio",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      // Tipos de internación
      await queryInterface.bulkInsert(
        "tipos_internacion",
        [
          {
            id: 1,
            nombre: "UTI",
            descripcion: "Unidad de Terapia Intensiva",
            tipo_habitacion: "Individual",
            cantidad_camas: 1,
            cantidad_enfermeros: 2,
            estado_paciente_default: "Crítico",
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 2,
            nombre: "General",
            descripcion: "Internación general",
            tipo_habitacion: "Doble",
            cantidad_camas: 2,
            cantidad_enfermeros: 1,
            estado_paciente_default: "Estable",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      // Tipos de diagnóstico
      await queryInterface.bulkInsert(
        "tipos_diagnostico",
        [
          {
            id: 1,
            nombre: "Infección respiratoria",
            descripcion: "Infecciones del sistema respiratorio",
            sistema_clasificacion: "CIE-10",
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 2,
            nombre: "Fractura ósea",
            descripcion: "Fracturas óseas",
            sistema_clasificacion: "CIE-10",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      // Tipos de estudio
      await queryInterface.bulkInsert(
        "tipos_estudio",
        [
          {
            id: 1,
            nombre: "Radiografía de tórax",
            categoria: "Imagenología",
            requiere_ayuno: false,
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 2,
            nombre: "Análisis de sangre",
            categoria: "Laboratorio",
            requiere_ayuno: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      // Tipos de turno
      await queryInterface.bulkInsert(
        "tipos_turno",
        [
          {
            id: 1,
            nombre: "MEDICO",
            descripcion: "Turnos para consultas médicas",
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 2,
            nombre: "ESTUDIO",
            descripcion: "Turnos para estudios médicos",
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 3,
            nombre: "PERSONAL",
            descripcion: "Turnos para personal del hospital",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      // Obras sociales
      await queryInterface.bulkInsert(
        "obras_sociales",
        [
          {
            id: 1,
            nombre: "OSDE",
            descripcion: "Obra social privada",
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 2,
            nombre: "PAMI",
            descripcion: "Obra social para jubilados",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      // Especialidades médicas
      await queryInterface.bulkInsert(
        "especialidades",
        [
          {
            id: 1,
            nombre: "Cardiología",
            descripcion: "Especialidad en enfermedades del corazón",
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 2,
            nombre: "Traumatología",
            descripcion: "Especialidad en traumatismos y fracturas",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      // Hashear contraseñas
      const hashedPassword = await bcrypt.hash("password123", 10);

      // Usuarios
      await queryInterface.bulkInsert(
        "usuarios",
        [
          {
            id: 1,
            dni: "12345678",
            nombre: "Juan Pérez",
            email: "juan.perez@hospital.com",
            password: hashedPassword,
            rol_id: 1,
            telefono: "1234567890",
            fecha_nacimiento: "1980-05-15",
            sexo: "Masculino",
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 2,
            dni: "87654321",
            nombre: "María Gómez",
            email: "maria.gomez@hospital.com",
            password: hashedPassword,
            rol_id: 2,
            telefono: "0987654321",
            fecha_nacimiento: "1975-03-22",
            sexo: "Femenino",
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 3,
            dni: "11223344",
            nombre: "Carlos López",
            email: "carlos.lopez@hospital.com",
            password: hashedPassword,
            rol_id: 3,
            telefono: "1122334455",
            fecha_nacimiento: "1985-07-10",
            sexo: "Masculino",
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 4,
            dni: "44332211",
            nombre: "Ana Rodríguez",
            email: "ana.rodriguez@hospital.com",
            password: hashedPassword,
            rol_id: 4,
            telefono: "6677889900",
            fecha_nacimiento: "1990-11-30",
            sexo: "Femenino",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      // Médicos
      await queryInterface.bulkInsert(
        "medicos",
        [
          {
            usuario_id: 2,
            matricula: "M12345",
            especialidad_id: 1,
            sector_id: 1,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      // Enfermeros
      await queryInterface.bulkInsert(
        "enfermeros",
        [
          {
            usuario_id: 3,
            sector_id: 1,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      // Administrativos
      await queryInterface.bulkInsert(
        "administrativos",
        [
          {
            usuario_id: 1,
            sector_id: 1,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      // Sectores
      await queryInterface.bulkInsert(
        "sectores",
        [
          {
            id: 1,
            nombre: "Cardiología",
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 2,
            nombre: "Traumatología",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      // Pacientes
      await queryInterface.bulkInsert(
        "pacientes",
        [
          {
            id: 1,
            dni: "44332211",
            nombre: "Ana Rodríguez",
            usuario_id: 4,
            administrativo_id: 1,
            obra_social_id: 1,
            fecha_nacimiento: "1990-11-30",
            sexo: "Femenino",
            fecha_ingreso: "2025-05-01",
            estado: "Activo",
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 2,
            dni: "99887766",
            nombre: "Luis Fernández",
            usuario_id: null,
            administrativo_id: 1,
            obra_social_id: 2,
            fecha_nacimiento: "1965-04-12",
            sexo: "Masculino",
            fecha_ingreso: "2025-05-10",
            estado: "Activo",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      // Habitaciones
      await queryInterface.bulkInsert(
        "habitaciones",
        [
          {
            id: 1,
            codigo: "UTI-101",
            tipo: "Individual",
            sexo_permitido: "Mixto",
            tipo_internacion_id: 1,
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 2,
            codigo: "GEN-201",
            tipo: "Doble",
            sexo_permitido: "Mixto",
            tipo_internacion_id: 2,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      // Camas
      await queryInterface.bulkInsert(
        "camas",
        [
          {
            id: 1,
            habitacion_id: 1,
            numero: "101",
            estado: "Libre",
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 2,
            habitacion_id: 2,
            numero: "201",
            estado: "Libre",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      // Lista de espera
      await queryInterface.bulkInsert(
        "listas_espera",
        [
          {
            id: 1,
            paciente_id: 1,
            tipo: "EVALUACION",
            especialidad_id: 1,
            prioridad: 1,
            estado: "PENDIENTE",
            fecha_registro: "2025-05-20",
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 2,
            paciente_id: 2,
            tipo: "ESTUDIO",
            tipo_estudio_id: 2,
            prioridad: 2,
            estado: "PENDIENTE",
            fecha_registro: "2025-05-22",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      // Turnos para pacientes
      await queryInterface.bulkInsert(
        "turnos",
        [
          {
            id: 1,
            paciente_id: 1,
            medico_id: 2,
            especialidad_id: 1,
            fecha: "2025-05-30",
            hora: "09:00:00",
            estado: "PENDIENTE",
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 2,
            paciente_id: 2,
            fecha: "2025-05-31",
            hora: "10:00:00",
            estado: "PENDIENTE",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      // Turnos para personal
      await queryInterface.bulkInsert(
        "turnos_personal",
        [
          {
            id: 1,
            usuario_id: 3,
            tipo: "GUARDIA_ACTIVA",
            dias: "Lunes,Martes",
            hora_inicio: "08:00:00",
            hora_fin: "16:00:00",
            sector_id: 1,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      // Estudios solicitados
      await queryInterface.bulkInsert(
        "estudios_solicitados",
        [
          {
            id: 1,
            paciente_id: 2,
            medico_id: 2,
            tipo_estudio_id: 2,
            urgencia: "Normal",
            estado: "Pendiente",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      // Turnos para estudios
      await queryInterface.bulkInsert(
        "turnos_estudios",
        [
          {
            id: 1,
            estudio_solicitado_id: 1,
            fecha: "2025-05-31",
            hora: "10:00:00",
            estado: "Pendiente",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      // Diagnósticos
      await queryInterface.bulkInsert(
        "diagnosticos",
        [
          {
            id: 1,
            tipoDiagnostico_id: 1,
            codigo: "J18.9",
            nombre: "Neumonía, no especificada",
            descripcion: "Infección respiratoria aguda",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      // Evaluaciones médicas
      await queryInterface.bulkInsert(
        "evaluaciones_medicas",
        [
          {
            id: 1,
            paciente_id: 1,
            medico_id: 2,
            fecha: "2025-05-20",
            diagnostico_id: 1,
            observaciones: "Paciente con fiebre y tos",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      // Internaciones
      await queryInterface.bulkInsert(
        "internaciones",
        [
          {
            id: 1,
            paciente_id: 1,
            medico_id: 2,
            cama_id: 1,
            tipo_internacion_id: 1,
            administrativo_id: 1,
            evaluacion_medica_id: 1,
            es_prequirurgica: false,
            estado_operacion: "No aplica",
            estado_estudios: "Completos",
            estado_paciente: "Estable",
            fecha_inicio: "2025-05-20",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      // Intervenciones quirúrgicas
      await queryInterface.bulkInsert(
        "intervenciones_quirurgicas",
        [
          {
            id: 1,
            paciente_id: 2,
            medico_id: 2,
            quirofano_id: 1,
            evaluacion_medica_id: 1,
            tipo_procedimiento: "Apendicectomía",
            fecha_inicio: "2025-06-01",
            resultado_cirugia: "NecesitaInternacionHabitacion",
            observaciones: "Cirugía de apendicitis sin complicaciones",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      // Procedimientos de enfermería
      await queryInterface.bulkInsert(
        "procedimientos_enfermeria",
        [
          {
            id: 1,
            nombre: "Control de signos vitales",
            descripcion: "Medición de presión arterial y frecuencia cardíaca",
            duracion_estimada: 15,
            requiere_preparacion: false,
            evaluacion_medica_id: 1,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      // Procedimientos pre-quirúrgicos
      await queryInterface.bulkInsert(
        "procedimientos_pre_quirurgicos",
        [
          {
            id: 1,
            evaluacion_medica_id: 1,
            nombre: "Ayuno prequirúrgico",
            descripcion: "Ayuno de 8 horas antes de la cirugía",
            estado: "Completado",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      // Recetas y certificados
      await queryInterface.bulkInsert(
        "recetas_certificados",
        [
          {
            id: 1,
            evaluacion_medica_id: 1,
            tipo: "RECETA",
            contenido: "Paracetamol 500mg cada 8 horas",
            fecha: "2025-05-20",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      // Facturas
      await queryInterface.bulkInsert(
        "facturas",
        [
          {
            id: 1,
            paciente_id: 1,
            monto: 1500.5,
            descripcion: "Consulta médica y estudios",
            fecha_emision: "2025-05-20",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      // Pagos
      await queryInterface.bulkInsert(
        "pagos",
        [
          {
            id: 1,
            factura_id: 1,
            obra_social_id: 1,
            monto: 1500.5,
            fecha: "2025-05-21",
            metodo: "Obra Social",
            estado: "Completado",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      // Noticias
      await queryInterface.bulkInsert(
        "noticias",
        [
          {
            id: 1,
            titulo: "Nueva unidad de UTI",
            texto: "Se inaugura una nueva unidad de terapia intensiva.",
            fecha: "2025-05-25",
            autor_id: 1,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      // Notificaciones
      await queryInterface.bulkInsert(
        "notificaciones",
        [
          {
            id: 1,
            usuario_id: 4,
            mensaje: "Se ha generado una nueva factura por $1500.50",
            leida: false,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      // Reclamos
      await queryInterface.bulkInsert(
        "reclamos",
        [
          {
            id: 1,
            usuario_id: 4,
            paciente_id: 1,
            descripcion: "Demora en la atención del turno",
            estado: "Pendiente",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );
      // En seed-part1.js
      await queryInterface.bulkCreate(
        "FormasIngreso",
        [
          { id: 1, nombre: "Urgencia", descripcion: "Ingreso por emergencia" },
          { id: 2, nombre: "Programado", descripcion: "Ingreso planificado" },
        ],
        { transaction }
      );

      await queryInterface.bulkCreate(
        "MotivosAdmision",
        [
          {
            id: 1,
            nombre: "Cirugía",
            descripcion: "Admisión para procedimiento quirúrgico",
          },
          {
            id: 2,
            nombre: "Consulta",
            descripcion: "Admisión para evaluación médica",
          },
        ],
        { transaction }
      );

      await queryInterface.bulkCreate(
        "MotivosConsultas",
        [
          {
            id: 1,
            nombre: "Dolor torácico",
            descripcion: "Consulta por dolor en el pecho",
          },
          {
            id: 2,
            nombre: "Fractura",
            descripcion: "Consulta por lesión ósea",
          },
        ],
        { transaction }
      );

      await queryInterface.bulkCreate(
        "Tratamientos",
        [
          {
            id: 1,
            nombre: "Antibióticos",
            descripcion: "Tratamiento con antibióticos para infección",
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 2,
            nombre: "Fisioterapia",
            descripcion: "Rehabilitación física",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );
      await queryInterface.bulkCreate(
        "Admisiones",
        [
          {
            id: 1,
            paciente_id: 1,
            administrativo_id: 1,
            estado: "Pendiente",
            fecha: "2025-05-20",
            motivo_id: 1,
            forma_ingreso_id: 1,
            turno_id: 1,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      await queryInterface.bulkCreate(
        "ControlesEnfermeria",
        [
          {
            id: 1,
            evaluacion_enfermeria_id: 1,
            alergias: "Ninguna",
            peso: 70.5,
            altura: 1.65,
            presion_arterial: 120.5,
            frecuencia_cardiaca: 80,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      await queryInterface.bulkCreate(
        "EvaluacionesEnfermeria",
        [
          {
            id: 1,
            paciente_id: 1,
            enfermero_id: 3,
            medico_id: 2,
            fecha: "2025-05-20",
            nivel_triaje: "Verde",
            observaciones: "Paciente estable",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      await queryInterface.bulkCreate(
        "HistorialesMedicos",
        [
          {
            id: 1,
            paciente_id: 1,
            motivo_consulta_id: 1,
            descripcion: "Consulta por dolor torácico",
            tipo_evento: "Consulta",
            fecha: "2025-05-20",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      await queryInterface.bulkCreate(
        "SolicitudesDerivaciones",
        [
          {
            id: 1,
            paciente_id: 1,
            origen_id: 1,
            destino_id: 2,
            tipo: "Interna",
            estado: "Pendiente",
            fecha: "2025-05-20",
            motivo: "Necesita evaluación traumatológica",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      await queryInterface.bulkCreate(
        "AltasMedicas",
        [
          {
            id: 1,
            paciente_id: 1,
            medico_id: 2,
            internacion_id: 1,
            fecha_alta: "2025-05-25",
            tipo_alta: "Medica",
            estado_paciente: "Estable",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Eliminar en orden inverso a la creación
      await queryInterface.bulkDelete("reclamos", null, { transaction });
      await queryInterface.bulkDelete("notificaciones", null, { transaction });
      await queryInterface.bulkDelete("noticias", null, { transaction });
      await queryInterface.bulkDelete("pagos", null, { transaction });
      await queryInterface.bulkDelete("facturas", null, { transaction });
      await queryInterface.bulkDelete("recetas_certificados", null, {
        transaction,
      });
      await queryInterface.bulkDelete("procedimientos_pre_quirurgicos", null, {
        transaction,
      });
      await queryInterface.bulkDelete("procedimientos_enfermeria", null, {
        transaction,
      });
      await queryInterface.bulkDelete("intervenciones_quirurgicas", null, {
        transaction,
      });
      await queryInterface.bulkDelete("internaciones", null, { transaction });
      await queryInterface.bulkDelete("evaluaciones_medicas", null, {
        transaction,
      });
      await queryInterface.bulkDelete("diagnosticos", null, { transaction });
      await queryInterface.bulkDelete("turnos_estudios", null, { transaction });
      await queryInterface.bulkDelete("estudios_solicitados", null, {
        transaction,
      });
      await queryInterface.bulkDelete("turnos_personal", null, { transaction });
      await queryInterface.bulkDelete("turnos", null, { transaction });
      await queryInterface.bulkDelete("listas_espera", null, { transaction });
      await queryInterface.bulkDelete("camas", null, { transaction });
      await queryInterface.bulkDelete("habitaciones", null, { transaction });
      await queryInterface.bulkDelete("pacientes", null, { transaction });
      await queryInterface.bulkDelete("sectores", null, { transaction });
      await queryInterface.bulkDelete("administrativos", null, { transaction });
      await queryInterface.bulkDelete("enfermeros", null, { transaction });
      await queryInterface.bulkDelete("medicos", null, { transaction });
      await queryInterface.bulkDelete("usuarios", null, { transaction });
      await queryInterface.bulkDelete("especialidades", null, { transaction });
      await queryInterface.bulkDelete("obras_sociales", null, { transaction });
      await queryInterface.bulkDelete("tipos_turno", null, { transaction });
      await queryInterface.bulkDelete("tipos_estudio", null, { transaction });
      await queryInterface.bulkDelete("tipos_diagnostico", null, {
        transaction,
      });
      await queryInterface.bulkDelete("tipos_internacion", null, {
        transaction,
      });
      await queryInterface.bulkDelete("tipos_servicio", null, { transaction });
      await queryInterface.bulkDelete("roles", null, { transaction });
      await queryInterface.bulkDelete("FormasIngreso", null, {
        transaction,
      });
      await queryInterface.bulkDelete("MotivosAdmision", null, {
        transaction,
      });
      await queryInterface.bulkDelete("MotivosConsultas", null, {
        transaction,
      });
      await queryInterface.bulkDelete("Tratamientos", null, { transaction });
      await queryInterface.bulkDelete("Admisiones", null, { transaction });
      await queryInterface.bulkDelete("ControlesEnfermeria", null, {
        transaction,
      });
      await queryInterface.bulkDelete("EvaluacionesEnfermeria", null, {
        transaction,
      });
      await queryInterface.bulkDelete("HistorialesMedicos", null, {
        transaction,
      });
      await queryInterface.bulkDelete("SolicitudesDerivaciones", null, {
        transaction,
      });
      await queryInterface.bulkDelete("AltasMedicas", null, { transaction });


      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};

