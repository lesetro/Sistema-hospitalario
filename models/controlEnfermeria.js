module.exports = (sequelize, DataTypes) => {
  const ControlEnfermeria = sequelize.define('ControlEnfermeria', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    evaluacion_enfermeria_id: { type: DataTypes.INTEGER, allowNull: false,references: { model: 'EvaluacionesEnfermeria', key: 'id' }},
    alergias: { type: DataTypes.TEXT, allowNull: true },
    antecedentes_familiares: { type: DataTypes.TEXT, allowNull: true },
    antecedentes_personales: { type: DataTypes.TEXT, allowNull: true },
    grupo_sanguineo: { type: DataTypes.STRING, allowNull: true },
    factor_rh: { type: DataTypes.ENUM('Positivo', 'Negativo'), allowNull: true },
    peso: { type: DataTypes.FLOAT, allowNull: true },
    altura: { type: DataTypes.FLOAT, allowNull: true },
    presion_arterial: { type: DataTypes.FLOAT, allowNull: true },
    frecuencia_cardiaca: { type: DataTypes.STRING, allowNull: true },
    frecuencia_respiratoria: { type: DataTypes.INTEGER, allowNull: true },
    temperatura: { type: DataTypes.FLOAT, allowNull: true },
    nivel_oxigeno: { type: DataTypes.STRING, allowNull: true },
    nivel_glucosa: { type: DataTypes.FLOAT, allowNull: true },
    nivel_colesterol: { type: DataTypes.STRING, allowNull: true },
    nivel_trigliceridos: { type: DataTypes.STRING, allowNull: true },
    nivel_creatinina: { type: DataTypes.STRING, allowNull: true },
    nivel_urea: { type: DataTypes.STRING, allowNull: true },
    nivel_acido_urico: { type: DataTypes.STRING, allowNull: true },
    nivel_hb: { type: DataTypes.STRING, allowNull: true },
    nivel_hct: { type: DataTypes.STRING, allowNull: true },
    nivel_leucocitos: { type: DataTypes.STRING, allowNull: true },
    nivel_plaquetas: { type: DataTypes.STRING, allowNull: true },
    nivel_proteinas: { type: DataTypes.STRING, allowNull: true },
    nivel_albumina: { type: DataTypes.STRING, allowNull: true },
    nivel_globulina: { type: DataTypes.STRING, allowNull: true },
    nivel_fosfatasa: { type: DataTypes.STRING, allowNull: true },

    
  }, {
    tableName: 'ControlesEnfermeria',
    timestamps: true,
    underscored: true,
    indexes: [
       { fields: ['evaluacion_enfermeria_id'] },
    ]
  });

  ControlEnfermeria.associate = function(models) {
    ControlEnfermeria.belongsTo(models.EvaluacionEnfermeria, { foreignKey: 'evaluacion_enfermeria_id', as: 'evaluacion' });
    
    
  };

  return ControlEnfermeria;
};
    