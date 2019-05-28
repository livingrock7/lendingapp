var express = require('express');

var router = express.Router();

const User = require('../api/controllers/users');
var auth = require('../auth/authController');

/*Lender Preferences*/
router.get('/lender/settings', auth.ensureLenderAuthenticated, User.getLenderPreferences);

router.post('/lender/settings', auth.ensureLenderAuthenticated, User.setLenderPreferences);

/*Borrower Preferences*/
router.get('/borrower/settings', auth.ensureBorrowerAuthenticated, User.getBorrowerPreferences);

router.post('/borrower/settings', auth.ensureBorrowerAuthenticated, User.setBorrowerPreferences);

/*Merchant Preferences*/
router.get('/merchant/settings', auth.ensureMerchantAuthenticated, User.getMerchantPreferences);

router.post('/merchant/settings', auth.ensureMerchantAuthenticated, User.setMerchantPreferences);

/*Insurer Preferences*/
router.get('/insurer/settings', auth.ensureInsurerAuthenticated, User.getInsurerPreferences);

router.post('/insurer/settings', auth.ensureInsurerAuthenticated, User.setInsurerPreferences);



module.exports = router;
