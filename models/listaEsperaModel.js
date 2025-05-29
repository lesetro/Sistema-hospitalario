// Cambiar a un diseño más estructurado:
module.exports = (sequelize, DataTypes) => {
  const ListaEspera = sequelize.define('ListaEspera', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    paciente_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Pacientes', key: 'id' }},
    tipo: { type: DataTypes.ENUM('ESTUDIO', 'EVALUACION', 'INTERNACION', 'CIRUGIA'), allowNull: false },
    // Campos específicos por tipo
    tipo_estudio_id: { type: DataTypes.INTEGER, allowNull: true,references: { model: 'TiposEstudio', key: 'id' }},
    especialidad_id: { type: DataTypes.INTEGER, allowNull: true,references: { model: 'Especialidades', key: 'id' }},
   
    prioridad: { type: DataTypes.INTEGER, allowNull: false, 
      defaultValue: 2 // 1=Alta, 2=Media, 3=Baja
    },
    estado: { type: DataTypes.ENUM('PENDIENTE', 'ASIGNADO', 'CANCELADO', 'COMPLETADO'), allowNull: false, defaultValue: 'PENDIENTE' },
    fecha_registro: { type: DataTypes.DATE, allowNull: false }
  }, {
    tableName: 'listas_espera',
    timestamps: true,
    underscored: true,
    indexes: [
      // Índice para búsquedas por tipo y prioridad
      {
        fields: ['tipo', 'prioridad', 'estado']
      }
    ]
  });

  ListaEspera.associate = function(models) {
    ListaEspera.belongsTo(models.Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
    // Relaciones condicionales más claras
    ListaEspera.belongsTo(models.TipoEstudio, { foreignKey: 'tipo_estudio_id', as: 'tipo_estudio',constraints: false });
    ListaEspera.belongsTo(models.Especialidad, { foreignKey: 'especialidad_id', as: 'especialidad',constraints: false });
  };

  return ListaEspera;
};