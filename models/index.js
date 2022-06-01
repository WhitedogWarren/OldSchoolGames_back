const User = require('./user');
const sequelize = require('./connector');

const models = {};

models.User = User;

sequelize.sync();

module.exports = models;