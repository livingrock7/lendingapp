'use strict'

const models = require('../../models/');

module.exports = {

  updateTokenStatus: async (transactionHash, status) => {

    const token = await models.Token.findOne({
        where: {
          txnId: transactionHash.toUpperCase()
        }
      });

    const result = await token.update({
        status: status
      });

    return result;
  }
}
