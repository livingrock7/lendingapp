'use strict';

/*DB model for storing USER preferences*/
module.exports = (sequelize, DataTypes) => {
  var User = sequelize.define('User', {
    user: {
      type: DataTypes.STRING
    },
    userId: {
      type: DataTypes.STRING
    },
    authProvider: {
      type: DataTypes.STRING
    },
    email: {
      type: DataTypes.STRING
    },
    ethAddress: {
      type: DataTypes.STRING
    },
    borrowerRiskRating: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    amazonRating: {
      type: DataTypes.STRING
    },
    alibabaRating: {
      type: DataTypes.STRING
    },
    airbnbRating: {
      type: DataTypes.STRING
    },
    ebayRating: {
      type: DataTypes.STRING
    },
    linkedin: {
      type: DataTypes.STRING
    },
    facebook: {
      type: DataTypes.STRING
    },
    jobCertificate: {
      type: DataTypes.STRING
    },
    leID: {
      type: DataTypes.STRING
    },
    upwork: {
      type: DataTypes.STRING
    },
  });

  return User;
};
