const env = process.env.NODE_ENV || 'development';
const config = require(`${__dirname}/../config/config.json`)[env];
const _ = require('lodash');

var models = require('../models/');
var emailController = require("../email/emailController.js");

module.exports = {

  sendLoanRequestCreationEmail: async (email, name, orderBookId, createdAt, escrow) => {
      emailController.sendEmail(email, "LoanRequestWithoutCollateral", {
          "name": name,
          "id": orderBookId,
          "createdAt": createdAt,
          "escrow": escrow
      });
  },

  sendLoanRequestTerminationEmail: async (loan) => {

      const borrower = await models.User.findOne({
          where: {
            userId: loan.userId,
          }
        });

      emailController.sendEmail(borrower.email, "LoanRequestTerminated", {
        "name": borrower.user,
        "id": loan.id,
      });
  },

  sendCollateralArrivalEmail: async (loan) => {

    const borrower = await models.User.findOne({
        where: {
          userId: loan.userId,
        }
      });

    emailController.sendEmail(borrower.email, "LoanRequestWithCollateral", {
        "name": borrower.user,
        "id": loan.id,
        "updatedAt": loan.token.updatedAt,
        "validTill": loan.validtill,
        "ethAddress": borrower.ethAddress
    });
  },

  sendLoanRequestApprovalEmail: async (user, loan) => {

    emailController.sendEmail(user.email, "ApprovedLoanWithoutFunds", {
        "name": user.user,
        "id": loan.OrderBookId,
        "createdAt": loan.createdAt,
        "amount": loan.principal,
        "escrow": config.loanCreator_address
    });
  },

  sendFundArrivalEmail: async (loan) => {

    const user = await models.User.findOne({
        where: {
          userId: loan.lenderId,
        }
      });

    emailController.sendEmail(user.email, "ApprovedLoanWithFunds", {
        "name": user.user,
        "id": loan.OrderBookId,
        "updatedAt": loan.updatedAt,
        "loanId": loan.id,
        "validTill": loan.expirationDate
    });
  },

  sendRepaymentReminderEmail: async (loan) => {

    const borrower = await models.User.findOne({
        where: {
          userId: loan.borrowerId,
        }
      });

    emailController.sendEmail(borrower.email, "LoanReadyForRepayment", {
      "name": borrower.user,
      "amount": loan.outstandingAmount,
      "escrow": config.loanCreator_address,
      "validTill": loan.expirationDate
    });
  },

  sendLoanRepaidToBorrower: async (loan) => {

    const borrower = await models.User.findOne({
        where: {
          userId: loan.borrowerId,
        }
      });

    emailController.sendEmail(borrower.email, "LoanRepaidBorrower", {
      "name": borrower.user,
      "amount": loan.outstandingAmount,
      "escrow": loan.loanContractAddress,
      "ethAddress": borrower.ethAddress
    });
  },

  sendLoanRepaidToLender: async (loan) => {

    const lender = await models.User.findOne({
        where: {
          userId: loan.lenderId,
        }
      });

    emailController.sendEmail(lender.email, "LoanRepaidLender", {
      "name": lender.user,
      "loanId": loan.id,
      "amount": loan.outstandingAmount,
      "ethAddress": lender.ethAddress
    });
  },

  sendSmartMoneyCreationEmail: async (ethAddress, amount) => {
    try{

      const user = await models.User.findOne({
        where: {
          ethAddress: ethAddress
        },
        attributes: [ 'user', 'email']
      });

      if(!_.isEmpty(user))
        emailController.sendEmail(user.email, "SmartMoneyCreation", {
          "name": user.user,
          "ethAddress": ethAddress,
          "amount": amount
      });
    } catch (err) {
      console.log(err);
    }

  },

  sendSmartMoneyDestructionEmail: async (ethAddress, amount) => {

    try{
      const user = await models.User.findOne({
        where: {
          ethAddress: ethAddress
        },
        attributes: [ 'user', 'email']
      });

      if(!_.isEmpty(user))
          emailController.sendEmail(user.email, "SmartMoneyDestruction", {
            "name": user.user,
            "ethAddress": ethAddress,
            "amount": amount
        });
    } catch (err) {
      console.log(err);
    }
  }
}
