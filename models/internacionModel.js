
module.exports = (sequelize, DataTypes) => {
  const Internacion = sequelize.define('internacion', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    paciente_id: { type: DataTypes.INTEGER, allowNull: false },
    medico_id: { type: DataTypes.INTEGER, allowNull: false },
    cama_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'camas', key: 'id' } }, 
    tipo_internacion_id: { type: DataTypes.INTEGER, allowNull: true },
    administrativo_id: { type: DataTypes.INTEGER, allowNull: false },
    evaluacion_medica_id: { type: DataTypes.INTEGER, allowNull: true },
    intervencion_quirurgica_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'intervencionesquirurgicas', key: 'id' } },
    es_prequirurgica: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: true }, 
    estado_operacion: { type: DataTypes.ENUM('Prequirurgico', 'Postquirurgico', 'No aplica'), defaultValue: 'No aplica' },
    estado_estudios: { type: DataTypes.ENUM('Completos', 'Pendientes'), defaultValue: 'Pendientes' },
    estado_paciente: { type: DataTypes.ENUM('Estable', 'Grave', 'Crítico', 'Sin Evaluar'), defaultValue: 'Sin Evaluar', allowNull: false },
    fecha_inicio: { type: DataTypes.DATE, allowNull: true },
    fecha_cirugia: { type: DataTypes.DATE, allowNull: true },
    fecha_alta: { type: DataTypes.DATE, allowNull: true },
    lista_espera_id: {type: DataTypes.INTEGER,allowNull: true, references: { model: 'listasesperas', key: 'id' }},
    admision_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'admisiones', key: 'id' } },
  }, {
    tableName: 'internaciones',
    timestamps: true,
    underscored: true      

  });/* 
   Internacion.beforeCreate(async (internacion, options) => {
    const cama = await sequelize.models.Cama.findByPk(internacion.cama_id);
    if (!cama) {
      throw new Error('Cama no encontrada');
    }
    if (cama.estado !== 'Libre') {
      throw new Error('La cama no está disponible');
    }const listaEspera = await sequelize.models.ListasEsperas.findByPk(internacion.lista_espera_id);
    if (!listaEspera || listaEspera.tipo !== 'INTERNACION') {
      throw new Error('Lista de espera no válida o no es de tipo INTERNACION');
    }
    if (!listaEspera.habitacion_id) {
      throw new Error('La lista de espera debe tener una habitación asignada');
    }
    if (cama.habitacion_id !== listaEspera.habitacion_id) {
      throw new Error('La cama seleccionada no pertenece a la habitación asignada en la lista de espera');
    }
    const internacionActiva = await sequelize.models.Internacion.findOne({
      where: { cama_id: internacion.cama_id, fecha_alta: null }
    });
    if (internacionActiva) {
      throw new Error('La cama ya está ocupada por otro paciente');
    }
    if (cama.habitacion.tipo === 'Doble' && cama.habitacion.sexo_permitido !== 'Mixto') {
      const paciente = await sequelize.models.Paciente.findByPk(internacion.paciente_id);
      const occupiedCama = await sequelize.models.Cama.findOne({
        where: {
          habitacion_id: cama.habitacion_id,
          estado: 'Ocupada',
          id: { [sequelize.Op.ne]: internacion.cama_id }
        }
      });
      if (occupiedCama && occupiedCama.sexo_ocupante !== paciente.sexo) {
        throw new Error('El sexo del paciente no coincide con el ocupante actual de la habitación doble');
      }
    }
  });

  Internacion.afterCreate(async (internacion, options) => {
    const transaction = options.transaction || await sequelize.transaction();
    try {
      const paciente = await sequelize.models.Paciente.findByPk(internacion.paciente_id);
      await sequelize.models.Cama.update(
        { estado: 'Ocupada', sexo_ocupante: paciente.sexo },
        { where: { id: internacion.cama_id }, transaction }
      );
      await sequelize.models.ListasEsperas.update(
        { estado: 'ASIGNADO' },
        { where: { id: internacion.lista_espera_id }, transaction }
      );
      if (!options.transaction) await transaction.commit();
    } catch (error) {
      if (!options.transaction) await transaction.rollback();
      throw error;
    }
  });
  Internacion.afterUpdate(async (internacion, options) => {
    const transaction = options.transaction || await sequelize.transaction();
    try {
      if (internacion.fecha_alta && internacion.previous('fecha_alta') === null) {
        await sequelize.models.Cama.update(
          { estado: 'EnLimpieza', sexo_ocupante: null },
          { where: { id: internacion.cama_id }, transaction }
        );
        await sequelize.models.ListasEsperas.update(
          { estado: 'COMPLETADO' },
          { where: { id: internacion.lista_espera_id }, transaction }
        );
      }
      if (!options.transaction) await transaction.commit();
    } catch (error) {
      if (!options.transaction) await transaction.rollback();
      throw error;
    }
  });
 */
  Internacion.associate = function(models) {
    Internacion.belongsTo(models.paciente, { foreignKey: 'paciente_id', as: 'Paciente' });
    Internacion.belongsTo(models.medico, { foreignKey: 'medico_id', as: 'medico' });
    Internacion.belongsTo(models.cama, { foreignKey: 'cama_id', as: 'Cama' });
    Internacion.belongsTo(models.tipointernacion, { foreignKey: 'tipo_internacion_id', as: 'tipoInternacion' });
    Internacion.belongsTo(models.administrativo, { foreignKey: 'administrativo_id', as: 'administrativo' });
    Internacion.belongsTo(models.evaluacionmedica, { foreignKey: 'evaluacion_medica_id', as: 'evaluacionMedica' });
    Internacion.belongsTo(models.intervencionquirurgica, { foreignKey: 'intervencion_quirurgica_id', as: 'intervencionQuirurgica' });
    Internacion.belongsTo(models.admision, { foreignKey: 'admision_id', as: 'admision' });
    Internacion.hasMany(models.altamedica, { foreignKey: 'internacion_id', as: 'altasMedicas' });
    Internacion.belongsTo(models.listasesperas, { foreignKey: 'lista_espera_id', as: 'lista_espera' });
  };

  return Internacion;
};