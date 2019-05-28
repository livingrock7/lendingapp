var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var flash = require('connect-flash');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport');
const IPFS = require('ipfs-mini');
const fileUpload = require('express-fileupload');
const HDWalletProvider = require("truffle-hdwallet-provider");
const env = process.env.NODE_ENV || 'development';
const config = require(`${__dirname}/./config/config.json`)[env];
//web3 for ethereum
var Web3 = require('web3');


/*mnemonic for the ethereum account using which transaction will be done from backend
 * Note: Use the same account which is used for deploying the Loan creator contract
 */
var mnemonic = config.mnemonic;
// Doesnt need to check for undefined here as the server side is not loaded in browser and porvider is always the node

// web3 version 1.0.0 has changed the syntax for setting the current provider
const provider = new HDWalletProvider(mnemonic, config.node_ws_url);

var web3js = new Web3(provider);
// web3 version 1.0.0 websocket connection
var web3ws = new Web3(config.node_ws_url);

web3ws.currentProvider.on('connect', (result) => {
  console.log('WebSocket Connection Established Successfully', result);
});
web3ws.currentProvider.on('error', (result) => {
  console.log('WebSocket Disconnected', result);
  web3ws = new Web3(config.node_ws_url);
  provider = new HDWalletProvider(mnemonic, config.node_ws_url);
  web3js = new Web3(provider);
});
web3ws.currentProvider.on('end', (result) => {
  console.log('WebSocket Connection Terminated', result);
});


web3js.eth.getAccounts().then(function(accounts) {
  console.log(accounts[0]);
});

web3ws.eth.net.isListening(function(error, result) {
    if(error) {
        console.error(error);
    } else {
        console.log("Websocket Provider connection is listening. Status: " + result);
    }
});

setInterval(function() {
  web3ws.eth.getBalance("0x5b9b4346e28ac8e4b834a86e558a8e91d95e913c")
    .then(console.log)
}, 10000);

exports.web3js = web3js;
exports.web3ws = web3ws;


// const ipfs = new IPFS({
//   host: 'ipfs.infura.io',
//   port: 5001,
//   protocol: 'https'
// });
// exports.ipfs = ipfs;


var index = require('./routes/index');
var users = require('./routes/users');

/*Router for lender dashboard*/
var lender = require('./routes/lender.js');
/*Router for borrower dashboard*/
var borrower = require('./routes/borrower.js');
/*Router for merchant dashboard*/
var merchant = require('./routes/merchant.js');
/*Router for insurer dashboard*/
var insurer = require('./routes/insurer.js');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload());
app.use(flash());

// Change values here changing the session id properties
app.use(session({
  secret: 'my-secret',
  resave: false,
  rolling: true,
  saveUninitialized: true,
  cookie: {
    maxAge: 10 * 60 * 1000 // 10 mins expiration for session
  }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(function(req, res, next) {
  res.locals.success_message = req.flash('success_message');
  res.locals.error_message = req.flash('error_message');
  res.locals.user = req.user || null;
  next();
});

app.use('/', index);
app.use('/users', users);

app.use('/lender', lender);
app.use('/borrower', borrower);
app.use('/merchant', merchant);
app.use('/insurer', insurer);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
