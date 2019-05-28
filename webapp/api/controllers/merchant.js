'use strict'

const Merchant = require('../services/merchant')
const User = require('../services/users');

module.exports = {

  getCredits: async (req, res, next) => {

    const credits = await Merchant.findCreditsByUser(req.user.userId);

    res.render('merchant/merchantcredits', {
      mycredits_list: credits
    });
  },

  getSearchForm: async (req, res, next) => {

    res.render('merchant/searchUser');
  },

  searchUser: async (req, res, next) => {

    const users = await User.findUsersByName(req.body.username);

    res.render('merchant/searchUser', {
      users: users
    });
  },

  getCreditForm: async (req, res, next) => {

    const user = await User.findUserById(req.params.id);

    res.render('merchant/creditForm', {
      user: user
    });
  },

  createCredit: async (req, res, next) => {

    res.redirect('/merchant/mycredits');
  }
}
