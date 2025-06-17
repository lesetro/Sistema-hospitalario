// models/TipoEstudio.js
module.exports = (sequelize, DataTypes) => {
  const TipoEstudio = sequelize.define('tipoestudio', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false, unique: true }, // Ej: "Radiografía", "Análisis de sangre"
    categoria: { type: DataTypes.ENUM('Imagenología', 'Laboratorio', 'Fisiológico'), allowNull: false },
    requiere_ayuno: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, {
    tableName: 'tiposestudio',
    timestamps: false
  });

  TipoEstudio.associate = function(models) {
    TipoEstudio.hasMany(models.estudiosolicitado, { foreignKey: 'tipo_estudio_id', as: 'estudios' });
    TipoEstudio.hasMany(models.listasesperas, { foreignKey: 'tipo_estudio_id', as: 'listaEspera' });
    TipoEstudio.hasMany(models.turno, { foreignKey: 'tipo_estudio_id', as: 'turnos' });
    TipoEstudio.hasMany(models.admision, { foreignKey: 'tipo_estudio_id', as: 'admisiones' });
 };

  return TipoEstudio;
};