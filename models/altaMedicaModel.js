module.exports = (sequelize, DataTypes) => {
  const AltaMedica = sequelize.define('AltaMedica', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    paciente_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'pacientes', key: 'id' } },
    medico_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'medicos', key: 'id' } },
    fecha_alta: { type: DataTypes.DATE, allowNull: false },
    tipo_alta: { type: DataTypes.ENUM('Voluntaria', 'Medica', 'Contraindicada'), allowNull: false },
    instrucciones_post_alta: { type: DataTypes.TEXT, allowNull: true },
    internacion_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'internaciones', key: 'id' } },
    estado_paciente: { type: DataTypes.ENUM('Estable', 'Grave', 'Critico', 'Fallecido', 'Sin_Evaluar'), allowNull: false,defaultValue: 'Sin_Evaluar'},
    admision_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'admisiones', key: 'id' }}
  }, {
    
    tableName: 'altasmedicas',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['paciente_id'] },
      { fields: ['medico_id'] },
      { fields: ['fecha_alta'] },
      { fields: ['internacion_id'] },
      { fields: ['estado_paciente']},
      { fields: ['tipo_alta'] },
      

    ],

 // Validación a nivel de modelo
    validate: {
      debeSerInternacionOAdmision() {
        if (!this.internacion_id && !this.admision_id) {
          throw new Error('El alta médica debe estar asociada a una internación o una admisión');
        }
      }
    }
  });

  // VALIDACIONES ANTES DE CREAR
  AltaMedica.beforeCreate(async (alta, options) => {
    const transaction = options.transaction || await sequelize.transaction();
    
    try {
      // Validar que la internación/admisión existe
      if (alta.internacion_id) {
        const internacion = await sequelize.models.Internacion.findByPk(
          alta.internacion_id, 
          { include: ['paciente'], transaction }
        );
        
        if (!internacion) {
          throw new Error('Internación no encontrada');
        }
        
        if (internacion.fecha_alta) {
          throw new Error('La internación ya tiene alta médica registrada');
        }
        
        if (internacion.paciente_id !== alta.paciente_id) {
          throw new Error('El paciente no coincide con la internación');
        }
      }
      
      if (alta.admision_id) {
        const admision = await sequelize.models.Admision.findByPk(
          alta.admision_id,
          { transaction }
        );
        
        if (!admision) {
          throw new Error('Admisión no encontrada');
        }
        
        if (admision.estado === 'Completada') {
          throw new Error('La admisión ya está completada');
        }
        
        if (admision.paciente_id !== alta.paciente_id) {
          throw new Error('El paciente no coincide con la admisión');
        }
      }
      
      // Validar que el médico puede dar altas
      const medico = await sequelize.models.Medico.findByPk(alta.medico_id, { transaction });
      if (!medico) {
        throw new Error('Médico no encontrado');
      }
      
      // Validar que no existe alta duplicada
      const altaExistente = await AltaMedica.findOne({
        where: {
          [sequelize.Sequelize.Op.or]: [
            alta.internacion_id ? { internacion_id: alta.internacion_id } : null,
            alta.admision_id ? { admision_id: alta.admision_id } : null
          ].filter(Boolean)
        },
        transaction
      });
      
      if (altaExistente) {
        throw new Error('Ya existe un alta médica para esta internación/admisión');
      }

      if (!options.transaction) await transaction.commit();
    } catch (error) {
      if (!options.transaction) await transaction.rollback();
      throw error;
    }
  });

  // LIBERAR CAMA AUTOMÁTICAMENTE AL DAR ALTA
  AltaMedica.afterCreate(async (alta, options) => {
    const transaction = options.transaction || await sequelize.transaction();
    
    try {
      
      // Alta de internación
    
      if (alta.internacion_id) {
        const internacion = await sequelize.models.Internacion.findByPk(
          alta.internacion_id,
          { include: ['lista_espera'], transaction }
        );
        
        if (internacion) {
          // 1. Actualizar fecha_alta en internación
          await internacion.update(
            { fecha_alta: alta.fecha_alta },
            { transaction }
          );
          
          // 2.  LIBERAR CAMA AUTOMÁTICAMENTE
          await sequelize.models.Cama.update({
            estado: 'Libre',
            sexo_ocupante: null
          }, {
            where: { id: internacion.cama_id },
            transaction
          });
          
          console.log(`Cama ${internacion.cama_id} liberada automáticamente`);
          
          // 3. Marcar lista de espera como completada
          if (internacion.lista_espera) {
            await internacion.lista_espera.update({
              estado: 'COMPLETADO',
              observaciones: `Alta médica registrada - ${alta.tipo_alta}. Fecha: ${alta.fecha_alta}`
            }, { transaction });
            
            console.log(` Lista de espera ${internacion.lista_espera_id} marcada como COMPLETADO`);
          }
          
          // 4. Actualizar admisión si existe
          if (internacion.admision_id) {
            await sequelize.models.Admision.update(
              { estado: 'Completada' },
              { where: { id: internacion.admision_id }, transaction }
            );
            
            console.log(`Admisión ${internacion.admision_id} marcada como Completada`);
          }
          
          // 5. Crear historial médico
          await sequelize.models.HistorialMedico.create({
            paciente_id: alta.paciente_id,
            admision_id: internacion.admision_id,
            descripcion: `Alta médica: ${alta.tipo_alta}. Estado: ${alta.estado_paciente}. ${alta.instrucciones_post_alta || ''}`,
            tipo_evento: 'Alta',
            fecha: alta.fecha_alta
          }, { transaction });
        }
      }
      
  
      // Alta de admisión (sin internación)
      
      if (alta.admision_id && !alta.internacion_id) {
        // Solo cerrar admisión
        await sequelize.models.Admision.update(
          { estado: 'Completada' },
          { where: { id: alta.admision_id }, transaction }
        );
        
        console.log(` Admisión ${alta.admision_id} marcada como Completada (sin internación)`);
        
        // Crear historial médico
        await sequelize.models.HistorialMedico.create({
          paciente_id: alta.paciente_id,
          admision_id: alta.admision_id,
          descripcion: `Alta médica: ${alta.tipo_alta}. ${alta.instrucciones_post_alta || ''}`,
          tipo_evento: 'Alta',
          fecha: alta.fecha_alta
        }, { transaction });
      }
      
      if (!options.transaction) await transaction.commit();
    } catch (error) {
      if (!options.transaction) await transaction.rollback();
      console.error('Error al procesar alta médica:', error);
      throw error;
    }
  });
  AltaMedica.associate = function(models) {
    AltaMedica.belongsTo(models.Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
    AltaMedica.belongsTo(models.Medico, { foreignKey: 'medico_id', as: 'medico' });
    AltaMedica.belongsTo(models.Internacion, { foreignKey: 'internacion_id', as: 'internacion' });
    AltaMedica.belongsTo(models.Admision, { foreignKey: 'admision_id', as: 'admision' });
  };

  return AltaMedica;
};