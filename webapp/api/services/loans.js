'use strict'

const models = require('../../models/');

module.exports = {

  loanActivate: async (orderbookId) => {

    const loan = await models.Loan.findOne({
        where: {
          OrderBookId: orderbookId
        }
      });

     //Todo: if possible try getting the block creation time after loan contract
     // creation to get exact expiration date
     // let now = new Date();
     // let expiration = new Date(now.getTime() + loan.duration * 60000);

     await loan.update({
         status: 'active loan'
       });

      return loan;
  },

  loanRepaid: async (txnId, orderbookId, status, outstandingAmount, bool) => {

    const loan = await models.Loan.findOne({
        where: {
          OrderBookId: orderbookId
        }
      });

    const result = await loan.update({
        repayTxnId: txnId,
        status: status,
        outstandingAmount: outstandingAmount,
        isRepaidByInsurer: bool
      });

    return result;
  }
}
