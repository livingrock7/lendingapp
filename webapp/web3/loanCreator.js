const env = process.env.NODE_ENV || 'development';
const config = require(`${__dirname}/../config/config.json`)[env];
var Web3 = require('web3');
const HDWalletProvider = require("truffle-hdwallet-provider");

var Eclaim = require("../helpers/eclaim");
var models = require('../models/');

const LoanCreator = require('../../build/contracts/LoanCreator.json');
const LoanContract = require('./loanContract');
const Web3Utils = require('./web3utils');

const mnemonic = config.mnemonic;

const provider = new HDWalletProvider(mnemonic, config.node_http_url);
var web3 = new Web3(provider);
// web3 version 1.0.0 websocket connection
var web3ws = new Web3(config.node_ws_url);


const loanCreator_address = config.loanCreator_address;

var default_account;

/* Getting account address for doing transaction*/
web3.eth.getAccounts()
  .then(function(accounts) {
    default_account = accounts[0];
  });

/*Loan Creator Contract Instance*/
var LoanCreatorInstance = new web3.eth.Contract(LoanCreator.abi,
  loanCreator_address, {
    from: default_account,
    gasPrice: config.gasPrice
  });

module.exports = {

  /*
   * @type: Ethereum Call
   * @desc: Returns Transaction data for ethereum transaction
   * @params: _transactionHash (hash of the transaction)
   * @returns: Transaction Data
   */
  getTransactionData: (_transactionHash) => {
    return new Promise((resolve, reject) => {
      web3.eth.getTransaction(_transactionHash)
        .then(function(data) {
          resolve(data);
        }).catch(console.error);
    });
  },

  /*
   * @type: Ethereum Transaction
   * @desc: Returns the collateral to borrower on loan request termination by Borrower
   * @params: orderBookId (loan request id)
   */
  returnCollateral: (orderBookId) => {
    LoanCreatorInstance.methods
      .returnCollateralToBorrower(orderBookId).send({
        from: default_account,
        gasPrice: config.gasPrice,
      }).on('transactionHash', function(hash) {
        // console.log(hash);
      }).on('receipt', function(receipt) {
        // console.log(receipt);
      }).on('error', console.error);
  },

  /*
   * @type: Batch Ethereum Transaction
   * @desc: Returns Collateral to Borrower after Loan Request Expiration
   * @params: orderBookId array
   */
  returnMultipleCollaterals: (orderBookId_array) => {
    LoanCreatorInstance.methods
      .multipleCollateralReturn(orderBookId_array).send({
        from: default_account,
        gas: 600000,
        gasPrice: config.gasPrice
      }).on('transactionHash', function(hash) {
        console.log(hash);
      }).on('receipt', function(receipt) {
        // console.log(receipt);
      }).on('error', console.error);
  },

  /*
   * @type: Ethereum Transaction
   * @desc: Updates Loan Creator with Loan Request Details after Collateral Arrival to Escrow
   * @params: loan (loan data object), callback
   * @returns: transaction receipt
   */
  updateLoanCollateralArrival: async (loan, done) => {

    const user = await models.User.findOne({
      where: {
        userId: loan.userId,
      }
    });

    var principal = loan.principal.toString();

    await LoanCreatorInstance.methods
      .updateCollateralArrival(user.ethAddress, web3.utils.toWei(principal, 'ether'),
        loan.token.erc20Address, loan.token.amount, loan.id).send({
        from: default_account,
        gasPrice: config.gasPrice
      }).on('transactionHash', function(hash) {
        // console.log(hash);
      }).on('receipt', async function(receipt) {
        // console.log(receipt);
        await loan.update({
          isLoanCreatorUpdated: true,
        });
        return done(receipt);
      }).on('error', console.error);
  },

  /*
   * @type: Ethereum Transaction
   * @desc: Creates Loan Contract with Loan Details after Funds Arrival to Escrow
   * @params: _orderbookId (loan request id), _duration(loan duration), _interest(loan interest),
              _insurancePremium (insurance premium rate), _insurer(insurer address), callback
   * @returns: transaction receipt
   */
  createLoanContract: async (_orderbookId, _duration, _interest, _insurancePremiumRate, _insurer, done) => {

    setTimeout(async function() {

      LoanCreatorInstance.methods
        .createLoanContract(_orderbookId, _duration, _interest, _insurancePremiumRate, _insurer).send({
          from: default_account,
          gasPrice: config.gasPrice
        })
        .on('transactionHash', function(hash) {
          // console.log(hash);
        }).on('receipt', async function(receipt) {
          // console.log(receipt);
          let loanId = receipt.events.LoanContractCreated.returnValues.loanId;
          let loanContractAddress = receipt.events.LoanContractCreated.returnValues.loan;

          const loan = await models.Loan.findOne({
            where: {
              OrderBookId: loanId,
            }
          });

          const expirationDate = await LoanContract.getExpirationDate(loanContractAddress);

          await loan.update({
            expirationDate: expirationDate,
            loanContractAddress: loanContractAddress,
          });

          createEclaimContract(loan);

          return done(receipt);

        }).on('error', console.error)
    }, config.transaction_delay);
  },

  /*
   * @type: Ethereum Call
   * @desc: returns SmartMoney Contract address
   * @params: callback
   * @returns: SMT Contract Address
   */
  getSmartMoneyAddress: (callback) => {

    LoanCreatorInstance.methods.getSMTAddress().call(function(err, result) {
      return callback(result);
    });
  },

  /*
   * @type: Ethereum Call
   * @desc: returns Evidence Data count for a loan
   * @params: orderbookId (loan request id)
   * @returns: Count of evidence data for the loan
   */
  getEvidenceDataCount: async (orderbookId) => {

    const dataCount = await LoanCreatorInstance.methods.getEvidenceDataCount(orderbookId).call();

    return dataCount;
  },

  /*
   * @type: Ethereum Call
   * @desc: Returns Evidence Data for a loan
   * @params: orderbookId (loan request id), index (data position)
   * @returns: Evidence data
   */
  getEvidenceData: async (orderbookId, index) => {

    const data = await LoanCreatorInstance.methods.getEvidenceData(orderbookId, index).call();

    return data;
  }

}

/*
 * @type: Eclaim
 * @desc: Updates Contract file pdf url
 * @params: loan (loan data)
 */
function createEclaimContract(loan) {
  let params = {
    parameter1: loan.lenderId,
    parameter2: loan.borrowerId,
    parameter3: loan.updatedAt,
    parameter4: loan.principal,
    parameter5: loan.interest,
    parameter6: loan.expirationDate
  }
  Eclaim.generateContractPdfUrl(loan.id, params, function(err, result) {
    if (!err) {
      loan.update({
        contractFilePath: result,
      });
    } else {
      console.log(err);
    }
  });
}
