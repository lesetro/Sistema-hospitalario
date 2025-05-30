
module.exports = (sequelize, DataTypes) => {
  const Internacion = sequelize.define('Internacion', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    paciente_id: { type: DataTypes.INTEGER, allowNull: false },
    medico_id: { type: DataTypes.INTEGER, allowNull: false },
    cama_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Camas', key: 'id' } }, // Obligatorio
    tipo_internacion_id: { type: DataTypes.INTEGER, allowNull: false },
    administrativo_id: { type: DataTypes.INTEGER, allowNull: false },
    evaluacion_medica_id: { type: DataTypes.INTEGER, allowNull: false },
    intervencion_quirurgica_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'IntervencionesQuirurgicas', key: 'id' } },
    es_prequirurgica: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }, 
    estado_operacion: { type: DataTypes.ENUM('Prequirurgico', 'Postquirurgico', 'No aplica'), defaultValue: 'No aplica' },
    estado_estudios: { type: DataTypes.ENUM('Completos', 'Pendientes'), defaultValue: 'Pendientes' },
    estado_paciente: { type: DataTypes.ENUM('Estable', 'Grave', 'Crítico'), defaultValue: 'Sin Evaluar', allowNull: false },
    fecha_inicio: { type: DataTypes.DATE, allowNull: false },
    fecha_cirugia: { type: DataTypes.DATE, allowNull: true },
    fecha_alta: { type: DataTypes.DATE, allowNull: true },
    admision_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'Admisiones', key: 'id' } },
  }, {
    tableName: 'Internaciones',
    timestamps: true,
    underscored: true      

  });
   Internacion.beforeCreate(async (internacion, options) => {
    const cama = await sequelize.models.Cama.findByPk(internacion.cama_id);
    if (!cama) {
      throw new Error('Cama no encontrada');
    }
    if (cama.estado !== 'Libre') {
      throw new Error('La cama no está disponible');
    }
    const internacionActiva = await sequelize.models.Internacion.findOne({
      where: { cama_id: internacion.cama_id, fecha_fin: null }
    });
    if (internacionActiva) {
      throw new Error('La cama ya está ocupada por otro paciente');
    }
  });

  Internacion.afterCreate(async (internacion, options) => {
    await sequelize.models.Cama.update(
      { estado: 'Ocupada' },
      { where: { id: internacion.cama_id } }
    );
  });
  Internacion.afterUpdate(async (internacion, options) => {
  const transaction = options.transaction || await sequelize.transaction();
  try {
    if (internacion.fecha_fin && internacion.previous('fecha_fin') === null) {
      await sequelize.models.Cama.update(
        { estado: 'Libre' },
        { where: { id: internacion.cama_id }, transaction }
      );
    }
    if (!options.transaction) await transaction.commit();
  } catch (error) {
    if (!options.transaction) await transaction.rollback();
    throw error;
  }
});


  Internacion.associate = function(models) {
    Internacion.belongsTo(models.Paciente, { foreignKey: 'paciente_id', as: 'Paciente' });
    Internacion.belongsTo(models.Medico, { foreignKey: 'medico_id', as: 'medico' });
    Internacion.belongsTo(models.Cama, { foreignKey: 'cama_id', as: 'Cama' });
    Internacion.belongsTo(models.TipoInternacion, { foreignKey: 'tipo_internacion_id', as: 'tipoInternacion' });
    Internacion.belongsTo(models.Administrativo, { foreignKey: 'administrativo_id', as: 'administrativo' });
    Internacion.belongsTo(models.EvaluacionMedica, { foreignKey: 'evaluacion_medica_id', as: 'evaluacionMedica' });
    Internacion.belongsTo(models.IntervencionQuirurgica, { foreignKey: 'intervencion_quirurgica_id', as: 'intervencionQuirurgica' });
    Internacion.belongsTo(models.Admision, { foreignKey: 'admision_id', as: 'admision' });
    Internacion.hasMany(models.AltaMedica, { foreignKey: 'internacion_id', as: 'altasMedicas' });
  };

  return Internacion;
};