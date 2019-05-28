const helper = require("./helpers/truffleTestHelpers");
const math = require("mathjs");
var SmartMoney = artifacts.require("./SmartMoney.sol");

contract("Smart Money", function(accounts) {
  var admin = accounts[0];

  describe("Scenario 1: SMT Transfer", () => {

    let smartMoney, escrow;

    before('Deploy SMT and Transfer SMT', async () => {

      smartMoney = await SmartMoney.new();

      await smartMoney.tokenize(accounts[1], 1, 1000, {
        from: admin,
        gas: 300000
      });

      await smartMoney.tokenize(accounts[1], 2, 2000, {
        from: admin,
        gas: 300000
      });

      await smartMoney.transfer(accounts[2], 1300, {
        from: accounts[1],
        gas: 300000
      });

    });

    it('should transfer SMT tokens to user', async () => {

      assert.equal(await smartMoney.balanceOf(accounts[2]),
        1300,
        "Correct amount wasn't transferred");
    });

  });

  describe("Scenario 2: SMT Transfer to 5 owners", () => {

    let smartMoney, escrow;

    before('Deploy SMT and Transfer SMT', async () => {

      smartMoney = await SmartMoney.new();

      await smartMoney.tokenize(accounts[1], 1, 1000, {
        from: admin,
        gas: 300000
      });

      await smartMoney.transfer(accounts[2], 200, {
        from: accounts[1],
        gas: 300000
      });

      await smartMoney.transfer(accounts[3], 200, {
        from: accounts[1],
        gas: 300000
      });

      await smartMoney.transfer(accounts[4], 200, {
        from: accounts[1],
        gas: 300000
      });

      await smartMoney.transfer(accounts[5], 100, {
        from: accounts[2],
        gas: 300000
      });

    });

    it('should transfer SMT tokens to 5 users', async () => {

      assert.equal(await smartMoney.balanceOf(accounts[1]),
        400,
        "Correct amount wasn't transferred to user 1");
      assert.equal(await smartMoney.balanceOf(accounts[2]),
        100,
        "Correct amount wasn't transferred to user 2");
      assert.equal(await smartMoney.balanceOf(accounts[3]),
        200,
        "Correct amount wasn't transferred to user 3");
      assert.equal(await smartMoney.balanceOf(accounts[4]),
        200,
        "Correct amount wasn't transferred to user 4");
      assert.equal(await smartMoney.balanceOf(accounts[5]),
        100,
        "Correct amount wasn't transferred to user 5");

    });

  });

  describe("Scenario 3: SMT Transfer to more than 5 owners", () => {

    let smartMoney, escrow;

    before('Deploy SMT and Transfer SMT', async () => {

      smartMoney = await SmartMoney.new();

      await smartMoney.tokenize(accounts[1], 1, 1000, {
        from: admin,
        gas: 300000
      });

      await smartMoney.transfer(accounts[2], 200, {
        from: accounts[1],
        gas: 300000
      });

      await smartMoney.transfer(accounts[3], 200, {
        from: accounts[1],
        gas: 300000
      });

      await smartMoney.transfer(accounts[4], 200, {
        from: accounts[1],
        gas: 300000
      });

      await smartMoney.transfer(accounts[5], 100, {
        from: accounts[2],
        gas: 300000
      });

    });

    it('should through Error on Transfer of SMT to more than 5 User', async () => {

      let addError;
      try {
        await smartMoney.transfer(accounts[6], 100, {
          from: accounts[1],
          gas: 300000
        });
      } catch (error) {
        addError = error;
      }

      assert.notEqual(addError, undefined, 'Error must be thrown');
    });

    it('should through Error on Transfer of SMT, if Entire Account SMT Balance is not tranferred', async () => {

      let addError;
      try {
        await smartMoney.transfer(accounts[6], 100, {
          from: accounts[4],
          gas: 300000
        });
      } catch (error) {
        addError = error;
      }

      assert.notEqual(addError, undefined, 'Error must be thrown');

    });

    it('should Transfer SMT, if Entire Account SMT Balance is tranferred', async () => {

      let addError;

      try {
        await smartMoney.transfer(accounts[6], 200, {
          from: accounts[4],
          gas: 300000
        });
      } catch (error) {
        addError = error;
      }

      assert.equal(addError, undefined, "Error shouldn't be thrown");

      assert.equal(await smartMoney.balanceOf(accounts[4]),
        0,
        "Correct amount wasn't send by user 5");
      assert.equal(await smartMoney.balanceOf(accounts[6]),
        200,
        "Correct amount wasn't transferred to user 6");

    });

  });

  describe("Scenario 4: SMT Transfer to 5 owners and deTokenize", () => {

    let smartMoney, escrow;

    before('Transfer SMT and Detoknize', async () => {

      smartMoney = await SmartMoney.new();

      await smartMoney.tokenize(accounts[1], 1, 1000, {
        from: admin,
        gas: 300000
      });

      await smartMoney.transfer(accounts[2], 200, {
        from: accounts[1],
        gas: 300000
      });

      await smartMoney.transfer(accounts[3], 200, {
        from: accounts[1],
        gas: 300000
      });

      await smartMoney.transfer(accounts[4], 200, {
        from: accounts[1],
        gas: 300000
      });

      await smartMoney.transfer(accounts[5], 100, {
        from: accounts[2],
        gas: 300000
      });

      await smartMoney.deTokenize(1, {
        from: admin,
        gas: 300000
      });

    });

    it('should detokize SMT for the loan', async () => {

      assert.equal((await smartMoney.getCreditedOwners(1)).length,
        0,
        "SMT weren't deTokenized for loan");
    });

  });


});
