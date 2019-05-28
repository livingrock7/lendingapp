'use strict';

/*DB model for storing USER preferences*/
module.exports = (sequelize, DataTypes) => {
  var users = sequelize.define('users', {
    email: {
      type: DataTypes.STRING
    },
    password: {
      type: DataTypes.STRING
    }
  }, {
    timestamps: false
  });

  return users;
};
