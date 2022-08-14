const { DataTypes } = require('sequelize');
const sequelize = require('./connector');

const User = sequelize.define('User', {
  pseudo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  invited: {
    type: DataTypes.ARRAY(DataTypes.STRING),
  },
  invitedBy: {
    type: DataTypes.ARRAY(DataTypes.STRING),
  }
})

module.exports = User;