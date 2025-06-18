module.exports = (sequelize, DataTypes) => {
  const IntervencionQuirurgica = sequelize.define('intervencionquirurgica', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    paciente_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'pacientes', key: 'id' } },
    medico_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'medicos', key: 'id' } },
    habitacion_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'habitaciones', key: 'id' } },
    evaluacion_medica_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'evaluacionesmedicas', key: 'id' } },
    tipo_procedimiento: { type: DataTypes.STRING(100), allowNull: false }, // Ejemplo: "Apendicectomía"
    fecha_inicio: { type: DataTypes.DATE, allowNull: false },
    fecha_fin: { type: DataTypes.DATE, allowNull: true },
    resultado_cirugia: { 
      type: DataTypes.ENUM('Fallecio', 'NecesitaInternacionHabitacion', 'NecesitaInternacionUCI', 'AltaDirecta', 'Complicaciones'), 
      allowNull: true 
    }, // Nuevo campo
    observaciones: { type: DataTypes.TEXT, allowNull: true }
  }, {
    tableName: 'intervencionesquirurgicas',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['paciente_id'] },
      { fields: ['medico_id'] },
      { fields: ['habitacion_id'] },
      { fields: ['evaluacion_medica_id'] },
      { fields: ['fecha_inicio'] },
      { fields: ['fecha_fin'] }
    ]
  });
 IntervencionQuirurgica.beforeCreate(async (intervencion, options) => {
    const transaction = options.transaction || await sequelize.transaction();
    try {
      const evaluacion = await sequelize.models.EvaluacionMedica.findByPk(intervencion.evaluacion_medica_id, { transaction });
      if (evaluacion.paciente_id !== intervencion.paciente_id) {
        throw new Error('La evaluación médica debe corresponder al mismo paciente');
      }
      const habitacion = await sequelize.models.Habitacion.findByPk(intervencion.habitacion_id, {
        include: [{ model: sequelize.models.TipoDeServicio, as: 'tipoDeServicio' }],
        transaction
      });
      if (!habitacion || habitacion.tipoDeServicio.nombre !== 'Quirúrgico') {
        throw new Error('La habitación debe pertenecer al servicio quirúrgico');
      }
      const conflicto = await sequelize.models.IntervencionQuirurgica.findOne({
        where: {
          habitacion_id: intervencion.habitacion_id,
          fecha_inicio: { [Op.lte]: intervencion.fecha_inicio },
          fecha_fin: { [Op.gte]: intervencion.fecha_inicio }
        },
        transaction
      });
      if (conflicto) {
        throw new Error('La habitación está ocupada en el horario seleccionado');
      }
      if (!options.transaction) await transaction.commit();
    } catch (error) {
      if (!options.transaction) await transaction.rollback();
      throw error;
    }
  });

  IntervencionQuirurgica.afterUpdate(async (intervencion, options) => {
    const transaction = options.transaction || await sequelize.transaction();
    try {
      if (intervencion.fecha_fin && intervencion.previous('fecha_fin') === null) {
        const updates = {
          estado_operacion: 'Postquirurgico',
          fecha_cirugia: intervencion.fecha_fin
        };
        let newInternacion = null;
        if (intervencion.resultado_cirugia === 'NecesitaInternacionUCI') {
          updates.tipo_internacion_id = 1;
          updates.estado_paciente = 'Crítico';
          newInternacion = {
            paciente_id: intervencion.paciente_id,
            medico_id: intervencion.medico_id,
            cama_id: (await findAvailableCama(1, transaction)).id,
            tipo_internacion_id: 1,
            administrativo_id: 1,
            evaluacion_medica_id: intervencion.evaluacion_medica_id,
            intervencion_quirurgica_id: intervencion.id,
            estado_operacion: 'Postquirurgico',
            estado_paciente: 'Crítico',
            fecha_inicio: new Date(),
            created_at: new Date(),
            updated_at: new Date()
          };
        } else if (intervencion.resultado_cirugia === 'NecesitaInternacionHabitacion') {
          updates.tipo_internacion_id = 2;
          updates.estado_paciente = 'Estable';
          newInternacion = {
            paciente_id: intervencion.paciente_id,
            medico_id: intervencion.medico_id,
            cama_id: (await findAvailableCama(2, transaction)).id,
            tipo_internacion_id: 2,
            administrativo_id: 1,
            evaluacion_medica_id: intervencion.evaluacion_medica_id,
            intervencion_quirurgica_id: intervencion.id,
            estado_operacion: 'Postquirurgico',
            estado_paciente: 'Estable',
            fecha_inicio: new Date(),
            created_at: new Date(),
            updated_at: new Date()
          };
        } else if (intervencion.resultado_cirugia === 'AltaDirecta') {
          updates.fecha_fin = new Date();
        }
        const internacion = await sequelize.models.Internacion.findOne({
          where: { intervencion_quirurgica_id: intervencion.id },
          transaction
        });
        if (internacion) {
          await internacion.update(updates, { transaction });
        }
        if (newInternacion) {
          await sequelize.models.Internacion.create(newInternacion, { transaction });
        }
      }
      if (!options.transaction) await transaction.commit();
    } catch (error) {
      if (!options.transaction) await transaction.rollback();
      throw error;
    }
  });

  async function findAvailableCama(tipoInternacionId, transaction) {
    const cama = await sequelize.models.Cama.findOne({
      where: { estado: 'Libre' },
      include: [{
        model: sequelize.models.Habitacion,
        as: 'habitacion',
        where: { tipo_internacion_id: tipoInternacionId }
      }],
      transaction
    });
    if (!cama) {
      throw new Error('No hay camas disponibles para la internación');
    }
    return cama;
  }
  IntervencionQuirurgica.associate = function(models) {
    models.IntervencionQuirurgica.belongsTo(models.paciente, { foreignKey: 'paciente_id', as: 'paciente' });
    models.IntervencionQuirurgica.belongsTo(models.medico, { foreignKey: 'medico_id', as: 'medico' });
    models.IntervencionQuirurgica.belongsTo(models.habitacion, { foreignKey: 'habitacion_id', as: 'habitacion' });
    models.IntervencionQuirurgica.belongsTo(models.evaluacionmedica, { foreignKey: 'evaluacion_medica_id', as: 'evaluacion_medica' });
    models.IntervencionQuirurgica.hasOne(models.internacion, { foreignKey: 'intervencion_quirurgica_id', as: 'intervencion_quirurgica' });
    
  };

  return IntervencionQuirurgica;
};