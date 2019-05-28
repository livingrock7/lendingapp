const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(module.filename);
const env = process.env.NODE_ENV || 'development';
const config = require(`${__dirname}/../../config/config.json`)[env];
const db = {};

let ico_dashboard;
if (config.use_env_variable) {
  ico_dashboard = new Sequelize(process.env[config.use_env_variable]);
} else {
  ico_dashboard = new Sequelize(
    config.database_ICO, config.username, config.password, config
  );
}

fs
  .readdirSync(__dirname)
  .filter(file =>
    (file.indexOf('.') !== 0) &&
    (file !== basename) &&
    (file.slice(-3) === '.js'))
  .forEach(file => {
    const model = ico_dashboard.import(path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});



db.sequelize = ico_dashboard;
db.Sequelize = Sequelize;

module.exports = db;
