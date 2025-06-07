const fs = require('fs');
const path = require('path');
const db = require('../database/db');

const basename = path.basename(__filename);
const modelDb = {}; 

fs.readdirSync(__dirname)
  .filter(file => {
    console.log(`Filtrando archivo: ${file}`);
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file !== 'db.js' &&
      file.slice(-3) === '.js'
    );
  })
  .forEach(file => {
    console.log(`Intentando cargar modelo desde: ${file}`);
    const modelDef = require(path.join(__dirname, file));
    
    if (typeof modelDef !== 'function') {
      console.error(`⚠️ Error: El archivo "${file}" no exporta una función.`);
      return;
    }

    try {
      const model = modelDef(db.sequelize, db.Sequelize.DataTypes);
      if (!model || !model.name) {
        console.error(`⚠️ Error: El modelo en "${file}" no tiene un nombre válido.`);
        return;
      }
      console.log(`Modelo cargado: ${model.name}`);
      modelDb[model.name] = model;
    } catch (error) {
      console.error(`⚠️ Error al cargar el modelo en "${file}": ${error.message}`);
    }
  });

console.log('Modelos cargados:', Object.keys(modelDb));

Object.keys(modelDb).forEach(modelName => {
  if (modelDb[modelName].associate) {
    console.log(`Ejecutando asociaciones para: ${modelName}`);
    try {
      modelDb[modelName].associate(modelDb);
    } catch (error) {
      console.error(`⚠️ Error en asociaciones de "${modelName}": ${error.message}`);
    }
  }
});

module.exports = modelDb; 