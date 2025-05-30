module.exports = (sequelize, DataTypes) => {
  const SolicitudDerivacion = sequelize.define('SolicitudDerivacion', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    paciente_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Pacientes', key: 'id' } },
    origen_id: { type: DataTypes.INTEGER, allowNull: false , references: { model: 'Sectores', key: 'id' } },
    destino_id: { type: DataTypes.INTEGER, allowNull: false , references: { model: 'Sectores', key: 'id' } },
    tipo: { type: DataTypes.ENUM('Interna', 'Externa'), allowNull: false },
    estado: { type: DataTypes.ENUM('Pendiente', 'Aprobada', 'Rechazada'), allowNull: false },
    fecha: { type: DataTypes.DATE, allowNull: false },
    motivo: { type: DataTypes.TEXT, allowNull: true },
    responsable_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'Usuarios', key: 'id' } }
  }, {
    tableName: 'SolicitudesDerivaciones',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['paciente_id'] },
      { fields: ['origen_id'] },
      { fields: ['destino_id'] },
      { fields: ['tipo'] },
      { fields: ['estado'] },
      { fields: ['fecha'] }
    ],
    validate:{ checkOrigenDestino() {
        if (this.tipo === 'Interna' && this.origen_id === this.destino_id) {
          throw new Error('El sector de origen y destino no pueden ser iguales para derivaciones internas');
        }
      }
    }
  });

  SolicitudDerivacion.associate = function(models) {
    SolicitudDerivacion.belongsTo(models.Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
    SolicitudDerivacion.belongsTo(models.Sector, { foreignKey: 'origen_id', as: 'origen' });
    SolicitudDerivacion.belongsTo(models.Sector, { foreignKey: 'destino_id', as: 'destino' });
  };

  return SolicitudDerivacion;
};
