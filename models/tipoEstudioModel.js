
module.exports = (sequelize, DataTypes) => {
  const TipoEstudio = sequelize.define('TipoEstudio', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false, unique: true }, 
    categoria: { type: DataTypes.ENUM('Imagenología', 'Laboratorio', 'Fisiológico'), allowNull: false },
    requiere_ayuno: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, {
    tableName: 'tiposestudio',
    timestamps: true
  });

  TipoEstudio.associate = function(models) {
    TipoEstudio.hasMany(models.EstudioSolicitado, { foreignKey: 'tipo_estudio_id', as: 'estudios' });
    TipoEstudio.hasMany(models.ListaEspera, { foreignKey: 'tipo_estudio_id', as: 'listaespera' });
    TipoEstudio.hasMany(models.Turno, { foreignKey: 'tipo_estudio_id', as: 'turnos' });
    TipoEstudio.hasMany(models.Admision, { foreignKey: 'tipo_estudio_id', as: 'admisiones' });
 };

  return TipoEstudio;
};