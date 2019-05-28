// middleware to see if we're authenticated or not
exports.ensureBorrowerAuthenticated = function(req, res, next) {
  if (req.isAuthenticated() && req.session.role == 'borrower') {
    return next();
  }
  res.redirect('/')
};

exports.ensureLenderAuthenticated = function(req, res, next) {
  if (req.isAuthenticated() && req.session.role == 'lender') {
    return next();
  }
  res.redirect('/')
};

exports.ensureMerchantAuthenticated = function(req, res, next) {
  if (req.isAuthenticated() && req.session.role == 'merchant') {
    return next();
  }
  res.redirect('/')
};

exports.ensureInsurerAuthenticated = function(req, res, next) {
  if (req.isAuthenticated() && req.session.role == 'insurer') {
    return next();
  }
  res.redirect('/');
};
