const fs = require('fs');
const path = require('path');
const { Sequelize, sequelize } = require('../database/db'); // ✅ conexión correcta

const basename = path.basename(__filename);
const db = { Sequelize, sequelize };

// Leer todos los archivos de modelos
fs.readdirSync(__dirname)
  .filter(file => (
    file.indexOf('.') !== 0 &&      // Ignora archivos ocultos
    file !== basename &&            // Ignora este archivo
    file !== 'db.js' &&             // Por si db.js estuviera acá
    file.slice(-3) === '.js'        // Solo archivos .js
  ))
  .forEach(file => {
    const modelDef = require(path.join(__dirname, file)); // importa la función

    if (typeof modelDef !== 'function') {
      console.error(`⚠️ El archivo "${file}" no exporta una función. ¿Es un modelo Sequelize válido?`);
      return;
    }

    const model = modelDef(sequelize, Sequelize.DataTypes); // ejecuta la función
    db[model.name] = model; // guarda el modelo
  });

// Asociaciones entre modelos
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Exportamos todos los modelos + sequelize y Sequelize
module.exports = db;
