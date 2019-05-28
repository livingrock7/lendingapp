var express = require('express');
var router = express.Router();

// Require controller modules

var auth = require('../auth/authController');
const lender = require('../api/controllers/lender');

/**
 * URL for getting the credits of the current user
 */
router.get('/mycredits', auth.ensureLenderAuthenticated, lender.getUserCredits);

/**
 * URL for getting the loans requests created by any user (only non funded loan requests will be displayed)
 */
router.get('/loanrequests', auth.ensureLenderAuthenticated, lender.getAllLoanRequests);

/*URL for approving the loan request and updating the DB Loan Table*/
router.get('/approveLoan/:id', auth.ensureLenderAuthenticated, lender.approveLoanRequest);

router.get('/transferFunds/:id', auth.ensureLenderAuthenticated, lender.getLoanDetails);

module.exports = router;
