'use strict'

const models = require('../../models/')

module.exports = {

  getLoanRequestRiskRating: async (id) => {

    const userRiskRating = await models.OrderBook.findOne({
      where: {
        id: id
      },
      attributes: ['userRiskRating']
    });

    return userRiskRating;
  },
}
