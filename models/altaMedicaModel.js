const internacionModel = require("./internacionModel");

module.exports = (sequelize, DataTypes) => {
  const AltaMedica = sequelize.define('AltaMedica', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    paciente_id: { type: DataTypes.INTEGER, allowNull: false , references: { model: 'pacientes', key: 'id' } },
    medico_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'medicos', key: 'usuario_id' } },
    fecha_alta: { type: DataTypes.DATE, allowNull: false },
    tipo_alta: { type: DataTypes.ENUM('Voluntaria', 'Medica', 'Contraindicada'), allowNull: false },
    instrucciones_post_alta: { type: DataTypes.TEXT, allowNull: true },
    internacion_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'internaciones', key: 'id' } },
    estado_paciente: { type: DataTypes.ENUM('Estable', 'Crítico', 'Fallecido'), allowNull: false }
    
  }, {
    tableName: 'altasMedicas',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['paciente_id'] },
      { fields: ['medico_id'] },
      { fields: ['fecha_alta'] }
    ]
    
  });

  AltaMedica.associate = function(models) {
    AltaMedica.belongsTo(models.Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
    AltaMedica.belongsTo(models.Medico, { foreignKey: 'medico_id', as: 'medico' });
    AltaMedica.belongsTo(models.Internacion, { foreignKey: 'internacion_id', as: 'internacion' });
  };

  return AltaMedica;
};
