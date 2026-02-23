module.exports = (sequelize, DataTypes) => {
  const EstudioSolicitado = sequelize.define('EstudioSolicitado', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    evaluacion_medica_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'evaluacionesmedicas', key: 'id' } },
    medico_id: { type: DataTypes.INTEGER,allowNull: true, references: { model: 'medicos', key: 'id' }},
    paciente_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'pacientes', key: 'id' } },
    tipo_estudio_id: { type: DataTypes.INTEGER, allowNull: false , references: { model: 'tiposestudio', key: 'id' }},
    urgencia: { type: DataTypes.ENUM('Normal', 'Alta'), allowNull: false, defaultValue: 'Normal' },
    estado: { type: DataTypes.ENUM('Pendiente', 'Realizado', 'Cancelado'), defaultValue: 'Pendiente' },
    observaciones: { type: DataTypes.TEXT, allowNull: true },
    resultados: { type: DataTypes.TEXT, allowNull: true },
    fecha_realizacion: { type: DataTypes.DATE, allowNull: true }
  }, {
    tableName: 'estudiossolicitados',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['evaluacion_medica_id'] },
      { fields: ['paciente_id'] },
      { fields: ['medico_id'] },
      { fields: ['tipo_estudio_id'] },
      { fields: ['estado'] }
    ]

  });
 
EstudioSolicitado.beforeUpdate(async (estudio, options) => {
    if (estudio.estado === 'Realizado' && estudio.changed('estado')) {
      // Si tiene resultados ingresados manualmente, permitir
      if (estudio.resultados && estudio.resultados.trim() !== '') {
        return; // OK - tiene resultados manuales
      }
      
      // Si no tiene resultados, verificar si tiene turno completado
      const turnoEstudio = await sequelize.models.TurnoEstudio.findOne({
        where: { 
          estudio_solicitado_id: estudio.id, 
          estado: 'Realizado' 
        }
      });
      
      if (!turnoEstudio) {
        throw new Error('El estudio debe tener resultados o un turno completado para marcarse como Realizado');
      }
    }
  });


  EstudioSolicitado.associate = function(models) {
    EstudioSolicitado.belongsTo(models.EvaluacionMedica, { foreignKey: 'evaluacion_medica_id', as: 'evaluacion_medica' });
    EstudioSolicitado.belongsTo(models.Medico, { foreignKey: 'medico_id', as: 'medico' });
    EstudioSolicitado.belongsTo(models.Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
    EstudioSolicitado.hasOne(models.TurnoEstudio, { foreignKey: 'estudio_solicitado_id', as: 'turno_estudio' });
    EstudioSolicitado.belongsTo(models.TipoEstudio, { foreignKey: 'tipo_estudio_id', as: 'tipo_estudio' });
    
  };

  return EstudioSolicitado;
};