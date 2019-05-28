'use strict';

/* DB Model for ENS Domains*/
module.exports = (sequelize, DataTypes) => {
  var Domain = sequelize.define('Domain', {
    ensDomain: {
      type: DataTypes.STRING //ENS Domain Name
    },
    value: {
      type: DataTypes.FLOAT //Value of ENS in ETH
    },
    status: {
      type: DataTypes.ENUM, //ENS Transfer Status (When transfering as Collateral)
      values: ['pending', 'arrived', 'failed'],
      defaultValue: 'pending'
    },
    txnId: {
      type: DataTypes.STRING //ENS Transfer transaction ID
    },
    owner: {
      type: DataTypes.STRING //Owner of ENS Domain
    }
  });

  /* ENS Domain Model is associated with Order Book Model(one-to-one relation)*/
  Domain.associate = function(models) {
    models.Domain.belongsTo(models.OrderBook, {
      onDelete: "CASCADE",
      foreignKey: 'orderBookId',
    });
  };

  return Domain;
}
