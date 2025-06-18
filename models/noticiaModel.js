// models/Noticia.js
module.exports = (sequelize, DataTypes) => {
  const Noticia = sequelize.define('Noticia', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    titulo: { type: DataTypes.STRING(255), allowNull: false },
    texto: { type: DataTypes.TEXT, allowNull: false },
    fecha: { type: DataTypes.DATE, allowNull: false },
    autor_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Usuarios', key: 'id' } }
  }, {
    tableName: 'Noticias',
    timestamps: true,
    underscored: true
  });

  Noticia.associate = function(models) {
    Noticia.belongsTo(models.Usuario, { foreignKey: 'autor_id', as: 'autor' });
  };

  return Noticia;
};