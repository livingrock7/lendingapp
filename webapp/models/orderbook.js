'use strict';

/* DB Model for OrderBook*/
module.exports = (sequelize, DataTypes) => {
  var OrderBook = sequelize.define('OrderBook', {
    principal: {
      type: DataTypes.FLOAT
    },
    duration: {
      type: DataTypes.INTEGER
    },
    interest: {
      type: DataTypes.FLOAT
    },
    validtill: {
      type: DataTypes.DATE
    },
    use: {
      type: DataTypes.STRING
    },
    status: {
      type: DataTypes.ENUM,
      values: ['collateral due', 'active', 'terminated', 'funds due', 'active loan', 'repayment due', 'repaid', 'bad loan', 'bad loan repaid'],
      defaultValue: 'collateral due'
    },
    userRiskRating: {
      type: DataTypes.INTEGER
    },
    isLoanCreatorUpdated: {
      type: DataTypes.BOOLEAN, //Boolean to check if loan info was successfully updated on the Loan Creator Contract after collateral transfer by borrower
      defaultValue: false
    },
    userId: {
      type: DataTypes.STRING
    }
  });

  OrderBook.associate = function(models) {
    models.OrderBook.hasOne(models.Domain, {
      foreignKey: 'orderBookId',
      as: 'ensDomain',
    });

    models.OrderBook.hasOne(models.Token, {
      foreignKey: 'orderBookId',
      as: 'token',
    });
  };

  return OrderBook;
};
