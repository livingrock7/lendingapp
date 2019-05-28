var express = require('express');
var router = express.Router();

// Require controller modules
var Insurer = require('../api/controllers/insurer');
var auth = require('../auth/authController');


router.get('/badloans', auth.ensureInsurerAuthenticated, Insurer.getBadLoans);

router.get('/evidence/:id', auth.ensureInsurerAuthenticated, Insurer.getEvidenceData);

router.get('/generateEvidence/:id', auth.ensureInsurerAuthenticated, Insurer.generateEvidencePDF)

router.get('/repay/:id', auth.ensureInsurerAuthenticated, Insurer.repayBadLoan);

router.get('/collateral/:id', auth.ensureInsurerAuthenticated, Insurer.getCollateralDetails);

module.exports = router;
