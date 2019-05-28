'use strict';

/* DB Model for Interest Details*/
module.exports = (sequelize, DataTypes) => {
  var Interest = sequelize.define('Interest', {
    creditScore: {
      type: DataTypes.INTEGER
    },
    insurancePremiumRate: {
      type: DataTypes.FLOAT
    },
    marginRate: {
      type: DataTypes.FLOAT
    },
    riskFreeRate: {
      type: DataTypes.FLOAT
    },
    platformFee: {
      type: DataTypes.FLOAT
    }
  });

  return Interest;
};
