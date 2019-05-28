'use strict'

const math = require('mathjs');

const env = process.env.NODE_ENV || 'development';
const config = require(`${__dirname}/../../config/config.json`)[env];

const models = require('../../models/');
const EmailService = require('../../helpers/emails');
const LoanCreator = require('../../web3/loanCreator');
const Interest = require('./interest');
const Loans = require('./loans');
const Eclaim = require('../../helpers/eclaim');

module.exports = {

  findCreditsByUser: async (userId) => {

    const credits = await models.Loan.findAll({
      where: {
        status: {
          $or: ['funds due', 'active loan', 'repayment due', 'repaid', 'bad loan', 'bad loan repaid', 'bad loan repaid by borrower']
        },
        lenderId: userId,
      },
    });

    return credits;
  },

  fetchAllLoanRequests: async () => {

    const loanRequests = await models.OrderBook.findAll({
      where: {
        status: 'active',
        // isLoanCreatorUpdated: true,
      },
      include: [{
        model: models.Token,
        as: 'token',
      }, {
        model: models.Domain,
        as: 'ensDomain',
      }],
    });

    return loanRequests;
  },

  approveLoanRequest: async (orderBookId, user) => {

    const orderbook = await models.OrderBook.findOne({
      where: {
        id: orderBookId
      },
      include: [{
        model: models.Token,
        as: 'token',
      }, {
        model: models.Domain,
        as: 'ensDomain',
      }],
    });

    const loan = await models.Loan.create({
      principal: orderbook.principal,
      duration: orderbook.duration,
      interest: orderbook.interest,
      outstandingAmount: math.eval(orderbook.principal + (orderbook.interest * orderbook.principal / 100)),
      originalDate: orderbook.createdAt,
      expirationDate: orderbook.validtill,
      OrderBookId: orderbook.id,
      intialCollateralValue: math.eval(orderbook.ensDomain.value + orderbook.token.value),
      lenderId: user.userId,
      borrowerId: orderbook.userId
    });

    await orderbook.update({
      status: 'funds due',
    });

    EmailService.sendLoanRequestApprovalEmail(user, loan);

    return loan.id;
  },

  findLoanById: async (id) => {

    const loan = await models.Loan.findById(id);

    return loan;
  },

  updateOnFundArrival: async (orderbookId) => {

    const loan = await Loans.loanActivate(orderbookId);

    EmailService.sendFundArrivalEmail(loan);

    const insurancePremiumRate = await Interest.getInsurancePremium(loan.OrderBookId);
    const interestRate = math.format(math.eval(loan.interest * 10 ** config.precision), config.precision + 1);

    LoanCreator.createLoanContract(loan.OrderBookId, loan.duration, interestRate, insurancePremiumRate, config.insurer_eth_address, function(res) {
      //
    });

  }
}
