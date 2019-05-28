'use strict';

/*DB Model for Loan*/
module.exports = (sequelize, DataTypes) => {
  var Loan = sequelize.define('Loan', {
    principal: {
      type: DataTypes.FLOAT //Principal in ETH
    },
    duration: {
      type: DataTypes.INTEGER //Duration ( Todo: please specify the unit)
    },
    interest: {
      type: DataTypes.FLOAT //Interest rate in percent
    },
    outstandingAmount: {
      type: DataTypes.FLOAT //Loan Outstanding Amount
    },
    originalDate: {
      type: DataTypes.DATE //Loan Start Date
    },
    expirationDate: {
      type: DataTypes.DATE //Loan Expiration Date
    },
    status: {
      type: DataTypes.ENUM, //Loan Status
      values: ['collateral due', 'active', 'terminated', 'funds due', 'active loan', 'repayment due', 'repaid', 'bad loan', 'bad loan repaid', 'bad loan repaid by borrower'],
      defaultValue: 'funds due'
    },
    intialCollateralValue: {
      type: DataTypes.FLOAT //Collateral Value
    },
    loanContractAddress: {
      type: DataTypes.STRING //Loan Contract Address
    },
    borrowerId: {
      type: DataTypes.STRING //Borrower Address
    },
    lenderId: {
      type: DataTypes.STRING //Lender Address
    },
    repayTxnId: {
      type: DataTypes.STRING //Repayment Transaction ID
    },
    contractFilePath: {
      type: DataTypes.STRING
    },
    isRepaidByInsurer: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  });

  /*Loan is associated with OrderBook table with One-to-One relation*/
  Loan.associate = function(models) {
    models.Loan.belongsTo(models.OrderBook, {
      onDelete: "CASCADE",
      foreignKey: {
        allowNull: false
      }
    });
  };

  return Loan;
}
