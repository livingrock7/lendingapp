var express = require('express');
var router = express.Router();

// Require controller modules

var auth = require('../auth/authController');
const Borrower = require('../api/controllers/borrower');
/**
* URL for getting the loans of the borrower
*/
router.get('/myloans', auth.ensureBorrowerAuthenticated, Borrower.getUserLoans);

/**
* URL for getting the loans requests created by user (only non funded loan requests will be displayed)
*/
router.get('/myLoanrequests', auth.ensureBorrowerAuthenticated, Borrower.getUserLoanRequests);

/*
* URL for displaying the loan request form
*/
router.get('/loanrequestform', auth.ensureBorrowerAuthenticated, Borrower.getLoanRequestForm);

/*
* API for calculating the collateral value (ERC20 token + ENS domain)
*/
router.post('/loandetails', auth.ensureBorrowerAuthenticated, Borrower.getLoanDetails);

/*
* URL for terminating the loan request
*/
router.get('/terminate/:id', auth.ensureBorrowerAuthenticated, Borrower.terminateLoanRequest);

/*
* URL for intiating a listener on token transfer in backend
*/
router.post('/tokenTransferEvent', auth.ensureBorrowerAuthenticated, Borrower.tokenTransferEvent);

/*
* URL for creating a loan request in DB
*/
router.post('/createLoanRequest', auth.ensureBorrowerAuthenticated, Borrower.createLoanRequest);

/*URL for displaying the collateral transfer page*/
router.get('/transferCollateral/:id', auth.ensureBorrowerAuthenticated, Borrower.getCollateralDetails);

/*URL for displaying loan repayment screen*/
router.get('/repay/:id', auth.ensureBorrowerAuthenticated, Borrower.repayLoan);

module.exports = router;
