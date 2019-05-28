'use strict';

/*DB model for Tokens*/
module.exports = (sequelize, DataTypes) => {
  var Token = sequelize.define('Token', {
    erc20Token: {
      type: DataTypes.STRING // Name or Symbol of token
    },
    erc20Address: {
      type: DataTypes.STRING //Token Contract Address
    },
    amount: {
      type: DataTypes.INTEGER //Token Amount
    },
    value: {
      type: DataTypes.FLOAT //Token Value calculated using coincompare APIs
    },
    status: {
      type: DataTypes.ENUM, //Token Transfer Status
      values: ['pending', 'arrived', 'failed'],
      defaultValue: 'pending'
    },
    txnId: {
      type: DataTypes.STRING //Transaction Status
    },
    owner: {
      type: DataTypes.STRING //Owner Ethereum Address
    }
  });

  /* Token Model is associated with Order Book Model(one-to-one relation)*/
  Token.associate = function(models) {
    models.Token.belongsTo(models.OrderBook, {
      onDelete: "CASCADE",
      foreignKey: 'orderBookId',
    });
  };
  return Token;
}
