'use strict'

const env = process.env.NODE_ENV || 'development';
const config = require(`${__dirname}/../../config/config.json`)[env];

const models = require('../../models/');
const EmailService = require('../../helpers/emails');
const LoanCreator = require('../../web3/loanCreator');
const LoanContract = require('../../web3/loanContract');
const Loan = require('./loans');

module.exports = {

  findLoansByUser: async (userId) => {

    const loans = await models.Loan.findAll({
      where: {
        status: {
          $or: ['funds due', 'active loan', 'repayment due', 'repaid', 'bad loan', 'bad loan repaid', 'bad loan repaid by borrower']
        },
        borrowerId: userId,
      },
    });

    return loans;
  },

  findLoanRequestsByUser: async (userId) => {

    const loanRequests = await models.OrderBook.findAll({
      where: {
        status: {
          $or: ['collateral due', 'active', 'terminated']
        },
        userId: userId,
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

  createBorrowerLoanRequest: async (data, user) => {

    const loan = await models.OrderBook.create({
      principal: data.principal,
      duration: data.duration,
      interest: data.interest,
      validtill: data.validtill,
      use: data.use,
      userRiskRating: data.riskRating,
      userId: user.userId,
    });

    const ens = await models.Domain.create({
      ensDomain: data.ensDomain,
      value: data.ensValue,
      orderBookId: loan.id
    });

    const token = await models.Token.create({
      erc20Token: data.token,
      erc20Address: config.token_contract_address,
      value: data.tokenValue,
      amount: data.tokenAmount,
      orderBookId: loan.id
    });

    EmailService.sendLoanRequestCreationEmail(user.email, user.user, loan.id, loan.createdAt, config.loanCreator_address);

    return loan.id;
  },


  fetchCollateralDetails: async (orderBookId) => {

    const token = await models.Token.findOne({
      where: {
        orderBookId: orderBookId
      }
    });

    const ens = await models.Domain.findOne({
      where: {
        orderBookId: orderBookId
      }
    });

    return {
      ens: ens,
      token: token,
      escrow: config.loanCreator_address
    }

  },

  terminateLoanRequest: async (orderBookId) => {

    const loan = await models.OrderBook.findById(orderBookId);

    if (loan.status == "active") {
      LoanCreator.returnCollateral(loan.id);
    }

    const result = await loan.update({
      status: "terminated"
    });

    return result;
  },

  updateTokenTransferHash: async (obj) => {

    const token = await models.Token.findOne({
      where: {
        orderBookId: obj.orderbookId,
      }
    });

    const result = token.update({
      txnId: obj.txnId.toUpperCase(),
      owner: obj.from,
    });

    return result;
  },

  findLoanById: async (id) => {

    const loan = await models.Loan.findById(id);

    return loan;
  },

  updateOnLoanRepayment: async (txnId, orderbookId, statusCode) => {

    const loan = await models.Loan.findOne({
      where: {
        OrderBookId: orderbookId
      }
    });

    // const updatedOn = await LoanContract.getUpdatedOnDate(loan.loanContractAddress);
    const outstandingAmount = await LoanContract.getOutstandingAmount(loan.loanContractAddress);

    if (statusCode == 7 && outstandingAmount <= 0) {
      const res = await Loan.loanRepaid(txnId, orderbookId, 'repaid', outstandingAmount, false);

      EmailService.sendLoanRepaidToBorrower(res);
      EmailService.sendLoanRepaidToLender(res);

    } else if (statusCode == 8 && outstandingAmount <= 0) {

      const res = await Loan.loanRepaid(txnId, orderbookId, 'bad loan repaid by borrower', outstandingAmount, loan.isRepaidByInsurer);
      //TODO: Could add an email to notify that loan repayment is done
    } else if (statusCode == 9) {

      if (outstandingAmount <= 0)
        await Loan.loanRepaid(txnId, orderbookId, 'bad loan repaid by borrower', outstandingAmount, true);
      else
        await Loan.loanRepaid(txnId, orderbookId, 'bad loan repaid', outstandingAmount, true);

      //Todo: Should we add email for insurer to notify about this?

    }

  },

  updateOnLoanRequestTermination: async (orderbookId) => {

    const loan = await models.OrderBook.findById(orderbookId);

    const result = await loan.update({
      status: "terminated"
    });

    return result;

  },

  updateLoanRequestStatus: async (orderBookId, status) => {

    const loan = await models.OrderBook.findOne({
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

    const result = await loan.update({
      status: status,
    });

    return result;
  }
}
