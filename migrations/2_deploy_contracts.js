var LoanCreator = artifacts.require("./LoanCreator.sol");
var StandardToken = artifacts.require('./StandardToken.sol');

const config = require('../webapp/config/config')['development'];

module.exports = async function(deployer, network, accounts) {
  // deployer.deploy(ENSCollateralManager);
  var loanCreator;
  deployer.deploy(LoanCreator, 50, config.platformETH_address).then(async function() {
    loanCreator = await LoanCreator.deployed();
    await loanCreator.getSMTAddress.call().then(function(result) {
      console.log("SmartMoney Address:", result);
    });
  });
  deployer.deploy(StandardToken, "Test Tokens", "TTT", 18, 10000000000).then(async function() {
    const standardToken = await StandardToken.deployed();
    // await standardToken.transfer(accounts[1], 10000, {
    //   from: accounts[0],
    //   gas: 3000000
    // });
  });
}
