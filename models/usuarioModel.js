// models/Usuario.js
module.exports = (sequelize, DataTypes) => {
  const Usuario = sequelize.define('usuario', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    dni: { type: DataTypes.STRING, allowNull: false },
    nombre: { type: DataTypes.STRING, allowNull: false },
    apellido: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    rol_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'roles', key: 'id' }
    },
    telefono: { type: DataTypes.STRING, allowNull: true },
    fecha_nacimiento: { type: DataTypes.DATE, allowNull: false },
    sexo: { type: DataTypes.ENUM('Masculino', 'Femenino', 'Otro'), allowNull: false }
  }, {
    tableName: 'usuarios',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['dni'], unique: true },
      { fields: ['email'], unique: true },
      { fields: ['rol_id'] }
    ]
  });

  Usuario.associate = function(models) {
    Usuario.hasOne(models.paciente, { foreignKey: 'usuario_id', as: 'paciente' });
    Usuario.hasOne(models.medico, { foreignKey: 'usuario_id', as: 'medico' });
    Usuario.hasOne(models.enfermero, { foreignKey: 'usuario_id', as: 'enfermero' });
    Usuario.hasOne(models.administrativo, { foreignKey: 'usuario_id', as: 'administrativo' });
    Usuario.hasMany(models.turno, { foreignKey: 'medico_id', as: 'turnos_medico' });
    Usuario.hasMany(models.turnopersonal, { foreignKey: 'usuario_id', as: 'turnos_personal' });
    Usuario.hasMany(models.reclamo, { foreignKey: 'usuario_id', as: 'reclamos' });
    Usuario.hasMany(models.notificacion, { foreignKey: 'usuario_id', as: 'notificaciones' });
    Usuario.hasMany(models.noticia, { foreignKey: 'autor_id', as: 'noticias' });
    Usuario.belongsTo(models.rol, { foreignKey: 'rol_id', as: 'rol' });
  };

  return Usuario;
};