var Web3 = require('web3');

const env = process.env.NODE_ENV || 'development';
const config = require(`${__dirname}/../config/config.json`)[env];
const LoanContract = require('../../build/contracts/LoanContract.json');

// web3 version 1.0.0 websocket connection
var web3 = new Web3(config.node_ws_url);

module.exports = {

  /*
   * @type: Ethereum Call
   * @desc: Returns Loan Expiration Date from the Loan Contract
   * @params: loan Contract Address
   * @returns: Expiration Date
   */
  getExpirationDate: async (loanContractAddress) => {

    const LoanContractInstance = new web3.eth.Contract(LoanContract.abi,
      loanContractAddress, {
        gasPrice: config.gasPrice
      });


    let expirationDate = await LoanContractInstance.methods.expiresOn().call();

    return (new Date(expirationDate * 1000)).toLocaleString();

  },

  /*
   * @type: Ethereum Call
   * @desc: Returns Loan Last Updated On from the Loan Contract
   * @params: loan Contract Address
   * @returns: Updated On Date
   */
  getUpdatedOnDate: async (loanContractAddress) => {

    const LoanContractInstance = new web3.eth.Contract(LoanContract.abi,
      loanContractAddress, {
        gasPrice: config.gasPrice
      });


    let updatedOnDate = await LoanContractInstance.methods.updatedOn().call();

    return (new Date(updatedOnDate * 1000)).toLocaleString();

  },

  /*
   * @type: Ethereum Call
   * @desc: Returns Loan Outstanding Amount from the Loan Contract
   * @params: loan Contract Address
   * @returns: Outstanding Amount
   */
  getOutstandingAmount: async (loanContractAddress) => {

    const LoanContractInstance = new web3.eth.Contract(LoanContract.abi,
      loanContractAddress, {
        gasPrice: config.gasPrice
      });


    let outstandingAmount = await LoanContractInstance.methods.outstandingAmount().call();

    return web3.utils.fromWei(outstandingAmount, 'ether');
  }

}
