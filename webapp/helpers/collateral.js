'use strict'

var Client = require('node-rest-client').Client;
var client = new Client();

// const ENSCollateralABI = require('../ContractsABI/ensCollateralABI.json');

module.exports = {

  getERC20TokenValue: (tokenName) => {
    return new Promise((resolve, reject) => {
      if (tokenName) {
        client.get("https://min-api.cryptocompare.com/data/price?fsym=" + tokenName + "&tsyms=BTC,USD,EUR,ETH",
          function(data, response) {
            resolve(data.ETH);
          });
      } else {
        resolve(0);
      }
    });
  },

  getENSDomainValue: (ensDomain) => {
    // if (ensDomain != "") {
    //   var ensDomainHash = web3.utils.sha3(ensDomain);
    //   var ensCollateralManagerInstance = new web3.eth.Contract(ENSCollateralABI,
    //     ens_collateral_manager, {
    //       gasPrice: '200000000000'
    //     });
    //   ensCollateralManagerInstance.methods.getENSCollateralInfo(ensDomainHash).call(function(err, result) {
    //     if (!err)
    //       return callback(web3.utils.fromWei(result[1], 'ether'));
    //     else {
    //       return callback(0);
    //     }
    //   });
    // } else {
    //   return callback(0);
    // }
    return new Promise((resolve, reject) => {
      resolve(0);
    });
  }

}
