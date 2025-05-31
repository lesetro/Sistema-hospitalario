module.exports = {
  up: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
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
          fecha_inicio: '2025-05-30 08:00:00',
          fecha_fin: '2025-05-30 16:00:00',
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

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkDelete('Admisiones', null, { transaction });
      await queryInterface.bulkDelete('Turnos', null, { transaction });
      await queryInterface.bulkDelete('TurnosPersonal', null, { transaction });
      await queryInterface.bulkDelete('Camas', null, { transaction });
      await queryInterface.bulkDelete('Habitaciones', null, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};