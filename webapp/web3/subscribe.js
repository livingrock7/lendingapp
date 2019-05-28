const env = process.env.NODE_ENV || 'development';
const config = require(`${__dirname}/../config/config.json`)[env];
var Web3 = require('web3');
var _ = require('lodash');

const Web3Utils = require("./web3utils.js");
const Borrower = require('../api/services/borrower');
const Lender = require('../api/services/lender');
const Token = require('../api/services/tokens');
const LoanCreator = require('./loanCreator');
const EmailService = require("../helpers/emails");

var web3 = new Web3(config.node_ws_url);

const smart_money_address = config.smart_money_address;
const loanCreator_address = config.loanCreator_address;
const token_contract_address = config.token_contract_address;

/*
 * @type: Ethereum Subscription Service
 * @desc: Subscribe to "Transfer" event of SmartMoney
 */
var subscribe_smartMoney_events = web3.eth.subscribe('logs', {
  address: [smart_money_address],
  topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef']
}, function(error, result) {
  if (!error) {
    // console.log(result);
  }
}).on('data', function(log) {
  console.log("Logs", log);

  if (Web3Utils.removeLeadingZeroes(log.topics[1]) == '0x0') {
    EmailService.sendSmartMoneyCreationEmail(Web3Utils.removeLeadingZeroes(log.topics[2]),
      web3.utils.fromWei(web3.utils.hexToNumberString(log.data), 'ether'));
  } else if (Web3Utils.removeLeadingZeroes(log.topics[2]) == '0x0') {
    EmailService.sendSmartMoneyDestructionEmail(Web3Utils.removeLeadingZeroes(log.topics[1]),
      web3.utils.fromWei(web3.utils.hexToNumberString(log.data), 'ether'));
  }
}).on('changed', function(log) {});

/*
 * @type: Ethereum Subscription Service
 * @desc: Subscribe to "Transfer" event of Token Contracts
 */
var subscribe_token_events = web3.eth.subscribe('logs', {
  address: [token_contract_address],
  topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef']
}, function(error, result) {
  if (!error) {
    // console.log(result);
  }
}).on('data', async function(log) {
  console.log("Logs", log);

  if (Web3Utils.removeLeadingZeroes(log.topics[2]) == loanCreator_address) {

    const result = await Token.updateTokenStatus(log.transactionHash, 'arrived');
    const loan = await Borrower.updateLoanRequestStatus(result.orderBookId, 'active');

    EmailService.sendCollateralArrivalEmail(loan);

    LoanCreator.updateLoanCollateralArrival(loan, function(res) {
      console.log(res);
    });

  }
}).on('changed', function(log) {});

/*
 * @type: Ethereum Subscription Service
 * @desc: Subscribe to "StatusChanged" event of Loan Creator
 */
var subscribe_loanCreator_repay_event = web3.eth.subscribe('logs', {
  address: [loanCreator_address],
  topics: ['0x48201b6e5ad34cc56c45feeb0b01c7cca5181d4836e24a1c7c2142ee382e121f']
}, function(error, result) {
  if (!error) {
    // console.log(result);
  }
}).on('data', function(log) {
  console.log("Logs", log);
  if( web3.utils.hexToNumberString(log.topics[2]) > 6){
    let orderbookId = web3.utils.hexToNumberString(log.topics[1]);
    let txnId = log.transactionHash;
    let statusCode = web3.utils.hexToNumberString(log.topics[2]);
    Borrower.updateOnLoanRepayment(txnId, orderbookId, statusCode);
  }
}).on('changed', function(log) {});

/*
 * @type: Ethereum Subscription Service
 * @desc: Subscribe to "FundsArrived" event of Loan Creator
 */
var subscribe_loanCreator_fund_event = web3.eth.subscribe('logs', {
  address: [loanCreator_address],
  topics: ['0xa2400992484f3407e79078bf6dd193c61d2e78b8daeee3b96dc1f3a733544936']
}, function(error, result) {
  if (!error) {
    // console.log(result);
  }
}).on('data', function(log) {
  console.log("Logs", log);
  if(_.isEqual(Web3Utils.removeLeadingZeroes(log.topics[2]), loanCreator_address)){
    Lender.updateOnFundArrival(web3.utils.hexToNumberString(log.topics[3]));
  }
}).on('changed', function(log) {});

/*
 * @type: Ethereum Subscription Service
 * @desc: Subscribe to "CollateralReturnedToBorrower" event of Loan Creator
 */
var subscribe_loanCreator_return_collateral_event = web3.eth.subscribe('logs', {
  address: [loanCreator_address],
  topics: ['0xb79b348f8a1564658ed3021da9b4a077de834e3869411d7194f4dab4d80cf853']
}, function(error, result) {
  if (!error) {
    // console.log(result);
  }
}).on('data', function(log) {
  console.log("Logs", log);
  if(_.isEqual(Web3Utils.removeLeadingZeroes(log.topics[1]), loanCreator_address)){
    Borrower.updateOnLoanRequestTermination(web3.utils.hexToNumberString(log.topics[3]));
  }
}).on('changed', function(log) {});
