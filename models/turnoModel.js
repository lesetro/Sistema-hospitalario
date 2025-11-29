module.exports = (sequelize, DataTypes) => {
  const Turno = sequelize.define(
    'Turno',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      fecha: { type: DataTypes.DATEONLY, allowNull: false },
      hora_inicio: { type: DataTypes.TIME, allowNull: false },
      hora_fin: { type: DataTypes.TIME, allowNull: true },
      estado: {
        type: DataTypes.ENUM('PENDIENTE', 'CONFIRMADO', 'COMPLETADO', 'CANCELADO'),
        defaultValue: 'PENDIENTE'
      },
      paciente_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'pacientes', key: 'id' } 
      },
      medico_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'medicos', key: 'id' }
      },
      usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'usuarios', key: 'id' }
      },
      sector_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'sectores', key: 'id' }
      },
      evaluacion_medica_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'evaluacionesmedicas', key: 'id' } 
      },
      tipo_estudio_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'tiposestudio', key: 'id' } 
      }
    },
    { 
      tableName: 'turnos',
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['fecha', 'estado'] }, 
        { fields: ['paciente_id', 'estado'] },
        { fields: ['medico_id'] },
        { fields: ['usuario_id'] },
        { fields: ['sector_id'] },
        { fields: ['evaluacion_medica_id'] },
        { fields: ['tipo_estudio_id'] }

        
      ]
    }
  );


  Turno.associate = function (models) {
    Turno.belongsTo(models.Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
    Turno.hasOne(models.Admision, { foreignKey: 'turno_id', as: 'admision' }); 
    Turno.belongsTo(models.Medico, { foreignKey: 'medico_id', as: 'medico' });
    Turno.belongsTo(models.Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
    Turno.belongsTo(models.Sector, { foreignKey: 'sector_id', as: 'sector' });
    Turno.hasOne(models.ListaEspera, {foreignKey: 'turno_id',as: 'lista_espera'});
    Turno.belongsTo(models.EvaluacionMedica, { foreignKey: 'evaluacion_medica_id', as: 'evaluacion_medica'});
    Turno.belongsTo(models.TipoEstudio, { foreignKey: 'tipo_estudio_id', as: 'tipo_estudio' });
    
  };

  return Turno;
};