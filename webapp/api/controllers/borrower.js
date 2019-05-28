'use strict'

const Borrower = require('../services/borrower');
const User = require('../services/users');
const Interest = require('../services/interest');
const Collateral = require('../../helpers/collateral');

module.exports = {

  getUserLoans: async (req, res, next) => {

    const data = await Borrower.findLoansByUser(req.user.userId);

    res.render('borrower/userloans', {
      myloans_list: data
    });

  },

  getUserLoanRequests: async (req, res, next) => {

    const data = await Borrower.findLoanRequestsByUser(req.user.userId);

    res.render('borrower/userLoanRequests', {
      loans_list: data
    });
  },

  getLoanRequestForm: async (req, res, next) => {

    const user = await User.findUserById(req.user.userId);

    const annualInterestRate = await Interest.getAnnualInterestRate(user.borrowerRiskRating);

    res.render('borrower/loanForm', {
      title: 'Create Loan Request',
      riskRating: user.borrowerRiskRating,
      annualInterest: annualInterestRate
    });
  },

  getLoanDetails: async (req, res, next) => {

    const user = await User.findUserById(req.user.userId);

    const netInterestRate = await Interest.getNetInterestRate(user.borrowerRiskRating, req.body.interest, req.body.duration);

    const tokenValue = await Collateral.getERC20TokenValue(req.body.token);
    // const ensValue = await collateralService.getENSDomainValue(req.body.ensDomain);

    res.render('borrower/createLoan', {
      title: 'Borrowing Loan Details',
      data: req.body,
      collateral: tokenValue,
      ens: 0.01,
      netInterest: netInterestRate,
      token: tokenValue * req.body.tokenAmount
    });
  },

  createLoanRequest: async (req, res, next) => {

    const orderBookId = await Borrower.createBorrowerLoanRequest(req.body, req.user);

    res.redirect('/borrower/transferCollateral/' + orderBookId);
  },

  getCollateralDetails: async (req, res, next) => {

    const data = await Borrower.fetchCollateralDetails(req.params.id);

    res.render('borrower/transferCollateral', data);
  },

  tokenTransferEvent: async (req, res, next) => {

    const data = await Borrower.updateTokenTransferHash(req.body);

    res.send('Success');
  },

  terminateLoanRequest: async (req, res, next) => {

    const data = await Borrower.terminateLoanRequest(req.params.id);

    res.redirect('/borrower/myLoanrequests');
  },

  repayLoan: async (req, res, next) => {

    const data = await Borrower.findLoanById(req.params.id);

    res.render('borrower/repayLoan', {
      data: data
    });
  }

}
