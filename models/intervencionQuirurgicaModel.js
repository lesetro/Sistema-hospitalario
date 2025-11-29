const { Op } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  const IntervencionQuirurgica = sequelize.define('IntervencionQuirurgica', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    paciente_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'pacientes', key: 'id' } },
    medico_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'medicos', key: 'id' } },
    habitacion_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'habitaciones', key: 'id' } },
    evaluacion_medica_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'evaluacionesmedicas', key: 'id' } },
    tipo_procedimiento: { type: DataTypes.STRING(100), allowNull: false }, // Ejemplo: "Apendicectomía"
    fecha_inicio: { type: DataTypes.DATE, allowNull: false },
    fecha_fin: { type: DataTypes.DATE, allowNull: true },
    lista_espera_id: { type: DataTypes.INTEGER, allowNull: false,references: { model: 'listasesperas', key: 'id' } },
    resultado_cirugia: { 
      type: DataTypes.ENUM('Fallecio', 'NecesitaInternacionHabitacion', 'NecesitaInternacionUCI', 'AltaDirecta', 'Complicaciones'), 
      allowNull: true 
    }, 
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
      { fields: ['fecha_fin'] },
      { fields: ['lista_espera_id'] }
    ]
  });
  IntervencionQuirurgica.beforeCreate(async (intervencion, options) => {
  const listaEspera = await sequelize.models.ListaEspera.findByPk(
    intervencion.lista_espera_id
  );
  if (!listaEspera) {
    throw new Error('Lista de espera no encontrada');
  }
});
 
 
  IntervencionQuirurgica.associate = function(models) {
    IntervencionQuirurgica.belongsTo(models.Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
    IntervencionQuirurgica.belongsTo(models.Medico, { foreignKey: 'medico_id', as: 'medico' });
    IntervencionQuirurgica.belongsTo(models.Habitacion, { foreignKey: 'habitacion_id', as: 'habitacion' });
    IntervencionQuirurgica.belongsTo(models.EvaluacionMedica, { foreignKey: 'evaluacion_medica_id', as: 'evaluacion_medica' });
    IntervencionQuirurgica.hasOne(models.Internacion, { foreignKey: 'intervencion_quirurgica_id', as: 'intervencion_quirurgica' });
    IntervencionQuirurgica.belongsTo(models.ListaEspera, { foreignKey: 'lista_espera_id', as: 'lista_espera' });
    
  };

  return IntervencionQuirurgica;
};