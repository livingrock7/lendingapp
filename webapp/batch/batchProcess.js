const env = process.env.NODE_ENV || 'development';
const config = require(`${__dirname}/../config/config.json`)[env];
var schedule = require('node-schedule');
const _ = require('lodash');

const LoanCreator = require('../web3/loanCreator');
const EmailService = require("../helpers/emails.js");

var models = require('../models/');

var rule = new schedule.RecurrenceRule();
// rule.hour = 24;
rule.second = config.scheduler.recurrence_rule_mins;

/*
* Scheduler for syncing out of date loan requests whose collateral has been transferred
* and loan request hasnt been approved before the valid till date.
* Loan Request is terminated and collateral is returned to the borrower.
* Scheduler runs every 1 minute.
*/
var syncOutOfDateLoanRequests = schedule.scheduleJob(rule, function(){
  models.OrderBook.findAll({
    where: {
      status: "active",
      validtill : {
        $lt: new Date(),
      }
    },
  }).then(async function(loans){
    let loan_array = [];
    _.forEach(loans, function(loan){
        loan_array.push(loan.id);
    });
    if(loan_array.length>0)
      LoanCreator.returnMultipleCollaterals(loan_array);
  });
});

/*
* Batch Process Scheduler for syncing terminating loan requests
* without collateral for more than 7 days (current development has 3 mins)
* Scheduler runs every 1 minute.
*/
var syncLoanRequestsWithoutCollateral  = schedule.scheduleJob(rule, function(){
  models.OrderBook.findAll({
    where: {
      status: "collateral due",
      createdAt : {
        $lt: new Date(new Date() - config.scheduler.collateral_expiration_duration_mins*60*1000),
      }
    },
  }).then(function(loans){
    _.forEach(loans, async function(loan){

        const result = await loan.update({
          status: "terminated"
        });
        //Todo: Implement SES bulk email send
        EmailService.sendLoanRequestTerminationEmail(result);
    });
  })
});


/*
* Scheduler for sending emails to lenders of those loan requests where Funds
* havent arrived after accepting the loan request.
* Scheduler would be running every day at midnight( currently running every 1 minute);
*/
var loanFundTransferReminder = schedule.scheduleJob(rule, function(){
  models.Loan.findAll({
    where: {
      status: "funds due",
    },
  }).then(function(loans){
    _.forEach(loans, async function(loan){

        const lender = await models.User.findOne({
            where: {
              userId: loan.lenderId,
            }
          });
        //Todo: Implement SES bulk email send
        EmailService.sendLoanRequestApprovalEmail(lender, loan);
    });
  })
});


/*
* Scheduler for sending emails to borrower for loans where Repayment is due
* Scheduler would be running every day at midnight( currently running every 1 minute);
*/
var loanRepaymentReminder = schedule.scheduleJob(rule, function(){
  models.Loan.findAll({
    where: {
      status: "active loan",
      expirationDate : {
        $between: [new Date(), new Date((new Date()).getTime() + config.scheduler.repayment_reminder_duration_mins*60*1000)],
      }
    },
  }).then(function(loans){
    _.forEach(loans, function(loan){
        //Todo: Implement SES bulk email send
        EmailService.sendRepaymentReminderEmail(loan);
    });
  })
});
