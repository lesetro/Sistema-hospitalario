module.exports = (sequelize, DataTypes) => {
  const AltaMedica = sequelize.define('AltaMedica', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    paciente_id: { type: DataTypes.INTEGER, allowNull: false },
    medico_id: { type: DataTypes.INTEGER, allowNull: false },
    fecha_alta: { type: DataTypes.DATE, allowNull: false },
    tipo_alta: { type: DataTypes.ENUM('Voluntaria', 'Medica', 'Contraindicada'), allowNull: false },
    instrucciones_post_alta: { type: DataTypes.TEXT, allowNull: true },
    
  }, {
    tableName: 'AltasMedicas',
    timestamps: true,
    underscored: true
  });

  AltaMedica.associate = function(models) {
    AltaMedica.belongsTo(models.Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
    AltaMedica.belongsTo(models.Medico, { foreignKey: 'medico_id', as: 'medico' });
  };

  return AltaMedica;
};
