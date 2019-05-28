'use strict'

const env = process.env.NODE_ENV || 'development';
const config = require(`${__dirname}/../../config/config.json`)[env];

const Insurer = require('../services/insurer');

module.exports = {

  getBadLoans: async (req, res, next) => {

    const loans = await Insurer.findLoansByStatus('bad loan');

    res.render('insurer/badLoans', {
      badLoans_list: loans
    });
  },

  getEvidenceData: async (req, res, next) => {

    const evidence = await Insurer.fetchEvidenceData(req.params.id);

    res.render('insurer/evidence', {
      evidence_list: evidence,
      id: req.params.id
    });
  },

  generateEvidencePDF: async (req, res, next) => {

    const url = await Insurer.generateEvidencePDF(req.params.id);
    console.log(url);
    res.redirect(url);
  },

  repayBadLoan: async (req, res, next) => {

    const loan = await Insurer.findLoanById(req.params.id);

    res.render('insurer/repayBadLoan', {
      data: loan,
      insurer: config.insurer_eth_address
    })
  },

  getCollateralDetails: async (req, res, next) => {

    const data = await Insurer.fetchCollateralDetails(req.params.id);

    res.render('insurer/collateral', data);

  }
}
