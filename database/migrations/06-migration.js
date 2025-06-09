module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable('Internaciones', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    paciente_id: { type: Sequelize.INTEGER, allowNull: false },
    medico_id: { type: Sequelize.INTEGER, allowNull: false },
    cama_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'Camas', key: 'id' } }, 
    tipo_internacion_id: { type: Sequelize.INTEGER, allowNull: true,references: { model: 'TiposInternacion', key: 'id'} },
    administrativo_id: { type: Sequelize.INTEGER, allowNull: false },
    evaluacion_medica_id: { type: Sequelize.INTEGER, allowNull: true ,references: {model: 'EvaluacionesMedicas', key: 'id' }},
    intervencion_quirurgica_id: { type: Sequelize.INTEGER, allowNull: true },
    es_prequirurgica: { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: false }, 
    estado_operacion: { type: Sequelize.ENUM('Prequirurgico', 'Postquirurgico', 'No aplica'), defaultValue: 'No aplica' },
    estado_estudios: { type: Sequelize.ENUM('Completos', 'Pendientes'), defaultValue: 'Pendientes' },
    estado_paciente: { type: Sequelize.ENUM('Estable', 'Grave', 'Crítico', 'Sin Evaluar'), defaultValue: 'Sin Evaluar', allowNull: false },
    fecha_inicio: { type: Sequelize.DATE, allowNull: true },
    fecha_cirugia: { type: Sequelize.DATE, allowNull: true },
    fecha_alta: { type: Sequelize.DATE, allowNull: true },
    lista_espera_id: { type: Sequelize.INTEGER,allowNull: true, references: { model: 'ListasEsperas', key: 'id' } },
    admision_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'Admisiones', key: 'id' } },
    created_at: { type: Sequelize.DATE, allowNull: false },
    updated_at: { type: Sequelize.DATE, allowNull: false }
  }, {
      }, { transaction, indexes: [{ fields: ['paciente_id'] }, { fields: ['cama_id'] }, { fields: ['admision_id'] } ] });
      await queryInterface.addConstraint('Internaciones', {
  fields: ['intervencion_quirurgica_id'],
  type: 'foreign key',
  name: 'fk_internaciones_intervencion_quirurgica',
  references: { table: 'IntervencionesQuirurgicas', field: 'id' },
  onUpdate: 'CASCADE',
  onDelete: 'SET NULL'
}, { transaction });

      await queryInterface.createTable('SolicitudesDerivaciones', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        paciente_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Pacientes', key: 'usuario_id' } },
        origen_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Sectores', key: 'id' } },
        destino_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Sectores', key: 'id' } },
        tipo: { type: Sequelize.ENUM('Interna', 'Externa'), allowNull: false },
        estado: { type: Sequelize.ENUM('Pendiente', 'Aprobada', 'Rechazada'), allowNull: false },
        fecha: { type: Sequelize.DATE, allowNull: false },
        motivo: { type: Sequelize.TEXT, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      }, { transaction, indexes: [{ fields: ['paciente_id'] }, { fields: ['origen_id'] }, { fields: ['destino_id'] } ]});

      await queryInterface.createTable('HistorialesMedicos', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        paciente_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Pacientes', key: 'usuario_id' } },
        motivo_consulta_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'MotivosConsultas', key: 'id' } },
        descripcion: { type: Sequelize.TEXT, allowNull: false },
        tipo_evento: { type: Sequelize.ENUM('Consulta', 'Internacion', 'Cirugia', 'Estudio', 'Otro'), allowNull: false },
        fecha: { type: Sequelize.DATE, allowNull: false },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      }, { transaction, indexes: [{ fields: ['paciente_id'] }, { fields: ['motivo_consulta_id'] } ]});

      await queryInterface.createTable('Facturas', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        paciente_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Pacientes', key: 'usuario_id' } },
        admision_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'Admisiones', key: 'id' } },
        monto: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
        descripcion: { type: Sequelize.TEXT, allowNull: true },
        fecha_emision: { type: Sequelize.DATE, allowNull: false },
        estado: { type: Sequelize.ENUM('Pendiente', 'Pagada', 'Cancelada'), defaultValue: 'Pendiente' },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      }, { transaction, indexes: [{ fields: ['paciente_id'] }, { fields: ['admision_id'] } ]});

      await queryInterface.createTable('Pagos', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        factura_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Facturas', key: 'id' } },
        obra_social_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'ObrasSociales', key: 'id' } },
        paciente_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'Pacientes', key: 'usuario_id' } },
        monto: { type: Sequelize.DECIMAL(10,2), allowNull: false },
        fecha: { type: Sequelize.DATE, allowNull: false },
        metodo: { type: Sequelize.ENUM('Efectivo', 'Tarjeta', 'Transferencia', 'Obra Social'), allowNull: false },
        estado: { type: Sequelize.ENUM('Pendiente', 'Completado', 'Rechazado'), defaultValue: 'Pendiente' },
        motivo_rechazo: { type: Sequelize.TEXT, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      }, { transaction, indexes: [{ fields: ['factura_id'] }, { fields: ['obra_social_id'] }, { fields: ['paciente_id'] } ] });

      await queryInterface.createTable('AltasMedicas', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        paciente_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Pacientes', key: 'usuario_id' } },
        medico_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Medicos', key: 'usuario_id' } },
        internacion_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Internaciones', key: 'id' } },
        fecha_alta: { type: Sequelize.DATE, allowNull: false },
        tipo_alta: { type: Sequelize.ENUM('Voluntaria', 'Medica', 'Contraindicada'), allowNull: false },
        estado_paciente: { type: Sequelize.ENUM('Estable', 'Crítico', 'Fallecido'), allowNull: false },
        instrucciones_post_alta: { type: Sequelize.TEXT, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      }, { transaction, indexes: [{ fields: ['paciente_id'] }, { fields: ['medico_id'] }, { fields: ['internacion_id'] } ] });

      await queryInterface.createTable('Noticias', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        titulo: { type: Sequelize.STRING(100), allowNull: false },
        contenido: { type: Sequelize.TEXT, allowNull: false },
        usuario_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'Usuarios', key: 'id' } },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      }, { transaction, indexes: [{ fields: ['usuario_id'] } ] });

      await queryInterface.createTable('Notificaciones', {
        id : { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        usuario_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Usuarios', key: 'id' } },
        mensaje: { type: Sequelize.TEXT, allowNull: false },
        leida: { type: Sequelize.BOOLEAN, defaultValue: false },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      }, { transaction, indexes: [{ fields: ['usuario_id'] } ] });

      await queryInterface.createTable('Reclamos', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        paciente_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Pacientes', key: 'usuario_id' } },
        descripcion: { type: Sequelize.TEXT, allowNull: false },
        estado: { type: Sequelize.ENUM('Pendiente', 'Resuelto', 'Rechazado'), defaultValue: 'Pendiente' },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      }, { transaction, indexes: [{ fields: ['paciente_id'] } ] });

      await queryInterface.createTable('RecetasCertificados', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        paciente_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Pacientes', key: 'usuario_id' } },
        medico_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Medicos', key: 'usuario_id' } },
        tipo: { type: Sequelize.ENUM('Receta', 'Certificado'), allowNull: false },
        descripcion: { type: Sequelize.TEXT, allowNull: false },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      }, { transaction, indexes: [{ fields: ['paciente_id'] }, { fields: ['medico_id'] } ] });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('RecetasCertificados', { transaction });
      await queryInterface.dropTable('Reclamos', { transaction });
      await queryInterface.dropTable('Notificaciones', { transaction });
      await queryInterface.dropTable('Noticias', { transaction });
      await queryInterface.dropTable('AltasMedicas', { transaction });
      await queryInterface.dropTable('Pagos', { transaction });
      await queryInterface.dropTable('Facturas', { transaction });
      await queryInterface.dropTable('HistorialesMedicos', { transaction });
      await queryInterface.dropTable('SolicitudesDerivaciones', { transaction });
      await queryInterface.dropTable('IntervencionesQuirurgicas', { transaction });
      await queryInterface.dropTable('Internaciones', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};