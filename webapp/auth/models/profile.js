'use strict';

/*DB model for storing USER preferences*/
module.exports = (sequelize, DataTypes) => {
  var profile = sequelize.define('profile', {
    uid: {
      type: DataTypes.STRING
    },
    type: {
      type: DataTypes.INTEGER
    },
    full_name: {
      type: DataTypes.STRING
    },
    address1: {
      type: DataTypes.STRING
    },
    address2: {
      type: DataTypes.STRING
    },
    country: {
      type: DataTypes.STRING
    },
    birthday: {
      type: DataTypes.STRING
    },
    proof_id: {
      type: DataTypes.STRING
    },
    email_me: {
      type: DataTypes.STRING
    },
    kyc_state: {
      type: DataTypes.INTEGER
    }
  }, {
    timestamps: false,
    freezeTableName: true
  });

  return profile;
};
