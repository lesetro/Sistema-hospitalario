module.exports = {
  up: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkInsert('Usuarios', [
        { id: 1, rol_id: 1, nombre: 'Admin 1', email: 'admin1@hospital.com', created_at: new Date(), updated_at: new Date() },
        { id: 2, rol_id: 2, nombre: 'Dr. García', email: 'garcia@hospital.com', created_at: new Date(), updated_at: new Date() },
        { id: 3, rol_id: 3, nombre: 'Enf. López', email: 'lopez@hospital.com', created_at: new Date(), updated_at: new Date() },
        { id: 4, rol_id: 4, nombre: 'Juan Pérez', email: 'perez@hospital.com', created_at: new Date(), updated_at: new Date() }
      ], { transaction });

      await queryInterface.bulkInsert('Pacientes', [
        {
          usuario_id: 4,
          obra_social_id: 1,
          administrativo_id: null, // Se actualizará después
          nombre: 'Juan Pérez',
          dni: '12345678',
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { transaction });

      await queryInterface.bulkInsert('Medicos', [
        {
          usuario_id: 2,
          especialidad_id: 1,
          sector_id: 1,
          matricula: 'MED123',
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { transaction });

      await queryInterface.bulkInsert('Enfermeros', [
        {
          usuario_id: 3,
          sector_id: 1,
          matricula: 'ENF456',
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { transaction });

      await queryInterface.bulkInsert('Administrativos', [
        {
          usuario_id: 1,
          sector_id: 1,
          turno_id: null, // Se asignará después
          responsabilidad: 'General',
          estado: 'Activo',
          descripcion: 'Administrativo general',
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { transaction });

      // Actualizar administrativo_id en Pacientes
      await queryInterface.bulkUpdate('Pacientes', {
        administrativo_id: 1
      }, { usuario_id: 4 }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkDelete('Administrativos', null, { transaction });
      await queryInterface.bulkDelete('Enfermeros', null, { transaction });
      await queryInterface.bulkDelete('Medicos', null, { transaction });
      await queryInterface.bulkDelete('Pacientes', null, { transaction });
      await queryInterface.bulkDelete('Usuarios', null, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};