var express = require('express');
var router = express.Router();

// Require controller modules
var Merchant = require('../api/controllers/merchant');
var auth = require('../auth/authController');

/**
 * URL for getting the credits of the merchant
 */
router.get('/mycredits', auth.ensureMerchantAuthenticated, Merchant.getCredits);

router.get('/createCredit/:id', auth.ensureMerchantAuthenticated, Merchant.getCreditForm);

router.post('/createCredit', auth.ensureMerchantAuthenticated, Merchant.createCredit);

router.get('/search', auth.ensureMerchantAuthenticated, Merchant.getSearchForm);

router.post('/search', auth.ensureMerchantAuthenticated, Merchant.searchUser);

module.exports = router;
