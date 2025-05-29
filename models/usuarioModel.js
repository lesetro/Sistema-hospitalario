// models/Usuario.js
module.exports = (sequelize, DataTypes) => {
  const Usuario = sequelize.define('Usuario', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    dni: { type: DataTypes.STRING, allowNull: false },
    nombre: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    rol_id: { type: DataTypes.STRING, allowNull: false },
    telefono: { type: DataTypes.STRING, allowNull: true },
    fecha_nacimiento: { type: DataTypes.DATE, allowNull: false },
    sexo: { type: DataTypes.ENUM('Masculino', 'Femenino', 'Otro'), allowNull: false },
   
  }, {
    tableName: 'Usuarios',
    timestamps: true,
    underscored: true
  });

  Usuario.associate = function(models) {
    Usuario.hasOne(models.Paciente, { foreignKey: 'usuario_id', as: 'paciente' });
    Usuario.hasOne(models.Medico, { foreignKey: 'usuario_id', as: 'medico' });
    Usuario.hasOne(models.Enfermero, { foreignKey: 'usuario_id', as: 'enfermero' });
    Usuario.hasOne(models.Administrativo, { foreignKey: 'usuario_id', as: 'administrativo' });
    Usuario.hasMany(models.Turno, { foreignKey: 'medico_id', as: 'turnos_medico' });
    Usuario.hasMany(models.TurnoPersonal, { foreignKey: 'usuario_id', as: 'turnos_personal' });
    Usuario.hasMany(models.Reclamo, { foreignKey: 'usuario_id', as: 'reclamos' });
    Usuario.hasMany(models.Notificacion, { foreignKey: 'usuario_id', as: 'notificaciones' });
    Usuario.hasMany(models.Noticia, { foreignKey: 'autor_id', as: 'noticias' });
    Usuario.belongsTo(models.Rol, { foreignKey: 'rol_id', as: 'rol' });
  };

  return Usuario;
};