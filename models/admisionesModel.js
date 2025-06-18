// models/Admision.js
module.exports = (sequelize, DataTypes) => {
  const Admision = sequelize.define('Admision', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    paciente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Pacientes', key: 'id' }
    },
    administrativo_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Administrativos', key: 'id' }
    },
    estado: {
      type: DataTypes.ENUM('Pendiente', 'Cancelada', 'Completada'),
      defaultValue: 'Pendiente'
    },
    fecha: { type: DataTypes.DATE, allowNull: false },
    medico_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Medicos', key: 'id' }
    },
    sector_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Sectores', key: 'id' }
    },
    motivo_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'MotivosAdmision', key: 'id' }
    },
    forma_ingreso_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'FormasIngreso', key: 'id' }
    },
    turno_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Turnos', key: 'id' }
    },
    especialidad_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Especialidades', key: 'id' }
    },
    tipo_estudio_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'TiposEstudio', key: 'id' }
    }
  }, {
    tableName: 'Admisiones',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['paciente_id'] },
      { fields: ['administrativo_id'] },
      { fields: ['motivo_id'] },
      { fields: ['forma_ingreso_id'] },
      { fields: ['turno_id'] },
      { fields: ['medico_id'] }
    ]
  });

  Admision.beforeCreate(async (admision, options) => {
    const transaction = options.transaction || await sequelize.transaction();
    try {
      if (admision.turno_id) {
        const turno = await sequelize.models.Turno.findByPk(admision.turno_id, { transaction });
        if (turno.paciente_id !== admision.paciente_id) {
          throw new Error('El turno debe corresponder al mismo paciente');
        }
      }
      if (!options.transaction) await transaction.commit();
    } catch (error) {
      if (!options.transaction) await transaction.rollback();
      throw error;
    }
  });

  Admision.associate = function(models) {
    Admision.belongsTo(models.Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
    Admision.belongsTo(models.Administrativo, { foreignKey: 'administrativo_id', as: 'administrativo' });
    Admision.belongsTo(models.MotivoAdmision, { foreignKey: 'motivo_id', as: 'motivo' });
    Admision.belongsTo(models.FormaIngreso, { foreignKey: 'forma_ingreso_id', as: 'forma_ingreso' });
    Admision.belongsTo(models.Turno, { foreignKey: 'turno_id', as: 'turno' });
    Admision.hasOne(models.Internacion, { foreignKey: 'admision_id', as: 'internacion' });
    Admision.hasMany(models.Factura, { foreignKey: 'admision_id', as: 'facturas' });
    Admision.belongsTo(models.Medico, { foreignKey: 'medico_id', as: 'medico' });
    Admision.belongsTo(models.Sector, { foreignKey: 'sector_id', as: 'sector' });
    Admision.belongsTo(models.TipoEstudio, { foreignKey: 'tipo_estudio_id', as: 'tipo_estudio' });
    Admision.belongsTo(models.Especialidad, { foreignKey: 'especialidad_id', as: 'especialidad' });
  };

  return Admision;
};