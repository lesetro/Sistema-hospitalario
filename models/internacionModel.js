const { Op } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  const Internacion = sequelize.define('Internacion', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    paciente_id: { type: DataTypes.INTEGER, allowNull: false , references: { model: 'pacientes', key: 'id' } },
    medico_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'medicos', key: 'id' } },
    cama_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'camas', key: 'id' } }, 
    tipo_internacion_id: { type: DataTypes.INTEGER, allowNull: false , references: { model: 'tiposinternacion', key: 'id' } },
    administrativo_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'administrativos', key: 'id' } },
    evaluacion_medica_id: { type: DataTypes.INTEGER, allowNull: true , references: { model: 'evaluacionesmedicas', key: 'id' } },
    intervencion_quirurgica_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'intervencionesquirurgicas', key: 'id' } },
    es_prequirurgica: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: true }, 
    estado_operacion: { type: DataTypes.ENUM('Prequirurgico', 'Postquirurgico', 'No aplica'), defaultValue: 'No aplica' },
    estado_estudios: { type: DataTypes.ENUM('Completos', 'Pendientes'), defaultValue: 'Pendientes' },
    estado_paciente: { type: DataTypes.ENUM('Estable', 'Grave', 'Critico', 'Fallecido', 'Sin_Evaluar'), allowNull: false,defaultValue: 'Sin_Evaluar'},
    fecha_inicio: { type: DataTypes.DATE, allowNull: true },
    fecha_cirugia: { type: DataTypes.DATE, allowNull: true },
    obra_social_id: { type: DataTypes.INTEGER, allowNull: true ,references: { model: 'obrassociales', key: 'id' } },
    fecha_alta: { type: DataTypes.DATE, allowNull: true },
    lista_espera_id: {type: DataTypes.INTEGER,allowNull: false, references: { model: 'listasesperas', key: 'id' }},
    admision_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'admisiones', key: 'id' } },
    habitacion_id: { type: DataTypes.INTEGER, allowNull: false,references: { model: 'habitaciones', key: 'id' }}
    }, {
    tableName: 'internaciones',
    timestamps: true,
    underscored: true ,
    index: [
      { fields: ['paciente_id'] },
      { fields: ['medico_id'] },
      { fields: ['administrativo_id'] },
      { fields: ['evaluacion_medica_id'] },
      { fields: ['intervencion_quirurgica_id'] },
      { fields: ['obra_social_id'] },
      { fields: ['admision_id'] },
      { fields: ['fecha_inicio'] },
      { fields: ['fecha_alta'] },
      { fields: ['cama_id'] },
      { fields: ['tipo_internacion_id'] },
      { fields: ['lista_espera_id'] },
      { fields: ['habitacion_id'] },

    ]
  });
Internacion.beforeCreate(async (internacion, options) => {
    const transaction = options.transaction || await sequelize.transaction();
    
    try {
      // Cargar datos necesarios en paralelo
      const [cama, habitacion, paciente] = await Promise.all([
        sequelize.models.Cama.findByPk(internacion.cama_id, { transaction }),
        sequelize.models.Habitacion.findByPk(internacion.habitacion_id, { transaction }),
        sequelize.models.Paciente.findByPk(internacion.paciente_id, { transaction })
      ]);
      
      // Validar que existan
      if (!cama) {
        throw new Error('Cama no encontrada');
      }
      
      if (!habitacion) {
        throw new Error('Habitación no encontrada');
      }
      
      if (!paciente) {
        throw new Error('Paciente no encontrado');
      }
      
      // VALIDACIÓN 1: Verificar disponibilidad de cama
      if (cama.estado !== 'Libre') {
        throw new Error(`La cama ${cama.id} no está disponible. Estado actual: ${cama.estado}`);
      }
      
      // VALIDACIÓN 2: Verificar sexo permitido en habitación
      if (habitacion.sexo_permitido !== 'Mixto') {
        if (habitacion.sexo_permitido !== paciente.sexo) {
          throw new Error(
            `La habitación ${habitacion.numero} solo admite pacientes de sexo ${habitacion.sexo_permitido}. ` +
            `El paciente es de sexo ${paciente.sexo}.`
          );
        }
      }
      
      // VALIDACIÓN 3: Verificar que la cama pertenece a la habitación
      if (cama.habitacion_id !== internacion.habitacion_id) {
        throw new Error(
          `La cama ${cama.id} no pertenece a la habitación ${internacion.habitacion_id}. ` +
          `Pertenece a la habitación ${cama.habitacion_id}.`
        );
      }
      
      // VALIDACIÓN 4: Verificar que lista de espera existe y está pendiente o asignada
      const listaEspera = await sequelize.models.ListaEspera.findByPk(
        internacion.lista_espera_id,
        { transaction }
      );
      
      if (!listaEspera) {
        throw new Error('Lista de espera no encontrada');
      }
      
      if (listaEspera.estado === 'COMPLETADO') {
        throw new Error('La lista de espera ya fue completada');
      }
      
      if (listaEspera.estado === 'CANCELADO') {
        throw new Error('La lista de espera fue cancelada');
      }
      
      if (!options.transaction) await transaction.commit();
    } catch (error) {
      if (!options.transaction) await transaction.rollback();
      throw error;
    }
  });

  //Hook después de crear: Marcar cama como ocupada
  Internacion.afterCreate(async (internacion, options) => {
    const transaction = options.transaction || await sequelize.transaction();
    
    try {
      const paciente = await sequelize.models.Paciente.findByPk(
        internacion.paciente_id,
        { transaction }
      );
      
      // Actualizar cama a ocupada
      await sequelize.models.Cama.update({
        estado: 'Ocupada',
        sexo_ocupante: paciente.sexo
      }, {
        where: { id: internacion.cama_id },
        transaction
      });
      
      // Actualizar lista de espera a ASIGNADO
      await sequelize.models.ListaEspera.update({
        estado: 'ASIGNADO'
      }, {
        where: { id: internacion.lista_espera_id },
        transaction
      });
      
      if (!options.transaction) await transaction.commit();
    } catch (error) {
      if (!options.transaction) await transaction.rollback();
      throw error;
    }
  });
 


  Internacion.associate = function(models) {
    Internacion.belongsTo(models.Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
    Internacion.belongsTo(models.Medico, { foreignKey: 'medico_id', as: 'medico' });
    Internacion.belongsTo(models.Cama, { foreignKey: 'cama_id', as: 'cama' });
    Internacion.belongsTo(models.TipoInternacion, { foreignKey: 'tipo_internacion_id', as: 'tipoInternacion' });
    Internacion.belongsTo(models.Administrativo, { foreignKey: 'administrativo_id', as: 'administrativo' });
    Internacion.belongsTo(models.EvaluacionMedica, { foreignKey: 'evaluacion_medica_id', as: 'evaluacionMedica' });
    Internacion.belongsTo(models.IntervencionQuirurgica, { foreignKey: 'intervencion_quirurgica_id', as: 'intervencionQuirurgica' });
    Internacion.belongsTo(models.Admision, { foreignKey: 'admision_id', as: 'admision' });
    Internacion.hasMany(models.AltaMedica, { foreignKey: 'internacion_id', as: 'altasMedicas' });
    Internacion.belongsTo(models.ListaEspera, { foreignKey: 'lista_espera_id', as: 'lista_espera' });
    Internacion.belongsTo(models.Habitacion, { foreignKey: 'habitacion_id', as: 'habitacion' });
  };

  return Internacion;
};
  