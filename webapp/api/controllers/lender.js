'use strict'

const env = process.env.NODE_ENV || 'development';
const config = require(`${__dirname}/../../config/config.json`)[env];

const Lender = require('../services/lender');
const User = require('../services/users');
const Interest = require('../services/interest');
const Collateral = require('../../helpers/collateral');
const OrderBook = require('../services/orderbook');

module.exports = {

  getUserCredits: async (req, res, next) => {

    const data = await Lender.findCreditsByUser(req.user.userId);

    res.render('lender/usercredits', {
      mycredits_list: data
    });
  },

  getAllLoanRequests: async (req, res, next) => {

    const data = await Lender.fetchAllLoanRequests();

    res.render('lender/loanRequests', {
      loans_list: data
    });
  },

  approveLoanRequest: async (req, res, next) => {

    const loanId = await Lender.approveLoanRequest(req.params.id, req.user);

    res.status(200).redirect('/lender/transferFunds/' + loanId);
  },


  getLoanDetails: async (req, res, next) => {

    const data = await Lender.findLoanById(req.params.id);

    const result = await OrderBook.getLoanRequestRiskRating(data.OrderBookId);

    res.render('lender/transferFunds', {
      data: data,
      escrow: config.loanCreator_address,
      userRiskRating: result.userRiskRating
    });
  },

  // loanFundingEvent: async (req, res, next) => {
  //
  //     const data = await Lender.loanFundEvent(req.body);
  //
  //     res.send('Success');
  // },
}
