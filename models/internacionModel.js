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
    indexes: [
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

  // ============================================================================
  // HOOK BEFORE CREATE - Validaciones
  // ============================================================================
  Internacion.beforeCreate(async (internacion, options) => {
    const transaction = options.transaction || await sequelize.transaction();
    
    try {
      // ✅ CORRECCIÓN: Convertir IDs a números
      const camaId = Number(internacion.cama_id);
      const habitacionId = Number(internacion.habitacion_id);
      
      // ✅ CORRECCIÓN: Cargar Paciente CON Usuario para obtener el sexo
      const [cama, habitacion, paciente] = await Promise.all([
        sequelize.models.Cama.findByPk(camaId, { transaction }),
        sequelize.models.Habitacion.findByPk(habitacionId, { transaction }),
        sequelize.models.Paciente.findByPk(internacion.paciente_id, { 
          include: [{
            model: sequelize.models.Usuario,
            as: 'usuario',
            attributes: ['id', 'nombre', 'apellido', 'sexo']
          }],
          transaction 
        })
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

      // ✅ CORRECCIÓN: Obtener sexo del Usuario
      if (!paciente.usuario) {
        throw new Error('No se pudo obtener la información del usuario del paciente');
      }
      
      const sexoPaciente = paciente.usuario.sexo;
      
      if (!sexoPaciente) {
        throw new Error('El paciente no tiene sexo definido');
      }
      
      // VALIDACIÓN 1: Verificar disponibilidad de cama
      if (cama.estado !== 'Libre') {
        throw new Error(`La cama ${cama.numero} no está disponible. Estado: ${cama.estado}`);
      }
      
      // ✅ CORRECCIÓN: VALIDACIÓN 2 con lógica para sexo "Otro"
      if (sexoPaciente === 'Otro') {
        // Pacientes "Otro" solo pueden ir a Mixtas o Individuales vacías
        if (habitacion.sexo_permitido !== 'Mixto' && habitacion.tipo !== 'Individual') {
          throw new Error(
            `Paciente con sexo "Otro" solo puede asignarse a habitaciones Mixtas o Individuales. ` +
            `La habitación ${habitacion.numero} es ${habitacion.tipo} con sexo permitido ${habitacion.sexo_permitido}.`
          );
        }
        // Verificar que habitaciones dobles estén vacías
        if (habitacion.tipo === 'Doble') {
          const camaOcupada = await sequelize.models.Cama.findOne({
            where: { habitacion_id: habitacionId, estado: 'Ocupada' },
            transaction
          });
          if (camaOcupada) {
            throw new Error(
              `Habitación doble ${habitacion.numero} ya tiene ocupante. ` +
              `Paciente "Otro" requiere habitación vacía o individual.`
            );
          }
        }
      } else {
        // Paciente Masculino o Femenino
        if (habitacion.sexo_permitido !== 'Mixto' && habitacion.sexo_permitido !== sexoPaciente) {
          throw new Error(
            `La habitación ${habitacion.numero} solo admite pacientes de sexo ${habitacion.sexo_permitido}. ` +
            `El paciente ${paciente.usuario.nombre} ${paciente.usuario.apellido} es de sexo ${sexoPaciente}.`
          );
        }
        
        // Verificar compatibilidad en habitaciones dobles
        if (habitacion.tipo === 'Doble') {
          const camaOcupada = await sequelize.models.Cama.findOne({
            where: {
              habitacion_id: habitacionId,
              estado: 'Ocupada',
              id: { [Op.ne]: camaId }
            },
            transaction
          });
          
          if (camaOcupada && camaOcupada.sexo_ocupante && camaOcupada.sexo_ocupante !== sexoPaciente) {
            throw new Error(
              `Incompatibilidad: La habitación ${habitacion.numero} tiene paciente de sexo ${camaOcupada.sexo_ocupante}. ` +
              `No se puede asignar paciente de sexo ${sexoPaciente}.`
            );
          }
        }
      }
      
      // ✅ CORRECCIÓN: VALIDACIÓN 3 con comparación numérica
      const camaHabitacionId = Number(cama.habitacion_id);
      if (camaHabitacionId !== habitacionId) {
        throw new Error(
          `La cama ${cama.numero} no pertenece a la habitación ${habitacion.numero}. ` +
          `Pertenece a habitación ID: ${camaHabitacionId}.`
        );
      }
      
      // VALIDACIÓN 4: Verificar lista de espera
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

  // ============================================================================
  // HOOK AFTER CREATE - Marcar cama como ocupada
  // ============================================================================
  Internacion.afterCreate(async (internacion, options) => {
    const transaction = options.transaction || await sequelize.transaction();
    
    try {
      // ✅ CORRECCIÓN: Obtener sexo del Usuario
      const paciente = await sequelize.models.Paciente.findByPk(
        internacion.paciente_id,
        { 
          include: [{
            model: sequelize.models.Usuario,
            as: 'usuario',
            attributes: ['sexo']
          }],
          transaction 
        }
      );
      
      // Actualizar cama a ocupada
      await sequelize.models.Cama.update({
        estado: 'Ocupada',
        sexo_ocupante: paciente.usuario.sexo
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
