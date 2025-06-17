// models/Admision.js
module.exports = (sequelize, DataTypes) => {
  const Admision = sequelize.define('admision', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    paciente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'pacientes', key: 'id' }
    },
    administrativo_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'administrativos', key: 'id' }
    },
    estado: {
      type: DataTypes.ENUM('Pendiente', 'Cancelada', 'Completada'),
      defaultValue: 'Pendiente'
    },
    fecha: { type: DataTypes.DATE, allowNull: false },
    medico_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'medicos', key: 'id' }
    },
    sector_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'sectores', key: 'id' }
    },
    motivo_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'motivosadmision', key: 'id' }
    },
    forma_ingreso_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'formasingreso', key: 'id' }
    },
    turno_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'turnos', key: 'id' }
    },
    especialidad_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'especialidades', key: 'id' }
    },
    tipo_estudio_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'tiposestudio', key: 'id' }
    }
  }, {
    tableName: 'admisiones',
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
    Admision.belongsTo(models.paciente, { foreignKey: 'paciente_id', as: 'paciente' });
    Admision.belongsTo(models.administrativo, { foreignKey: 'administrativo_id', as: 'administrativo' });
    Admision.belongsTo(models.motivoadmision, { foreignKey: 'motivo_id', as: 'motivo' });
    Admision.belongsTo(models.formaingreso, { foreignKey: 'forma_ingreso_id', as: 'forma_ingreso' });
    Admision.belongsTo(models.turno, { foreignKey: 'turno_id', as: 'turno' });
    Admision.hasOne(models.internacion, { foreignKey: 'admision_id', as: 'internacion' });
    Admision.hasMany(models.factura, { foreignKey: 'admision_id', as: 'facturas' });
    Admision.belongsTo(models.medico, { foreignKey: 'medico_id', as: 'medico' });
    Admision.belongsTo(models.sector, { foreignKey: 'sector_id', as: 'sector' });
    Admision.belongsTo(models.tipoestudio, { foreignKey: 'tipo_estudio_id', as: 'tipo_estudio' });
    Admision.belongsTo(models.especialidad, { foreignKey: 'especialidad_id', as: 'especialidad' });
  };

  return Admision;
};