
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log('📦 Migración 06: Creando internaciones y tablas finales...');

      // ===================================
      // INTERNACIONES (sin intervencion_quirurgica_id que se agrega en 07)
      // ===================================
      await queryInterface.createTable('internaciones', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        paciente_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'pacientes', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        medico_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'medicos', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        cama_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'camas', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        tipo_internacion_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'tiposinternacion', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        administrativo_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'administrativos', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        evaluacion_medica_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'evaluacionesmedicas', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        es_prequirurgica: { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: true },
        estado_operacion: {
          type: Sequelize.ENUM('Prequirurgico', 'Postquirurgico', 'No aplica'),
          defaultValue: 'No aplica'
        },
        estado_estudios: {
          type: Sequelize.ENUM('Completos', 'Pendientes'),
          defaultValue: 'Pendientes'
        },
        estado_paciente: {
          type: Sequelize.ENUM('Estable', 'Grave', 'Critico', 'Fallecido', 'Sin_Evaluar'),
          allowNull: false,
          defaultValue: 'Sin_Evaluar'
        },
        fecha_inicio: { type: Sequelize.DATE, allowNull: true },
        fecha_cirugia: { type: Sequelize.DATE, allowNull: true },
        obra_social_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'obrassociales', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        fecha_alta: { type: Sequelize.DATE, allowNull: true },
        lista_espera_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'listasesperas', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        admision_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'admisiones', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        habitacion_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'habitaciones', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction, engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

      await queryInterface.addIndex('internaciones', ['paciente_id'], { transaction });
      await queryInterface.addIndex('internaciones', ['medico_id'], { transaction });
      await queryInterface.addIndex('internaciones', ['administrativo_id'], { transaction });
      await queryInterface.addIndex('internaciones', ['evaluacion_medica_id'], { transaction });
      await queryInterface.addIndex('internaciones', ['obra_social_id'], { transaction });
      await queryInterface.addIndex('internaciones', ['admision_id'], { transaction });
      await queryInterface.addIndex('internaciones', ['fecha_inicio'], { transaction });
      await queryInterface.addIndex('internaciones', ['fecha_alta'], { transaction });
      await queryInterface.addIndex('internaciones', ['cama_id'], { transaction });
      await queryInterface.addIndex('internaciones', ['tipo_internacion_id'], { transaction });
      await queryInterface.addIndex('internaciones', ['lista_espera_id'], { transaction });
      await queryInterface.addIndex('internaciones', ['habitacion_id'], { transaction });

      // ===================================
      // INTERVENCIONES QUIRURGICAS
      // ===================================
      await queryInterface.createTable('intervencionesquirurgicas', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        paciente_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'pacientes', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        medico_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'medicos', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        habitacion_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'habitaciones', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        evaluacion_medica_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'evaluacionesmedicas', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        tipo_procedimiento: { type: Sequelize.STRING(100), allowNull: false },
        fecha_inicio: { type: Sequelize.DATE, allowNull: false },
        fecha_fin: { type: Sequelize.DATE, allowNull: true },
        lista_espera_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'listasesperas', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        resultado_cirugia: {
          type: Sequelize.ENUM('Fallecio', 'NecesitaInternacionHabitacion', 'NecesitaInternacionUCI', 'AltaDirecta', 'Complicaciones'),
          allowNull: true
        },
        observaciones: { type: Sequelize.TEXT, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction, engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

      await queryInterface.addIndex('intervencionesquirurgicas', ['paciente_id'], { transaction });
      await queryInterface.addIndex('intervencionesquirurgicas', ['medico_id'], { transaction });
      await queryInterface.addIndex('intervencionesquirurgicas', ['habitacion_id'], { transaction });
      await queryInterface.addIndex('intervencionesquirurgicas', ['evaluacion_medica_id'], { transaction });
      await queryInterface.addIndex('intervencionesquirurgicas', ['fecha_inicio'], { transaction });
      await queryInterface.addIndex('intervencionesquirurgicas', ['fecha_fin'], { transaction });
      await queryInterface.addIndex('intervencionesquirurgicas', ['lista_espera_id'], { transaction });

      // ===================================
      // ALTAS MEDICAS
      // ===================================
      await queryInterface.createTable('altasmedicas', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        paciente_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'pacientes', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        medico_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'medicos', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        fecha_alta: { type: Sequelize.DATE, allowNull: false },
        tipo_alta: {
          type: Sequelize.ENUM('Voluntaria', 'Medica', 'Contraindicada','Procedimiento'),
          allowNull: false
        },
        instrucciones_post_alta: { type: Sequelize.TEXT, allowNull: true },
        internacion_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'internaciones', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        estado_paciente: {
          type: Sequelize.ENUM('Estable', 'Grave', 'Critico', 'Fallecido', 'Sin_Evaluar'),
          allowNull: false,
          defaultValue: 'Sin_Evaluar'
        },
        admision_id: {  
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'admisiones', key: 'id' }
        },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction, engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

      await queryInterface.addIndex('altasmedicas', ['paciente_id'], { transaction });
      await queryInterface.addIndex('altasmedicas', ['medico_id'], { transaction });
      await queryInterface.addIndex('altasmedicas', ['fecha_alta'], { transaction });
      await queryInterface.addIndex('altasmedicas', ['internacion_id'], { transaction });
      await queryInterface.addIndex('altasmedicas', ['estado_paciente'], { transaction });
      await queryInterface.addIndex('altasmedicas', ['tipo_alta'], { transaction });
      await queryInterface.addIndex('altasmedicas', ['admision_id'], { transaction });

      // ===================================
      // HISTORIALES MEDICOS
      // ===================================
      await queryInterface.createTable('historialesmedicos', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        paciente_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'pacientes', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        admision_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'admisiones', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        motivo_consulta_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'motivosconsultas', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        descripcion: { type: Sequelize.TEXT, allowNull: false },
        tipo_evento: {
          type: Sequelize.ENUM('Consulta', 'Internacion', 'Cirugia', 'Estudio', 'Otro'),
          allowNull: false
        },
        fecha: { type: Sequelize.DATE, allowNull: false },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction, engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

      await queryInterface.addIndex('historialesmedicos', ['paciente_id'], { transaction });
      await queryInterface.addIndex('historialesmedicos', ['motivo_consulta_id'], { transaction });
      await queryInterface.addIndex('historialesmedicos', ['fecha'], { transaction });
      await queryInterface.addIndex('historialesmedicos', ['admision_id'], { transaction });

      // ===================================
      // FACTURAS
      // ===================================
      await queryInterface.createTable('facturas', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        paciente_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'pacientes', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        monto: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
        obra_social_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'obrassociales', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        descripcion: { type: Sequelize.TEXT, allowNull: true },
        fecha_emision: { type: Sequelize.DATE, allowNull: false },
        estado: {
          type: Sequelize.ENUM('Pendiente', 'Pagada', 'Cancelada'),
          defaultValue: 'Pendiente'
        },
        admision_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'admisiones', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        tipo_pago: {
          type: Sequelize.ENUM('Efectivo', 'Cheque', 'Tarjeta', 'Transferencia', 'Obra Social', 'SISTEMA PUBLICO'),
          allowNull: false
        },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction, engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

      await queryInterface.addIndex('facturas', ['paciente_id'], { transaction });
      await queryInterface.addIndex('facturas', ['fecha_emision'], { transaction });
      await queryInterface.addIndex('facturas', ['obra_social_id'], { transaction });
      await queryInterface.addIndex('facturas', ['estado'], { transaction });
      await queryInterface.addIndex('facturas', ['admision_id'], { transaction });
      await queryInterface.addIndex('facturas', ['tipo_pago'], { transaction });

      // ===================================
      // PAGOS
      // ===================================
      await queryInterface.createTable('pagos', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        paciente_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'pacientes', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        factura_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'facturas', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        obra_social_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'obrassociales', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        monto: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
        fecha: { type: Sequelize.DATE, allowNull: false },
        metodo: {
          type: Sequelize.ENUM('Efectivo', 'Tarjeta', 'Transferencia', 'Obra Social', 'SISTEMA PUBLICO'),
          allowNull: false
        },
        estado: {
          type: Sequelize.ENUM('Pendiente', 'Completado', 'Rechazado'),
          defaultValue: 'Pendiente'
        },
        motivo_rechazo: { type: Sequelize.TEXT, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction, engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

      await queryInterface.addIndex('pagos', ['factura_id'], { transaction });
      await queryInterface.addIndex('pagos', ['obra_social_id'], { transaction });
      await queryInterface.addIndex('pagos', ['fecha'], { transaction });
      await queryInterface.addIndex('pagos', ['estado'], { transaction });
      await queryInterface.addIndex('pagos', ['paciente_id'], { transaction });

      // ===================================
      // SOLICITUDES DERIVACIONES
      // ===================================
      await queryInterface.createTable('solicitudesderivaciones', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        paciente_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'pacientes', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        origen_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'sectores', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        destino_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'sectores', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        tipo: {
          type: Sequelize.ENUM('Interna', 'Externa'),
          allowNull: false
        },
        estado: {
          type: Sequelize.ENUM('Pendiente', 'Aprobada', 'Rechazada'),
          allowNull: false
        },
        fecha: { type: Sequelize.DATE, allowNull: false },
        motivo: { type: Sequelize.TEXT, allowNull: true },
        responsable_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'usuarios', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction, engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

      await queryInterface.addIndex('solicitudesderivaciones', ['paciente_id'], { transaction });
      await queryInterface.addIndex('solicitudesderivaciones', ['origen_id'], { transaction });
      await queryInterface.addIndex('solicitudesderivaciones', ['destino_id'], { transaction });
      await queryInterface.addIndex('solicitudesderivaciones', ['tipo'], { transaction });
      await queryInterface.addIndex('solicitudesderivaciones', ['estado'], { transaction });
      await queryInterface.addIndex('solicitudesderivaciones', ['fecha'], { transaction });

      // ===================================
      // RECETAS CERTIFICADOS
      // ===================================
      await queryInterface.createTable('recetascertificados', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        paciente_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'pacientes', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        tipo: {
          type: Sequelize.ENUM('Receta Medica', 'Certificado'),
          allowNull: false
        },
        contenido: { type: Sequelize.TEXT, allowNull: false },
        fecha: { type: Sequelize.DATE, allowNull: false },
        medico_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'medicos', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        evaluacion_medica_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'evaluacionesmedicas', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction, engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

      await queryInterface.addIndex('recetascertificados', ['paciente_id'], { transaction });
      await queryInterface.addIndex('recetascertificados', ['medico_id'], { transaction });
      await queryInterface.addIndex('recetascertificados', ['evaluacion_medica_id'], { transaction });

      // ===================================
      // NOTICIAS
      // ===================================
      await queryInterface.createTable('noticias', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        titulo: { type: Sequelize.STRING(255), allowNull: false },
        texto: { type: Sequelize.TEXT, allowNull: false },
        fecha: { type: Sequelize.DATE, allowNull: false },
        autor_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'usuarios', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction, engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

      await queryInterface.addIndex('noticias', ['autor_id'], { transaction });
      await queryInterface.addIndex('noticias', ['fecha'], { transaction });

    // ===================================
    // NOTIFICACIONES
    // ===================================
      await queryInterface.createTable('notificaciones', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        usuario_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'usuarios', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        remitente_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'usuarios', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        eliminado: { type: Sequelize.BOOLEAN, defaultValue: false },
        mensaje: { type: Sequelize.TEXT, allowNull: false }, 
        leida: { type: Sequelize.BOOLEAN, defaultValue: false },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction, engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

      await queryInterface.addIndex('notificaciones', ['usuario_id'], { transaction });
      await queryInterface.addIndex('notificaciones', ['remitente_id'], { transaction }); 
      await queryInterface.addIndex('notificaciones', ['leida'], { transaction });
      await queryInterface.addIndex('notificaciones', ['eliminado'], { transaction }); 
      await queryInterface.addIndex('notificaciones', ['created_at'], { transaction }); 
      // ===================================
      // RECLAMOS
      // ===================================
      await queryInterface.createTable('reclamos', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        usuario_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'usuarios', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        texto: { type: Sequelize.TEXT, allowNull: false },
        fecha: { type: Sequelize.DATE, allowNull: false },
        estado: {
          type: Sequelize.ENUM('Pendiente', 'Resuelto'),
          allowNull: false
        },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction, engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

      await queryInterface.addIndex('reclamos', ['usuario_id'], { transaction });
      await queryInterface.addIndex('reclamos', ['estado'], { transaction });
      await queryInterface.addIndex('reclamos', ['fecha'], { transaction });

      await transaction.commit();
      console.log('✅ Migración 06: Internaciones y tablas finales creadas exitosamente');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error en migración 06:', error.message);
      throw error;
    }
  },

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('reclamos', { transaction });
      await queryInterface.dropTable('notificaciones', { transaction });
      await queryInterface.dropTable('noticias', { transaction });
      await queryInterface.dropTable('recetascertificados', { transaction });
      await queryInterface.dropTable('solicitudesderivaciones', { transaction });
      await queryInterface.dropTable('pagos', { transaction });
      await queryInterface.dropTable('facturas', { transaction });
      await queryInterface.dropTable('historialesmedicos', { transaction });
      await queryInterface.dropTable('altasmedicas', { transaction });
      await queryInterface.dropTable('intervencionesquirurgicas', { transaction });
      await queryInterface.dropTable('internaciones', { transaction });
      
      await transaction.commit();
      console.log('✅ Migración 06: Revertida exitosamente');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error al revertir migración 06:', error.message);
      throw error;
    }
  }
};