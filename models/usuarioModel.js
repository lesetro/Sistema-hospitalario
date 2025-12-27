
module.exports = (sequelize, DataTypes) => {
  const Usuario = sequelize.define('Usuario', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    dni: { type: DataTypes.STRING, allowNull: false , unique: true, validate: { len: [7, 10] } },
    nombre: { type: DataTypes.STRING, allowNull: false },
    apellido: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
    password: { type: DataTypes.STRING, allowNull: false },
    rol_principal_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'roles', key: 'id' }
    },
    
    // ROL SECUNDARIO (por si el medico,enfermero o administrativo pasan a ser paciente)
    rol_secundario_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'roles', key: 'id' }
    },
    estado: {type: DataTypes.ENUM('Activo', 'Inactivo', 'Bloqueado', 'Pendiente'), allowNull: false, defaultValue: 'Pendiente' },
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
      { fields: ['rol_principal_id'] },
      { fields: ['rol_secundario_id'] }
    ]
  });

  Usuario.associate = function(models) {
    Usuario.hasOne(models.Paciente, { foreignKey: 'usuario_id', as: 'paciente' });
    Usuario.hasOne(models.Medico, { foreignKey: 'usuario_id', as: 'medico' });
    Usuario.hasOne(models.Enfermero, { foreignKey: 'usuario_id', as: 'enfermero' });
    Usuario.hasOne(models.Administrativo, { foreignKey: 'usuario_id', as: 'administrativo' });
    // Usuario.hasMany(models.Turno, { foreignKey: 'medico_id', as: 'turnos_medico' });
    Usuario.hasMany(models.TurnoPersonal, { foreignKey: 'usuario_id', as: 'turnos_personal' });
    Usuario.hasMany(models.Reclamo, { foreignKey: 'usuario_id', as: 'reclamos' });
    Usuario.hasMany(models.Notificacion, {foreignKey: 'usuario_id', as: 'notificaciones_recibidas' });
    Usuario.hasMany(models.Notificacion, {foreignKey: 'remitente_id', as: 'notificaciones_enviadas' });
    Usuario.hasMany(models.Noticia, { foreignKey: 'autor_id', as: 'noticias' });
    Usuario.belongsTo(models.Rol, { foreignKey: 'rol_principal_id', as: 'rol_principal' });
    Usuario.belongsTo(models.Rol, { foreignKey: 'rol_secundario_id', as: 'rol_secundario' });
  };

  return Usuario;
};