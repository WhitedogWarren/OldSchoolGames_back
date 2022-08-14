const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    'oldschoolgames',
    'postgres',
    'Vegu+1459',
    {
        host: 'localhost',
        dialect: 'postgres'
    }
)

module.exports = sequelize;