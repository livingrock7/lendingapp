'use strict'

const User = require('../services/users');

module.exports = {

  getBorrowerPreferences: async (req, res, next) => {

    const user = await User.findUserById(req.user.userId);

    res.render('borrower/borrowerPreferences', {
      data: user
    });
  },

  getLenderPreferences: async (req, res, next) => {

    const user = await User.findUserById(req.user.userId);

    res.render('lender/lenderPreferences', {
      data: user
    });
  },

  getMerchantPreferences: async (req, res, next) => {

    const user = await User.findUserById(req.user.userId);

    res.render('merchant/merchantPreferences', {
      data: user
    });
  },

  getInsurerPreferences: async (req, res, next) => {

    const user = await User.findUserById(req.user.userId);

    res.render('insurer/insurerPreferences', {
      data: user
    });
  },

  setBorrowerPreferences: async (req, res, next) => {

    const user = await User.updateUser(req.user.userId, req.body);

    res.render('borrower/borrowerPreferences', {
      status: 'success',
      data: user
    });
  },

  setLenderPreferences: async (req, res, next) => {

    const user = await User.updateUserWalletAddress(req.user.userId, req.body.ethAddress);

    res.render('lender/lenderPreferences', {
      status: 'success',
      data: user
    });
  },

  setMerchantPreferences: async (req, res, next) => {

    const user = await User.updateUserWalletAddress(req.user.userId, req.body.ethAddress);

    res.render('merchant/merchantPreferences', {
      status: 'success',
      data: user
    });
  },

  setInsurerPreferences: async (req, res, next) => {

    const user = await User.updateUserWalletAddress(req.user.userId, req.body.ethAddress);

    res.render('insurer/insurerPreferences', {
      status: 'success',
      data: user
    });
  }

}
