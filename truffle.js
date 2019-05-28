var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "mnemonic here";
module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*", // Match any network id
      gas: 8000000
    },
    // ropsten: {
    //   provider: new HDWalletProvider(mnemonic, "ropsten node url"),
    //   network_id: 3,
    //   gas: 4612388
    // },
    rinkeby: {
      provider: new HDWalletProvider(mnemonic, "http://35.159.51.209:8545"),
      network_id: 4,
      gas: 8000000
    },
    kovan: {
      provider: new HDWalletProvider(mnemonic, "infura link"),
      network_id: 4,
      gas: 8000000
    }
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
};
