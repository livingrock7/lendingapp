const loanCreator_address = '0xf01c82eb1979ff28662a938907f070db752a3e40';
const token_address = '0x726131121b9c84cb2dcbabe39a9500303b9125a4'; // Address of Demo Token Contract
const ens_collateral_manager = '0xe313f71935867157273d9d1284c752eddc4b0321';

var loanCreatorInstance;
var user;
var tokenContractInstance;
var absolute_url;

window.onload = function() {
  if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider);
  } else {
    web3 = new Web3(new Web3.providers.HttpProvider("http://185.202.82.117:8545"));
  }

  if (!web3.isConnected()) {
    console.error("Ethereum - no conection to RPC server");
  } else {
    console.log("Ethereum - connected to RPC server");
  }

  absolute_url = window.location.origin;

  web3.eth.defaultAccount = web3.eth.accounts[0];

  user = web3.eth.accounts[0];

  $("#lender").attr("href", "/lender/mycredits");
  $("#borrower").attr("href", "/borrower/myloans");
  $("#merchant").attr("href", "/merchant/mycredits");

  const LoanCreatorContract = web3.eth.contract(LoanCreatorABI);
  loanCreatorInstance = LoanCreatorContract.at(loanCreator_address);

  const TokenContract = web3.eth.contract(TokenABI);
  tokenContractInstance = TokenContract.at(token_address);

  /*Event to listen to token transfer in browser and show message to user on success*/
  var tokenEvent = tokenContractInstance.Transfer({
    from: user
  });
  tokenEvent.watch(function(err, result) {
    if (!err) {
      console.log(result);
      document.getElementById("tokenstatus").innerHTML = 'Arrived';
      Snackbar.show({
        pos: 'top-center',
        text: "Transaction Was Successful"
      });
      tokenEvent.stopWatching();
    } else {
      document.getElementById("tokenstatus").innerHTML = 'Error';
      Snackbar.show({
        pos: 'top-center',
        text: "Transaction Was Unsuccessful"
      });
      tokenEvent.stopWatching();
    }
  });

  $("#transferToken").click(function() {
    var escrow = document.getElementById("escrow").innerHTML;
    var tokenAmount = document.getElementById("tokenAmount").innerHTML;
    var url = window.location.pathname;
    var orderBookId = url.substring(url.lastIndexOf('/') + 1);
    transferToken(tokenAmount, user, escrow, orderBookId);
  });

  $(".transferFunds").click(function() {
    var escrow = document.getElementById("escrow").innerHTML;
    var principal = document.getElementById("principal").innerHTML;
    var orderBookId = document.getElementById("orderbookId").innerHTML;
    var url = window.location.pathname;
    var loanId = url.substring(url.lastIndexOf('/') + 1);
    transferFunds(principal, user, escrow, loanId, orderBookId);
  });

  $(".repay").click(function() {
    var loanContract = document.getElementById("loanContract").innerHTML;
    var principal = document.getElementById("amount").innerHTML;
    repayLoan(principal, user, loanContract);
  });

  $(".returnToken").click(function() {
    var borrower = document.getElementById("borrower").innerHTML;
    var tokenAmount = document.getElementById("tokenAmount").innerHTML;
    returnTokens(tokenAmount, user, borrower);
  });
}

/* Function for transferring tokens from borrower to escrow
	Also, it sends a request to backend for listening to token transfer from user to the escrow
	account, to update the token arrival in DB*/
function transferToken(amount, user, escrow, id) {
  tokenContractInstance.transfer(escrow, amount, {
      from: user,
      data: web3.toHex(id)
    },
    function(err, res) {
      if (!err) {
        document.getElementById("tokenstatus").innerHTML = 'Processing';
        var xhr = new XMLHttpRequest();
        xhr.open("POST", absolute_url + '/borrower/tokenTransferEvent', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({
          from: user,
          to: escrow,
          txnId: res,
          orderbookId: id
        }));
      } else {
        Snackbar.show({
          pos: 'top-center',
          text: "Transaction Was Cancelled"
        });
      }
    });
}

function returnTokens(amount, user, borrower) {
  tokenContractInstance.transfer(borrower, amount, {
      from: user
    },
    function(err, res) {
      if (!err) {
        document.getElementById("tokenstatus").innerHTML = 'Processing';
        // var xhr = new XMLHttpRequest();
        // xhr.open("POST", absolute_url + '/borrower/tokenTransferEvent', true);
        // xhr.setRequestHeader('Content-Type', 'application/json');
        // xhr.send(JSON.stringify({
        //   from: user,
        //   to: escrow,
        //   txnId: res,
        //   orderbookId: id
        // }));
      } else {
        Snackbar.show({
          pos: 'top-center',
          text: "Transaction Was Cancelled"
        });
      }
    });
}



/* Function for transferring funds from lender to escrow
	Also, it sends a request to backend for listening to fund transfer from lender to the escrow
	account*/
function transferFunds(amount, user, escrow, loanId, orderBookId) {

  var amt = web3.toWei(amount);
  // console.log(orderBookId, amt);
  loanCreatorInstance.transferFunds(loanId, orderBookId, {
    from: user,
    value: amt
  }, function(err, res) {
    console.log(res);
    if (!err) {
      // var xhr = new XMLHttpRequest();
      // xhr.open("POST", absolute_url + '/lender/fundTransferEvent', true);
      // xhr.setRequestHeader('Content-Type', 'application/json');
      // xhr.send(JSON.stringify({
      //   from: user,
      //   to: escrow,
      //   txnId: res,
      //   orderBookId: orderBookId,
      //   loanId: loanId
      // }));
    } else {
      Snackbar.show({
        pos: 'top-center',
        text: "Transaction Was Cancelled"
      });
    }
  });
}

/* Function for repaying the loan. Loan amount will be transferred to loan contract, which will transfer
  the amount to lender, and loan contract will release the collateral back to borrower.
  Also, a event will be listening the transaction for updating the DB table on successfull repay of loan*/
function repayLoan(amount, user, loanContractAddress) {
  const amt = web3.toWei(amount);
  web3.eth.sendTransaction({
    to: loanContractAddress,
    from: user,
    value: amt
  }, function(err, res) {
    console.log(res);
    if (!err) {
      // var xhr = new XMLHttpRequest();
      // xhr.open("POST", absolute_url + '/borrower/loanRepayEvent', true);
      // xhr.setRequestHeader('Content-Type', 'application/json');
      // xhr.send(JSON.stringify({
      //   from: user,
      //   to: loanContractAddress,
      //   txnId: res,
      //   loanId: loanId
      // }));
    } else {
      Snackbar.show({
        pos: 'top-center',
        text: "Transaction Was Cancelled"
      });
    }
  });
}
