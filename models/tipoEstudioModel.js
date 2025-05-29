// models/TipoEstudio.js
module.exports = (sequelize, DataTypes) => {
  const TipoEstudio = sequelize.define('TipoEstudio', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false, unique: true }, // Ej: "Radiografía", "Análisis de sangre"
    categoria: { type: DataTypes.ENUM('Imagenología', 'Laboratorio', 'Fisiológico'), allowNull: false },
    requiere_ayuno: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, {
    tableName: 'TiposEstudio',
    timestamps: false
  });

  TipoEstudio.associate = function(models) {
    TipoEstudio.hasMany(models.EstudioSolicitado, { foreignKey: 'tipo_estudio_id', as: 'estudios' });
  };
  SolicitudDerivacion.associate = function(models) {
    TipoEstudio.hasMany(models.EstudioSolicitado, { foreignKey: 'tipo_estudio_id', as: 'estudios_solicitados' });
  };


  return TipoEstudio;
};