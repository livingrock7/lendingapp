'use strict'

const models = require('../../models/');

module.exports = {

  findCreditsByUser: async (userId) => {

    const credits = await models.Loan.findAll({
      where: {
        status: {
          $or: ['funds due', 'active loan', 'repayment due', 'repaid']
        },
        lenderId: userId,
      },
    });

    return credits;
  }
}
