var Client = require('node-rest-client').Client;
const env = process.env.NODE_ENV || 'development';
const config = require(`${__dirname}/../config/config.json`)[env];

var client = new Client();


/*
 * Functions to get the IPFS path for the contract pdf generated through Claim application
 */
module.exports = {

  generateContractPdfUrl: (loanid, params, callback) => {
  var args = {
    data: {
      loanid: loanid,
      type: "contract",
      timestamp: Date.now(),
      params: params
    },
    headers: {
      "Content-Type": "application/json"
    }
  };

  client.post(config.eclaim_url + 'contract/get_contract', args, function(data, response) {
    if (data.status != 200)
      return callback(data.message, null);
    else {
      return callback(null, data.url);
    }
  });
},


  generateEvidencePdfUrl: (claimid, params) => {
  var args = {
    data: {
      loanid: claimid,
      type: "evidence",
      timestamp: Date.now(),
      params: params
    },
    headers: {
      "Content-Type": "application/json"
    }
  };

   return new Promise((resolve, reject) => {
     client.post( config.eclaim_url + 'contract/get_contract', args, function(data, response){
       console.log(data);
       resolve(data);
     });
   });
  }
}
