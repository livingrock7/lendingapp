const env = process.env.NODE_ENV || 'test';
const config = require(`${__dirname}/../config/config.json`)[env];

var Web3 = require('web3');
var assert = require('chai').assert,
  expect = require('chai').expect;
var models = require('../models/');
const math = require('mathjs');

const helper = require("./helpers/truffleTestHelpers");

const sequelize_fixtures = require('sequelize-fixtures');
var fixtures = require('../config/interest_data.json');

const LoanCreator = require('../../build/contracts/LoanCreator.json');
const TokenContract = require('../../build/contracts/StandardToken.json');
const LoanContract = require('../../build/contracts/LoanContract.json');

const Borrower = require('../api/services/borrower');
const Lender = require('../api/services/lender');
const Token = require('../api/services/tokens');
const Interest = require('../api/services/interest');
const Loans = require('../api/services/loans');

var loanCreator = require("../web3/loanCreator");
const Collateral = require('../helpers/collateral');

describe('Smartcredit Integration Test', () => {

  let borrower, lender;

  let admin, borrowerAddress, lenderAddress;

  let web3;

  let escrow = config.loanCreator_address;
  let tokenAddress = config.token_contract_address;

  let LoanCreatorInstance, StandardTokenInstance;


  before('Initialize Database and Ethereum', async () => {

    web3 = new Web3(config.node_http_url);

    await web3.eth.getAccounts()
      .then(function(accounts) {
        admin = accounts[0];
        borrowerAddress = accounts[1];
        lenderAddress = accounts[2];
      });

    const borrowerCredentials = {
      user: "Borrower Joe",
      email: "borrower@test.com",
      userId: "112233",
      authProvider: "ICO dashboard",
      ethAddress: borrowerAddress
    }

    const lenderCredentials = {
      user: "Lender Joe",
      email: "lender@test.com",
      userId: "223344",
      authProvider: "ICO dashboard",
      ethAddress: lenderAddress
    }

    /*
     * Sync Test Database and Create Users
     */
    await models.sequelize
      .sync().then(async function() {

        await sequelize_fixtures.loadFixtures(fixtures, models);

        await models.User.create(borrowerCredentials)
          .then(function(result) {
            borrower = result;
            assert.isObject(result, "Borrower wasn't created sucessfully");
          });
        await models.User.create(lenderCredentials)
          .then(function(result) {
            lender = result;
            assert.isObject(result, "Lender wasn't created sucessfully");
          });
      }).catch(function(err) {
        console.log(err, "Something went wrong with the Database Update!")
      });



    /*
     * Initialize Instance for LoanCreator and StandardToken
     */
    LoanCreatorInstance = new web3.eth.Contract(LoanCreator.abi,
      escrow, {
        gasPrice: '200000000000'
      });

    StandardTokenInstance = new web3.eth.Contract(TokenContract.abi,
      tokenAddress, {
        gasPrice: '200000000000'
      });


    /*
     * Transfer ERC20 tokens to borrower account for collateral usage
     */
    await StandardTokenInstance.methods
      .transfer(borrowerAddress, 10000).send({
        from: admin
      }).on('error', console.error);

  });

  describe('Test Collateral Value Calculation', async () => {
    let tokenValue;

    before('Get Token Value', async () => {
      tokenValue = await Collateral.getERC20TokenValue('JPY');
    });

    it('should get ERC20 token price from cryptocompare', () => {
      assert.isNotNull(tokenValue, 'Token value not calculated correctly');
    });

  });

  //Todo: Add test for Interest Value caluclation for a credit rating

  describe('Test Loan Request', () => {

    let orderbookId, loanId, loan_request;

    before('Initialize Loan Request Data', () => {

      let now = new Date();
      loan_request = {
        principal: 1,
        duration: 23,
        interest: 4,
        validtill: new Date(now.getDate() + 1),
        use: "mining",
        riskRating: 4,
        ensDomain: "drchiggs",
        ensValue: 0.01,
        token: "JPY",
        tokenAmount: 100,
        tokenValue: 0.11
      };

    });

    describe('Test Loan Request Creation Without Collateral', () => {

      let collateralData;

      before('Create Loan Request', async () => {

        orderbookId = await Borrower.createBorrowerLoanRequest(loan_request, borrower);

        collateralData = await Borrower.fetchCollateralDetails(orderbookId);

      });

      it('should create a loan request', () => {
        assert.isNotNull(orderbookId, 'Loan Request not created correctly');
      });

      it('should update Loan Request to collateral due', async () => {
        const loan = await models.OrderBook.findById(orderbookId);

        assert.equal(loan.status, 'collateral due', "Loan request status wasn't updated correctly");
      });

      it('should return stored collateral information', () => {
        assert.isObject(collateralData.token, 'ERC20 collateral information not returned correctly');
        assert.equal(collateralData.token.erc20Token, loan_request.token, 'Correct ERC20 Token not returned');
        assert.isObject(collateralData.ens, 'ENSDomain collateral information not returned correctly');
        assert.equal(collateralData.ens.ensDomain, loan_request.ensDomain, 'Correct ENS Domain not returned');
      });

      describe('Test Loan Request With Collateral', async () => {

        before('Transfer Collateral to Escrow', async () => {

          return new Promise(async function(resolve, reject) {

            await StandardTokenInstance.methods
              .transfer(escrow, collateralData.token.amount).send({
                from: borrowerAddress
              }).on('transactionHash', async function(hash) {
                await Borrower.updateTokenTransferHash({
                  orderbookId: orderbookId,
                  txnId: hash,
                  from: borrowerAddress
                });
              }).on('receipt', async function(receipt) {
                const result = await Token.updateTokenStatus(receipt.transactionHash, 'arrived');
                const loan = await Borrower.updateLoanRequestStatus(result.orderBookId, 'active');
                resolve();
              }).on('error', console.error);
          });

        });

        it('should update transaction hash on token transfer', async () => {

          const token = await models.Token.findOne({
            where: {
              orderBookId: orderbookId
            },
          });

          assert.isNotNull(token.txnId, 'Transaction Id for token transfer not updated');
        });

        it('should update token status to arrived', async () => {
          const token = await models.Token.findOne({
            where: {
              orderBookId: orderbookId
            },
          });

          assert.equal(token.status, 'arrived', 'Tokens not arrived to escrow');
        });

        it('should update loan request status to active', async () => {

          const loan = await models.OrderBook.findById(orderbookId);

          assert.equal(loan.status, 'active', "Loan request status wasn't updated correctly");
        });

        describe('Test Loan Request Details Update to Loan Creator', async () => {

          before('Update Loan Creator on Collateral Arrival', async () => {

            return new Promise(async function(resolve, reject) {

              const loan = await models.OrderBook.findOne({
                where: {
                  id: orderbookId
                },
                include: [{
                  model: models.Token,
                  as: 'token',
                }, {
                  model: models.Domain,
                  as: 'ensDomain',
                }],
              });;

              loanCreator.updateLoanCollateralArrival(loan, function(res) {
                resolve();
              });
            });
          });

          it('should update LoanCreator Contract on collateral arrival', async () => {
            const loan = await models.OrderBook.findById(orderbookId);
            assert.equal(loan.isLoanCreatorUpdated, true, "LoanCreator Contract wasn't updated correctly");
          });

          describe('Test Approving Loan Request Without Funds', () => {

            before('Approve Loan Request', () => {

              return new Promise(async (resolve) => {
                loanId = await Lender.approveLoanRequest(orderbookId, lender);
                resolve();
              });
            });

            it('should create loan on loan request approval', async () => {
              const loan = await models.Loan.findById(loanId);

              assert.isNotNull(loan, "Loan wasn't created correctly");
            });

            it('should update Loan Request status to funds due', async () => {
              const loan = await models.OrderBook.findById(orderbookId);

              assert.equal(loan.status, 'funds due', "Loan Request status wasn't updated correctly");
            });

            describe('Test Funding Approved Loan Request', () => {

              before('Transfer funds to Approved Loan Request', () => {

                return new Promise(async (resolve) => {

                  const loan = await models.Loan.findById(loanId);

                  await LoanCreatorInstance.methods
                    .transferFunds(loanId, orderbookId).send({
                      from: lenderAddress,
                      gas: 3000000,
                      value: web3.utils.toWei(loan.principal.toString(), 'ether')
                    }).on('receipt', async function(receipt) {
                      const loan = await Loans.loanActivate(orderbookId);
                      resolve();
                    }).on('error', console.error);
                });
              });

              it('should update loan status to active loan', async () => {
                const loan = await models.Loan.findById(loanId);

                assert.equal(loan.status, 'active loan', "Loan Status wasn't updated correctly");
              });

              describe('Test Loan Contract Creation on Fund Arrival', () => {

                before('Create Loan Contract', () => {

                  return new Promise(async (resolve) => {

                    const loan = await models.Loan.findById(loanId);

                    const insurancePremiumRate = await Interest.getInsurancePremium(loan.OrderBookId);
                    const interestRate = math.format(math.eval(loan.interest * 10 ** config.precision), config.precision + 1);

                    loanCreator.createLoanContract(loan.OrderBookId, loan.duration,
                      interestRate, insurancePremiumRate, config.insurer_eth_address,
                      function(res) {
                        resolve();
                      });
                  });
                });

                it('should get loan contract address', async () => {
                  const loan = await models.Loan.findById(loanId);

                  assert.isNotNull(loan.loanContractAddress, "Loan Contract Address wasn't updated correctly");
                });


                //Todo: add smartmoney tokens test for lender

                describe('Test Repayment of Loan by Borrower', () => {

                  before('Repayment by Borrower', () => {

                    return new Promise(async (resolve) => {

                      const loan = await models.Loan.findById(loanId);

                      await web3.eth.sendTransaction({
                        from: borrowerAddress,
                        to: loan.loanContractAddress,
                        gas: 8000000,
                        value: web3.utils.toWei(loan.outstandingAmount.toString(), 'ether')
                      }).on('receipt', async function(receipt) {
                        await Borrower.updateOnLoanRepayment(receipt.transactionHash, orderbookId, 7);
                        resolve();
                      }).on('error', console.error);

                    });

                  });

                  it('should update loan status to repaid', async () => {

                    const loan = await models.Loan.findById(loanId);

                    assert.equal(loan.status, 'repaid', "Loan Status wasn't updated correctly");
                  });

                  it('should have loan outstanding Amount equal to zero', async () => {

                    const loan = await models.Loan.findById(loanId);

                    assert.equal(loan.outstandingAmount, 0, "Loan Outstanding Amount isn't correctly");

                  });
                });
              });
            });
          });
        });
      });
    });
  });



  describe('Test Bad Loan', () => {

    let orderbookId, loanId, loan_request;

    beforeEach('Create Loan Request', () => {

      let now = new Date();
      loan_request = {
        principal: 10,
        duration: 10,
        interest: 4,
        validtill: new Date(now.getDate() + 1),
        use: "mining",
        riskRating: 4,
        ensDomain: "drchiggs",
        ensValue: 0.01,
        token: "JPY",
        tokenAmount: 100,
        tokenValue: 0.11
      };

      return new Promise(async (resolve) => {

        orderbookId = await Borrower.createBorrowerLoanRequest(loan_request, borrower);

        let collateralData = await Borrower.fetchCollateralDetails(orderbookId);

        await StandardTokenInstance.methods
          .transfer(escrow, collateralData.token.amount).send({
            from: borrowerAddress
          }).on('transactionHash', async function(hash) {

            await Borrower.updateTokenTransferHash({
              orderbookId: orderbookId,
              txnId: hash,
              from: borrowerAddress
            });

          }).on('receipt', async function(receipt) {

            const result = await Token.updateTokenStatus(receipt.transactionHash, 'arrived');

            let loan = await Borrower.updateLoanRequestStatus(result.orderBookId, 'active');

            loanCreator.updateLoanCollateralArrival(loan, async function(res) {

              loanId = await Lender.approveLoanRequest(orderbookId, lender);

              let amt = web3.utils.toWei(loan.principal.toString(), 'ether');

              await LoanCreatorInstance.methods
                .transferFunds(loanId, orderbookId).send({
                  from: lenderAddress,
                  gas: 3000000,
                  value: amt
                }).on('receipt', async function(receipt) {

                  loan = await Loans.loanActivate(orderbookId);

                  const insurancePremiumRate = await Interest.getInsurancePremium(loan.OrderBookId);
                  const interestRate = math.format(math.eval(loan.interest * 10 ** config.precision), config.precision + 1);

                  loanCreator.createLoanContract(loan.OrderBookId, loan.duration,
                    interestRate, insurancePremiumRate, config.insurer_eth_address,
                    async function(res) {
                      resolve();
                    });
                }).on('error', console.error);
            });
          }).on('error', console.error);
      });
    });

    describe('Test Repayment of Bad Loan by Insurer', () => {

      beforeEach('Repayment of Only Principal by Insurer', () => {

        return new Promise(async (resolve) => {

          await helper.advanceTime(600000);

          const loan = await models.Loan.findById(loanId);

          await web3.eth.sendTransaction({
            from: config.insurer_eth_address,
            to: loan.loanContractAddress,
            gas: 8000000,
            value: web3.utils.toWei(loan.principal.toString(), 'ether')
          }).on('receipt', async function(receipt) {
            await Borrower.updateOnLoanRepayment(receipt.transactionHash, orderbookId, 9);
            resolve();
          }).on('error', console.error);

        });

      });

      it('should update loan status to bad loan repaid', async () => {

        const loan = await models.Loan.findById(loanId);

        assert.equal(loan.status, 'bad loan repaid', "Loan Status wasn't updated correctly");
      });

      it('should update isRepaidByInsurer to true', async () => {

        const loan = await models.Loan.findById(loanId);

        assert.equal(loan.isRepaidByInsurer, true, "isRepaidByInsurer should be true");
      });

      it('should have loan outstanding Amount not zero', async () => {

        const loan = await models.Loan.findById(loanId);

        assert.notEqual(loan.outstandingAmount, 0, "Loan Outstanding Amount isn't correctly");
      });

      describe('Test Repayment of Bad Loan by Borrower after Insurer Repayment', () => {

        beforeEach('Repayment by Borrower', () => {

          return new Promise(async (resolve) => {

            const loan = await models.Loan.findById(loanId);

            await web3.eth.sendTransaction({
              from: borrowerAddress,
              to: loan.loanContractAddress,
              gas: 8000000,
              value: web3.utils.toWei(loan.outstandingAmount.toString(), 'ether')
            }).on('receipt', async function(receipt) {
              await Borrower.updateOnLoanRepayment(receipt.transactionHash, orderbookId, 8);
              resolve();
            }).on('error', console.error);

          });

        });

        it('should update loan status to bad loan repaid by borrower', async () => {

          const loan = await models.Loan.findById(loanId);

          assert.equal(loan.status, 'bad loan repaid by borrower', "Loan Status wasn't updated correctly");
        });

        it('should keep isRepaidByInsurer to true', async () => {

          const loan = await models.Loan.findById(loanId);

          assert.equal(loan.isRepaidByInsurer, true, "isRepaidByInsurer should be true");
        });

        it('should have loan outstanding Amount equal to zero', async () => {

          const loan = await models.Loan.findById(loanId);

          assert.equal(loan.outstandingAmount, 0, "Loan Outstanding Amount isn't correctly");
        });

      });

    });

    describe('Test Repayment of Bad Loan by Borrower', () => {

      beforeEach('Repayment by Borrower', () => {

        return new Promise(async (resolve) => {

          await helper.advanceTime(600000);

          const loan = await models.Loan.findById(loanId);

          await web3.eth.sendTransaction({
            from: borrowerAddress,
            to: loan.loanContractAddress,
            gas: 8000000,
            value: web3.utils.toWei(loan.outstandingAmount.toString(), 'ether')
          }).on('receipt', async function(receipt) {
            await Borrower.updateOnLoanRepayment(receipt.transactionHash, orderbookId, 8);
            resolve();
          }).on('error', console.error);

        });

      });

      it('should update loan status to bad loan repaid by borrower', async () => {

        const loan = await models.Loan.findById(loanId);

        assert.equal(loan.status, 'bad loan repaid by borrower', "Loan Status wasn't updated correctly");
      });

      it('should update isRepaidByInsurer to false', async () => {

        const loan = await models.Loan.findById(loanId);

        assert.equal(loan.isRepaidByInsurer, false, "isRepaidByInsurer should be false");
      });

      it('should have loan outstanding Amount equal to zero', async () => {

        const loan = await models.Loan.findById(loanId);

        assert.equal(loan.outstandingAmount, 0, "Loan Outstanding Amount isn't correctly");
      });

      describe('Test Repayment of Bad Loan by Insurer after Borrower Repayment', () => {

        beforeEach('Repayment of Only Principal by Insurer', () => {

          return new Promise(async (resolve) => {

            const loan = await models.Loan.findById(loanId);

            await web3.eth.sendTransaction({
              from: config.insurer_eth_address,
              to: loan.loanContractAddress,
              gas: 8000000,
              value: web3.utils.toWei(loan.principal.toString(), 'ether')
            }).on('receipt', async function(receipt) {
              await Borrower.updateOnLoanRepayment(receipt.transactionHash, orderbookId, 9);
              resolve();
            }).on('error', console.error);

          });

        });

        it('should keep loan status to bad loan repaid by borrower', async () => {

          const loan = await models.Loan.findById(loanId);

          assert.equal(loan.status, 'bad loan repaid by borrower', "Loan Status wasn't updated correctly");
        });

        it('should update isRepaidByInsurer to true', async () => {

          const loan = await models.Loan.findById(loanId);

          assert.equal(loan.isRepaidByInsurer, true, "isRepaidByInsurer should be true");
        });

        it('should have loan outstanding Amount equal to zero', async () => {

          const loan = await models.Loan.findById(loanId);

          assert.equal(loan.outstandingAmount, 0, "Loan Outstanding Amount isn't correctly");
        });

      });

    });

  });

  describe('Test Loan Request Termination', () => {

    let orderbookId, loanId, loan_request;

    beforeEach('Initialize Loan Request Data', async () => {

      let now = new Date();
      loan_request = {
        principal: 1,
        duration: 23,
        interest: 4,
        validtill: new Date(now.getDate() + 1),
        use: "mining",
        riskRating: 4,
        ensDomain: "drchiggs",
        ensValue: 0.01,
        token: "JPY",
        tokenAmount: 100,
        tokenValue: 0.11
      };

      orderbookId = await Borrower.createBorrowerLoanRequest(loan_request, borrower);

    });

    describe('Test Loan Request Termination Without Collateral', () => {

      beforeEach('Terminate Loan Request Without Collateral', async () => {

        return new Promise(async (resolve) => {
          await Borrower.terminateLoanRequest(orderbookId);
          resolve();
        });

      });
      it('should update loan request status to terminated', async () => {

        const loan = await models.OrderBook.findById(orderbookId);
        assert.equal(loan.status, 'terminated', "Loan request status wasn't updated correctly");

      });
    });

    describe('Test Loan Request Termination With Collateral', () => {

      let initial_borrower_token_amount;

      beforeEach('Terminate Loan Request With Collateral', async () => {

        return new Promise(async (resolve) => {

          let collateralData = await Borrower.fetchCollateralDetails(orderbookId);
          await StandardTokenInstance.methods
            .transfer(escrow, collateralData.token.amount).send({
              from: borrowerAddress
            }).on('transactionHash', async function(hash) {
              await Borrower.updateTokenTransferHash({
                orderbookId: orderbookId,
                txnId: hash,
                from: borrowerAddress
              });
            }).on('receipt', async function(receipt) {
              const result = await Token.updateTokenStatus(receipt.transactionHash, 'arrived');
              const loan = await Borrower.updateLoanRequestStatus(result.orderBookId, 'active');
              loanCreator.updateLoanCollateralArrival(loan, async function(res) {
                initial_borrower_token_amount = await StandardTokenInstance.methods.balanceOf(borrowerAddress).call();
                await Borrower.terminateLoanRequest(orderbookId);
                resolve();
              });
            }).on('error', console.error);

        });
      });

      it('should update loan request status to terminated', async () => {

        const loan = await models.OrderBook.findById(orderbookId);
        assert.equal(loan.status, 'terminated', "Loan request status wasn't updated correctly");

      });

      it('should return collateral to borrower', async () => {

        setTimeout(async function(){
          assert.equal(await StandardTokenInstance.methods.balanceOf(borrowerAddress).call(),
            parseInt(initial_borrower_token_amount) + +(loan_request.tokenAmount),
            "Collateral wasn't returned to borrower correctly");
        }, 500)

      });
    });
  });

  after('delete user', async () => {

    await models.sequelize.drop().then(function() {

      models.sequelize.close();

    });
  });

});
