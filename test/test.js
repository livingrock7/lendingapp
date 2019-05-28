const helper = require("./helpers/truffleTestHelpers");
const math = require("mathjs");
var LoanCreator = artifacts.require("./LoanCreator.sol");
var LoanContract = artifacts.require("./LoanContract.sol");
var StandardToken = artifacts.require("./StandardToken.sol");
var SmartMoney = artifacts.require("./SmartMoney.sol");

contract("Loan Contract", function(accounts) {
  var admin = accounts[0];

  let standardToken;
  let loanCreator;

  var loan_request = {
    orderbook_id: 1,
    loan_id: 1,
    principal: web3.toWei(10, 'ether'),
    duration: 100,
    interest: 476,
    tokenAmount: 100,
    tokenAddress: 0x0,
    insurancePremium: 248,
    outstandingAmount: web3.toWei(10.476, 'ether'),
    insurer: accounts[3],
    borrower: accounts[1],
    lender: accounts[2]
  }

  describe("Scenario 1: Borrower Repays Loan on time", () => {

    let initial_platform_balance, initial_insurer_balance, initial_lender_balance;
    let initial_user2_balance, initial_user3_balance, initial_user4_balance, initial_user5_balance;


    before('Deploy Loan Creator and Token Contract', async () => {

      loanCreator = await LoanCreator.new(50, admin);
      standardToken = await StandardToken.new("Test Tokens", "TTT", 18, 10000000);
      loan_request.tokenAddress = standardToken.address;

      await standardToken.transfer(loan_request.borrower, 10000, {
        from: admin,
        gas: 300000
      });

    });

    it('should transfer collateral to ESCROW and update loan details on collateral arrival from BORROWER', async () => {

      let initial_escrow_token_balance = await standardToken.balanceOf.call(loanCreator.address);

      await standardToken.transfer(loanCreator.address, loan_request.tokenAmount, {
        from: loan_request.borrower,
        gas: 300000
      });

      await loanCreator.updateCollateralArrival(loan_request.borrower, loan_request.principal,
        loan_request.tokenAddress, loan_request.tokenAmount, loan_request.orderbook_id, {
          from: admin,
          gas: 300000
        });

      var loanData = await loanCreator.loans.call(loan_request.orderbook_id);

      assert.equal((await standardToken.balanceOf.call(loanCreator.address)).toNumber(),
        math.eval(initial_escrow_token_balance + loan_request.tokenAmount),
        "Tokens weren't transferred correctly to ESCROW");

      assert.equal(loanData[0].toNumber(), loan_request.principal,
        "Principal wasn't correctly updated");

      assert.equal(loanData[1].toNumber(), 0,
        "Loan Status wasn't updated to CREATE");

      assert.equal(loanData[3], loan_request.borrower,
        "Borrower Address wasn't correctly updated");

      assert.equal(loanData[4], loan_request.tokenAddress,
        "Token Address wasn't correctly updated");

      assert.equal(loanData[5].toNumber(), loan_request.tokenAmount,
        "Token Amount wasn't correctly updated");

    });

    it('should transfer funds to ESCROW on loan request approval', async () => {

      var initial_escrow_balance = web3.eth.getBalance(loanCreator.address);

      await loanCreator.transferFunds(loan_request.loan_id, loan_request.orderbook_id, {
        from: loan_request.lender,
        value: loan_request.principal,
        gas: 300000
      });

      let loanData = await loanCreator.loans.call(loan_request.orderbook_id);

      assert.equal((web3.eth.getBalance(loanCreator.address)).toNumber(),
        math.eval(initial_escrow_balance.toNumber() + loan_request.principal),
        "Required funds not transferred to escrow");

      assert.equal(loanData[1].toNumber(), 1,
        "Loan Status wasn't updated to ACCEPT");

      assert.equal(loanData[6], loan_request.lender,
        "Lender Address wasn't correctly updated");

      assert.equal(loanData[7], loan_request.loan_id,
        "Loan Id wasn't correctly updated");
    });

    it('should create Loan Contract on fund arrival and transfer funds to BORROWER', async () => {

      let initial_borrower_balance = web3.eth.getBalance(loan_request.borrower);

      await loanCreator.createLoanContract(loan_request.orderbook_id, loan_request.duration,
        loan_request.interest, loan_request.insurancePremium, loan_request.insurer, {
          from: admin,
          gas: 3000000
        });

      let loanData = await loanCreator.loans.call(loan_request.orderbook_id);

      assert.equal((web3.eth.getBalance(loan_request.borrower)).toNumber(),
        initial_borrower_balance.toNumber() + +(loan_request.principal),
        "Principal wasn't transferred to Borrower correctly");

      assert.equal(loanData[6], loan_request.lender,
        "Lender Address wasn't correctly updated");

      assert.equal(loanData[1].toNumber(), 2,
        "Loan Status wasn't updated to ACTIVE");

      assert.notEqual(loanData[8], 0x0,
        "Loan Contract wasn't created correctly");

      assert.equal(loanData[2].toNumber(), 1,
        "Loan wasn't tokenized");

    });

    it('should transfer collateral to Loan Contract and Update Loan Contract Details', async () => {

      var loanData = await loanCreator.loans.call(loan_request.orderbook_id);

      let loan_contract_address = loanData[8];
      let loanContract = await LoanContract.at(loan_contract_address);

      assert.equal((await standardToken.balanceOf.call(loanData[8])).toNumber(),
        loan_request.tokenAmount,
        "Tokens weren't transferred correctly to LOAN CONTRACT");

      assert.equal(await loanContract.principal.call(), loan_request.principal,
        "Loan Principal wasn't correctly set");

      assert.equal(await loanContract.interest.call(), loan_request.interest,
        "Loan Interest wasn't correctly set");

      assert.equal(await loanContract.duration.call(), loan_request.duration,
        "Loan Duration wasn't correctly set");

      assert.equal(await loanContract.loanId.call(), loan_request.loan_id,
        "Loan ID wasn't correctly set");

      assert.equal(await loanContract.orderBookId.call(), loan_request.orderbook_id,
        "OrderBookId wasn't correctly set");

      // assert.equal(await loanContract.borrower.call(), loan_request.borrower,
      //   "Loan Borrower wasn't correctly set");
      //
      // assert.equal(await loanContract.lender.call(), loan_request.lender,
      //   "Loan Lender wasn't correctly set");

      assert.equal(await loanContract.outstandingAmount.call(), loan_request.outstandingAmount,
        "Loan Outstanding Amount wasn't correctly set");

      assert.equal(await loanContract.tokenAddress.call(), loan_request.tokenAddress,
        "Token Address wasn't correctly set");

      assert.equal(await loanContract.tokenAmount.call(), loan_request.tokenAmount,
        "Token Amount wasn't correctly set");
    });

    it('should tokenize SMT for the loan', async () => {

      let smartMoney_address = await loanCreator.getSMTAddress();
      let smartMoney = await SmartMoney.at(smartMoney_address);

      assert(await smartMoney.balanceOf(loan_request.lender), loan_request.principal,
        "SMT tokens weren't transferred to Lender");

      await smartMoney.transfer(accounts[4], web3.toWei(4, 'ether'), {
        from: loan_request.lender,
        gas: 300000
      });

      await smartMoney.transfer(accounts[5], web3.toWei(2, 'ether'), {
        from: loan_request.lender,
        gas: 300000
      });

      await smartMoney.transfer(accounts[6], web3.toWei(1, 'ether'), {
        from: loan_request.lender,
        gas: 300000
      });

      await smartMoney.transfer(accounts[7], web3.toWei(1, 'ether'), {
        from: loan_request.lender,
        gas: 300000
      });

    });

    it("shouldn't let insurer repay if loan is not bad loan", async () => {

      let addError;

      let loanData = await loanCreator.loans.call(loan_request.orderbook_id);

      let loan_contract_address = loanData[8];
      let loanContract = await LoanContract.at(loan_contract_address);

      try {
        await loanContract.sendTransaction({
          from: loan_request.insurer,
          value: web3.toWei(10, 'ether'),
          gas: 300000
        });
      } catch (error) {
        addError = error;
      }

      assert.notEqual(addError, undefined, 'Transaction should be reverted');

    });

    it('should let Borrower repay the loan and get collateral back', async () => {

      let loanData = await loanCreator.loans.call(loan_request.orderbook_id);

      let loan_contract_address = loanData[8];
      let loanContract = await LoanContract.at(loan_contract_address);

      let initial_borrower_token_amount = await standardToken.balanceOf(loan_request.borrower);

      initial_lender_balance = web3.eth.getBalance(loan_request.lender);
      initial_platform_balance = web3.eth.getBalance(admin);
      initial_insurer_balance = web3.eth.getBalance(loan_request.insurer);
      initial_user2_balance = web3.eth.getBalance(accounts[4]);
      initial_user3_balance = web3.eth.getBalance(accounts[5]);
      initial_user4_balance = web3.eth.getBalance(accounts[6]);
      initial_user5_balance = web3.eth.getBalance(accounts[7])

      await loanContract.sendTransaction({
        from: loan_request.borrower,
        value: loan_request.outstandingAmount,
        gas: 800000
      });

      assert.equal((await standardToken.balanceOf.call(loan_request.borrower)).toNumber(),
        initial_borrower_token_amount.toNumber() + +(loan_request.tokenAmount),
        "Correct token amount weren't returned to borrower");

      assert.equal(await loanContract.outstandingAmount.call(), 0,
        "Loan Outstanding Amount wasn't correctly updated to 0");

    });


    it('should transfer principal + interest to the credited Owners of SMT on Pro rata basis', async () => {

      assert.equal((web3.eth.getBalance(loan_request.lender)).toNumber(),
        initial_lender_balance.toNumber() + +(web3.toWei(2.0356, 'ether')),
        "Correct amount wasn't transferred to lender");

      assert.equal((web3.eth.getBalance(accounts[4])).toNumber(),
        initial_user2_balance.toNumber() + +(web3.toWei(4.0712, 'ether')),
        "Correct amount wasn't transferred to SMT holder 2");

      assert.equal((web3.eth.getBalance(accounts[5])).toNumber(),
        initial_user3_balance.toNumber() + +(web3.toWei(2.0356, 'ether')),
        "Correct amount wasn't transferred to SMT holder 3");

      assert.equal((web3.eth.getBalance(accounts[6])).toNumber(),
        initial_user4_balance.toNumber() + +(web3.toWei(1.0178, 'ether')),
        "Correct amount wasn't transferred to SMT holder 4");

      assert.equal((web3.eth.getBalance(accounts[7])).toNumber(),
        initial_user5_balance.toNumber() + +(web3.toWei(1.0178, 'ether')),
        "Correct amount wasn't transferred to SMT holder 5");

    });

    it('should destroy SMT for this loan', async () => {

      let loanData = await loanCreator.loans.call(loan_request.orderbook_id);

      let smartMoney_address = await loanCreator.getSMTAddress();
      let smartMoney = await SmartMoney.at(smartMoney_address);

      assert.equal((await smartMoney.getCreditedOwners(loan_request.orderbook_id)).length, 0,
        "Correct SmartMoney Tokens weren't destroyed");

      assert.equal(loanData[2].toNumber(), 0,
        "Loan wasn't detokenized");

    });

    it('should transfer platform fee to platform', async () => {

      let loanData = await loanCreator.loans.call(loan_request.orderbook_id);

      let loan_contract_address = loanData[8];
      let loanContract = await LoanContract.at(loan_contract_address);

      assert.equal((web3.eth.getBalance(admin)).toNumber(),
        initial_platform_balance.toNumber() + +(await loanContract.platformFee.call()),
        "Correct amount wasn't transferred to platform");

    });

    it('should transfer insurance premium to insurer', () => {

      assert.equal((web3.eth.getBalance(loan_request.insurer)).toNumber(),
        initial_insurer_balance.toNumber() + +(web3.toWei(0.248, 'ether')),
        "Correct amount wasn't transferred to insurer");

    });

    it('should update loan status to BORROWER_PAYS_ON_TIME', async () => {

      let loanData = await loanCreator.loans.call(loan_request.orderbook_id);

      assert.equal(loanData[1].toNumber(), 7,
        "Loan Status wasn't correctly updated to BORROWER PAYS ON TIME");

    });

  });

  describe("Scenario 2: Loan Becomes NPL and Insurer Takes Over", () => {

    let initial_platform_balance, initial_insurer_balance, initial_lender_balance;
    let initial_user2_balance, initial_user3_balance, initial_user4_balance, initial_user5_balance;


    before('Create Loan Contract and Advance Time', async () => {

      loanCreator = await LoanCreator.new(50, admin);
      standardToken = await StandardToken.new("Test Tokens", "TTT", 18, 10000000);
      loan_request.tokenAddress = standardToken.address;

      await standardToken.transfer(loan_request.borrower, 10000, {
        from: admin,
        gas: 300000
      });

      await standardToken.transfer(loanCreator.address, loan_request.tokenAmount, {
        from: loan_request.borrower,
        gas: 300000
      });

      await loanCreator.updateCollateralArrival(loan_request.borrower, loan_request.principal,
        loan_request.tokenAddress, loan_request.tokenAmount, loan_request.orderbook_id, {
          from: admin,
          gas: 300000
        });

      await loanCreator.transferFunds(loan_request.loan_id, loan_request.orderbook_id, {
        from: loan_request.lender,
        value: loan_request.principal,
        gas: 300000
      });

      await loanCreator.createLoanContract(loan_request.orderbook_id, loan_request.duration,
        loan_request.interest, loan_request.insurancePremium, loan_request.insurer, {
          from: admin,
          gas: 3000000
        });

      let smartMoney_address = await loanCreator.getSMTAddress();
      let smartMoney = await SmartMoney.at(smartMoney_address);

      await smartMoney.transfer(accounts[4], web3.toWei(4, 'ether'), {
        from: loan_request.lender,
        gas: 300000
      });

      await smartMoney.transfer(accounts[5], web3.toWei(2, 'ether'), {
        from: loan_request.lender,
        gas: 300000
      });

      await smartMoney.transfer(accounts[6], web3.toWei(1, 'ether'), {
        from: loan_request.lender,
        gas: 300000
      });

      await smartMoney.transfer(accounts[7], web3.toWei(1, 'ether'), {
        from: loan_request.lender,
        gas: 300000
      });

      await helper.advanceTime(600000);

    });


    it('should let INSURER repay the bad loan and get its collateral', async () => {

      let loanData = await loanCreator.loans.call(loan_request.orderbook_id);

      let loan_contract_address = loanData[8];
      let loanContract = await LoanContract.at(loan_contract_address);

      let initial_insurer_token_amount = await standardToken.balanceOf(loan_request.insurer);

      initial_lender_balance = web3.eth.getBalance(loan_request.lender);
      initial_platform_balance = web3.eth.getBalance(admin);
      initial_insurer_balance = web3.eth.getBalance(loan_request.insurer);
      initial_user2_balance = web3.eth.getBalance(accounts[4]);
      initial_user3_balance = web3.eth.getBalance(accounts[5]);
      initial_user4_balance = web3.eth.getBalance(accounts[6]);
      initial_user5_balance = web3.eth.getBalance(accounts[7])

      await loanContract.sendTransaction({
        from: loan_request.insurer,
        value: loan_request.principal,
        gas: 800000
      });

      assert.equal((await standardToken.balanceOf.call(loan_request.insurer)).toNumber(),
        initial_insurer_token_amount.toNumber() + +(loan_request.tokenAmount),
        "Correct token amount weren't transferred to INSURER");

      assert.notEqual(await loanContract.outstandingAmount.call(), 0,
        "Loan Outstanding Amount shouldn't be 0");

    });


    it('should transfer only principal to the credited Owners of SMT on Pro rata basis', async () => {

      assert.equal((web3.eth.getBalance(loan_request.lender)).toNumber(),
        initial_lender_balance.toNumber() + +(web3.toWei(2, 'ether')),
        "Correct amount wasn't transferred to lender");

      assert.equal((web3.eth.getBalance(accounts[4])).toNumber(),
        initial_user2_balance.toNumber() + +(web3.toWei(4, 'ether')),
        "Correct amount wasn't transferred to SMT holder 2");

      assert.equal((web3.eth.getBalance(accounts[5])).toNumber(),
        initial_user3_balance.toNumber() + +(web3.toWei(2, 'ether')),
        "Correct amount wasn't transferred to SMT holder 3");

      assert.equal((web3.eth.getBalance(accounts[6])).toNumber(),
        initial_user4_balance.toNumber() + +(web3.toWei(1, 'ether')),
        "Correct amount wasn't transferred to SMT holder 4");

      assert.equal((web3.eth.getBalance(accounts[7])).toNumber(),
        initial_user5_balance.toNumber() + +(web3.toWei(1, 'ether')),
        "Correct amount wasn't transferred to SMT holder 5");

    });

    it('should destroy SMT for this loan', async () => {

      let loanData = await loanCreator.loans.call(loan_request.orderbook_id);

      let smartMoney_address = await loanCreator.getSMTAddress();
      let smartMoney = await SmartMoney.at(smartMoney_address);

      assert.equal((await smartMoney.getCreditedOwners(loan_request.orderbook_id)).length, 0,
        "Correct SmartMoney Tokens weren't destroyed");

      assert.equal(loanData[2].toNumber(), 0,
        "Loan wasn't detokenized");

    });

    it('should update loan status to INSURER_PAYS', async () => {

      let loanData = await loanCreator.loans.call(loan_request.orderbook_id);

      assert.equal(loanData[1].toNumber(), 9,
        "Loan Status wasn't correctly updated to INSURER PAYS");

    });

  });

  describe("Scenario 3: Borrower Repaying Late", () => {

    let initial_platform_balance, initial_insurer_balance, initial_lender_balance;
    let initial_user2_balance, initial_user3_balance, initial_user4_balance, initial_user5_balance;


    before('Create Loan Contract and Advance Time', async () => {

      loanCreator = await LoanCreator.new(50, admin);
      standardToken = await StandardToken.new("Test Tokens", "TTT", 18, 10000000);
      loan_request.tokenAddress = standardToken.address;

      await standardToken.transfer(loan_request.borrower, 10000, {
        from: admin,
        gas: 300000
      });

      await standardToken.transfer(loanCreator.address, loan_request.tokenAmount, {
        from: loan_request.borrower,
        gas: 300000
      });

      await loanCreator.updateCollateralArrival(loan_request.borrower, loan_request.principal,
        loan_request.tokenAddress, loan_request.tokenAmount, loan_request.orderbook_id, {
          from: admin,
          gas: 300000
        });

      await loanCreator.transferFunds(loan_request.loan_id, loan_request.orderbook_id, {
        from: loan_request.lender,
        value: loan_request.principal,
        gas: 300000
      });

      await loanCreator.createLoanContract(loan_request.orderbook_id, loan_request.duration,
        loan_request.interest, loan_request.insurancePremium, loan_request.insurer, {
          from: admin,
          gas: 3000000
        });

      await helper.advanceTime(600000);

    });


    it('should let BORROWER repay the bad loan in multiple small payments', async () => {

      let loanData = await loanCreator.loans.call(loan_request.orderbook_id);

      let loan_contract_address = loanData[8];
      let loanContract = await LoanContract.at(loan_contract_address);

      initial_insurer_balance = web3.eth.getBalance(loan_request.insurer);

      let initial_outstanding_balance = await loanContract.outstandingAmount.call();

      await loanContract.sendTransaction({
        from: loan_request.borrower,
        value: web3.toWei(5, 'ether'),
        gas: 300000
      });

      assert.equal((await loanContract.outstandingAmount.call()).toNumber(),
        initial_outstanding_balance.toNumber() - +(web3.toWei(5, 'ether')),
        "Loan Outstanding Amount wasn't correctly updated");

    });

    it("shouldn't let borrower repay if outstanding Amount is zero", async () => {

      let addError;

      let loanData = await loanCreator.loans.call(loan_request.orderbook_id);

      let loan_contract_address = loanData[8];
      let loanContract = await LoanContract.at(loan_contract_address);

      await loanContract.sendTransaction({
        from: loan_request.borrower,
        value: web3.toWei(5.476, 'ether'),
        gas: 300000
      });

      try {
        await loanContract.sendTransaction({
          from: loan_request.borrower,
          value: web3.toWei(3, 'ether'),
          gas: 300000
        });
      } catch (error) {
        addError = error;
      }

      assert.notEqual(addError, undefined, 'Transaction should be reverted');

    });


    it('should transfer repaid amount to insurer', async () => {

      assert.equal((web3.eth.getBalance(loan_request.insurer)).toNumber(),
        initial_insurer_balance.toNumber() + +(web3.toWei(10.476, 'ether')),
        "Correct amount wasn't transferred to INSURER");

    });

    it('should update loan status to BORROWER_PAYS_LATE', async () => {

      let loanData = await loanCreator.loans.call(loan_request.orderbook_id);

      assert.equal(loanData[1].toNumber(), 8,
        "Loan Status wasn't correctly updated to BORROWER PAYS LATE");

    });

  });

  describe("Batch Collateral Return after Loan Request Expiration", () => {

    var loan_request_1 = {
      orderbook_id: 1,
      loan_id: 1,
      principal: web3.toWei(10, 'ether'),
      duration: 100,
      interest: 476,
      tokenAmount: 10,
      tokenAddress: 0x0,
      insurancePremium: 248,
      outstandingAmount: web3.toWei(10.476, 'ether'),
      insurer: accounts[3],
      borrower: accounts[1],
      lender: accounts[2]
    };

    var loan_request_2 = {
      orderbook_id: 2,
      loan_id: 2,
      principal: web3.toWei(5, 'ether'),
      duration: 100,
      interest: 476,
      tokenAmount: 100,
      tokenAddress: 0x0,
      insurancePremium: 248,
      outstandingAmount: web3.toWei(5.238, 'ether'),
      insurer: accounts[3],
      borrower: accounts[4],
      lender: accounts[2]
    };

    var loan_request_3 = {
      orderbook_id: 5,
      loan_id: 5,
      principal: web3.toWei(5, 'ether'),
      duration: 100,
      interest: 476,
      tokenAmount: 200,
      tokenAddress: 0x0,
      insurancePremium: 248,
      outstandingAmount: web3.toWei(5.238, 'ether'),
      insurer: accounts[3],
      borrower: accounts[5],
      lender: accounts[2]
    };

    var loan_request_4 = {
      orderbook_id: 7,
      loan_id: 7,
      principal: web3.toWei(5, 'ether'),
      duration: 100,
      interest: 476,
      tokenAmount: 200,
      tokenAddress: 0x0,
      insurancePremium: 248,
      outstandingAmount: web3.toWei(5.238, 'ether'),
      insurer: accounts[3],
      borrower: accounts[6],
      lender: accounts[2]
    };

    before('Create Loan Requests With Collateral', async () => {

      loanCreator = await LoanCreator.new(50, admin);
      standardToken = await StandardToken.new("Test Tokens", "TTT", 18, 10000000);

      loan_request_1.tokenAddress = standardToken.address;
      loan_request_2.tokenAddress = standardToken.address;
      loan_request_3.tokenAddress = standardToken.address;

      await standardToken.transfer(loanCreator.address, 10000, {
        from: admin,
        gas: 300000
      });

      await loanCreator.updateCollateralArrival(loan_request_1.borrower, loan_request_1.principal,
        loan_request_1.tokenAddress, loan_request_1.tokenAmount, loan_request_1.orderbook_id, {
          from: admin,
          gas: 300000
        });

      await loanCreator.updateCollateralArrival(loan_request_2.borrower, loan_request_2.principal,
        loan_request_2.tokenAddress, loan_request_2.tokenAmount, loan_request_2.orderbook_id, {
          from: admin,
          gas: 300000
        });

      await loanCreator.updateCollateralArrival(loan_request_3.borrower, loan_request_3.principal,
        loan_request_3.tokenAddress, loan_request_3.tokenAmount, loan_request_3.orderbook_id, {
          from: admin,
          gas: 300000
        });

      await loanCreator.updateCollateralArrival(loan_request_4.borrower, loan_request_4.principal,
        loan_request_4.tokenAddress, loan_request_4.tokenAmount, loan_request_4.orderbook_id, {
          from: admin,
          gas: 300000
        });

      await loanCreator.transferFunds(loan_request_4.loan_id, loan_request_4.orderbook_id, {
        from: loan_request_4.lender,
        value: loan_request_4.principal,
        gas: 300000
      });

    });

    it('should return collateral to all Borrowers', async () => {

      await loanCreator.multipleCollateralReturn([loan_request_1.orderbook_id, loan_request_2.orderbook_id, loan_request_3.orderbook_id], {
        from: admin,
        gas: 6000000
      });

      assert.equal((await standardToken.balanceOf.call(loan_request_1.borrower)).toNumber(),
        10,
        "Tokens weren't transferred returned to borrower");
      assert.equal((await standardToken.balanceOf.call(loan_request_2.borrower)).toNumber(),
        100,
        "Tokens weren't transferred returned to borrower");
      assert.equal((await standardToken.balanceOf.call(loan_request_3.borrower)).toNumber(),
        200,
        "Tokens weren't transferred returned to borrower");
    });

    it("shouldn't return collateral to loan request with ACCEPT status", async () => {

      await loanCreator.multipleCollateralReturn([loan_request_4.orderbook_id], {
        from: admin,
        gas: 6000000
      });

      assert.equal((await standardToken.balanceOf.call(loan_request_4.borrower)).toNumber(),
        0,
        "Collateral shouldn't be returned to borrower");

    })

  });

});
