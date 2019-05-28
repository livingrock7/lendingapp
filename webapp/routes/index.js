var express = require('express');
var router = express.Router();
var authController = require('../auth/authController');
var passport = require('../auth/passport');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('login');
});

router.post('/signin',
  passport.authenticate('local', {
    failureRedirect: '/',
    failureFlash: true
  }),
  function(req, res) {
    req.flash('success_message', 'You are logged in!!!');
    if (req.body.role == "borrower") {
      req.session.role = "borrower";
      res.redirect('/borrower/myloans');
    } else if (req.body.role == "lender") {
      req.session.role = "lender";
      res.redirect('/lender/mycredits');
    } else if (req.body.role == "merchant") {
      req.session.role = "merchant";
      res.redirect('/merchant/mycredits');
    } else {
      req.session.role = "insurer";
      res.redirect('/insurer/badloans');
    }
  });

router.get('/logout', function(req, res) {
  req.logout();
  req.session.destroy(function(err) {
    console.log(err);
  });
  res.redirect('/');
});

module.exports = router;
