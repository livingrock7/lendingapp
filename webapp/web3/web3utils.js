'use strict'

const env = process.env.NODE_ENV || 'development';
const config = require(`${__dirname}/../config/config.json`)[env];
var Web3 = require('web3');

var web3 = new Web3(config.node_ws_url);

module.exports = {

  getTransactionData: (_transactionHash) => {
    return new Promise((resolve, reject) => {
      web3.eth.getTransaction(_transactionHash)
        .then(function(data){
          console.log(data);
          resolve(data);
        }).catch(console.error);
    });
  },

  getAccountNonce: (_account) => {
    return new Promise((resolve, reject) => {
      web3.eth.getTransactionCount(_account)
        .then(function(data){
          resolve(data);
        }).catch(console.error);
    });
  },

  removeLeadingZeroes: (_ethAddress) => {
    return web3.utils.toHex(web3.utils.toBN(_ethAddress));
  }
}
