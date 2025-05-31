module.exports = {
  up: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
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

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
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
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};