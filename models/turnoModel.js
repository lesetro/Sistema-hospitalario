module.exports = (sequelize, DataTypes) => {
  const Turno = sequelize.define('Turno', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    tipo: { type: DataTypes.ENUM('MEDICO', 'ESTUDIO', 'PERSONAL'), allowNull: false },
    // Campos 
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    hora_inicio: { type: DataTypes.TIME, allowNull: false },
    hora_fin: { type: DataTypes.TIME, allowNull: true },
    estado: { type: DataTypes.ENUM('PENDIENTE', 'CONFIRMADO', 'COMPLETADO', 'CANCELADO'),defaultValue: 'PENDIENTE' },
    
    // Campos específicos para tipo MEDICO
    paciente_id: { type: DataTypes.INTEGER, allowNull: true,references: { model: 'Pacientes', key: 'id' }},
    medico_id: { type: DataTypes.INTEGER, allowNull: true,references: { model: 'Medicos', key: 'usuario_id' }},
    
    // Campos específicos para tipo PERSONAL
    usuario_id: { type: DataTypes.INTEGER, allowNull: true,references: { model: 'Usuarios', key: 'id' } },
    sector_id: { type: DataTypes.INTEGER, allowNull: true,references: { model: 'Sectores', key: 'id' }},
   
  }, {
    tableName: 'turnos',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['tipo', 'fecha', 'estado'] },
      { fields: ['paciente_id'] },
      { fields: ['medico_id'] }
    ]
  });

  Turno.associate = function(models) {
    Turno.belongsTo(models.Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
    Turno.belongsTo(models.Medico, { foreignKey: 'medico_id', as: 'medico' });
    Turno.belongsTo(models.Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
    Turno.belongsTo(models.Sector, { foreignKey: 'sector_id', as: 'sector' });
  };

  return Turno;
};