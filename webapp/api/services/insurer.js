'use strict'

const env = process.env.NODE_ENV || 'development';
const config = require(`${__dirname}/../../config/config.json`)[env];

const models = require('../../models/');
const Sequelize = require('sequelize');
const LoanCreator = require('../../web3/loanCreator');
const EvidenceType = require('../../helpers/evidenceType');
const Eclaim = require('../../helpers/eclaim');

module.exports = {

  findLoansByStatus: async (status) => {

    let query = 'SELECT ' + config.database_SC + '.loans.principal, \
                        ' + config.database_SC + '.loans.duration, \
                        ' + config.database_SC + '.loans.id, \
                        ' + config.database_SC + '.loans.interest, \
                        ' + config.database_SC + '.loans.intialCollateralValue, \
                        ' + config.database_SC + '.loans.expirationDate, \
                        ' + config.database_SC + '.loans.OrderBookId, \
                        ' + config.database_SC + '.loans.isRepaidByInsurer, \
                        ' + config.database_SC + '.orderbooks.use, \
                        ' + config.database_SC + '.users.user, \
                        ' + config.database_SC + '.orderbooks.userRiskRating FROM \
                        ' + config.database_SC + '.loans LEFT OUTER JOIN \
                        ' + config.database_SC + '.users ON \
                        ' + config.database_SC + '.users.userId = \
                        ' + config.database_SC + '.loans.borrowerId LEFT OUTER JOIN \
                        ' + config.database_SC + '.orderbooks ON \
                        ' + config.database_SC + '.orderbooks.id = \
                        ' + config.database_SC + '.loans.OrderBookId WHERE \
                        ' + config.database_SC + '.loans.status IN ("bad loan", "bad loan repaid", "bad loan repaid by borrower");';

    const loans = await models.sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT
    });

    return loans;
  },

  fetchEvidenceData: async (orderbookId) => {

    var Data = [];

    var dataCount = await LoanCreator.getEvidenceDataCount(orderbookId);

    for (let i = 0; i < dataCount; i++) {

      var data = await LoanCreator.getEvidenceData(orderbookId, i);

      Data.push({
        type: EvidenceType.getEvidenceType(data[0]),
        timestamp: data[1],
        user1: data[2],
        userDataType1: data[3],
        user2: data[4],
        userDataType2: data[5]
      });

    }

    return Data;
  },

  generateEvidencePDF: async (orderbookId) => {

    const loan = await models.Loan.findOne({
      where: {
        OrderBookId: orderbookId
      }
    });

    var Data = [];

    var dataCount = await LoanCreator.getEvidenceDataCount(orderbookId);

    for (let i = 0; i < dataCount; i++) {

      var data = await LoanCreator.getEvidenceData(orderbookId, i);

      Data.push({
        type: parseInt(data[0]),
        timestamp: data[1],
        user1: data[2],
        userDataType1: data[3],
        user2: data[4],
        userDataType2: data[5]
      });

    }

    let params = {
      contractFile: loan.contractFilePath,
      data: Data
    }

    const result = await Eclaim.generateEvidencePdfUrl(loan.OrderBookId, params);

    return result.url;

  },

  findLoanById: async (id) => {

    const loan = await models.Loan.findById(id);

    return loan;
  },

  fetchCollateralDetails: async (id) => {

    const loan = await models.Loan.findById(id);

    const token = await models.Token.findOne({
      where: {
        orderBookId: loan.OrderBookId
      }
    });

    const ens = await models.Domain.findOne({
      where: {
        orderBookId: loan.OrderBookId
      }
    });

    const user = await models.User.findOne({
      where: {
        userId: loan.borrowerId
      },
      attributes: ['ethAddress']
    });

    return {
      ens: ens,
      token: token,
      borrower: user.ethAddress
    }

  },
}
