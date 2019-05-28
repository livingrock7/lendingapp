'use strict'

const env = process.env.NODE_ENV || 'development';
const config = require(`${__dirname}/../../config/config.json`)[env];

const models = require('../../models/');
const math = require('mathjs');

let getInterestDetails = async (_creditScore) => {

  const interestDetails = await models.Interest.findOne({
    where: {
      creditScore: _creditScore
    }
  });

  return interestDetails;

}

let getUserRiskRating = async (_orderbookId) => {

  const loan = await models.OrderBook.findById(_orderbookId);

  return loan.userRiskRating;
}

module.exports = {

  getAnnualInterestRate: async (_creditScore) => {

    const details = await models.Interest.findOne({
      where: {
        creditScore: _creditScore
      }
    });

    let interestRate = math.format(math.eval(details.riskFreeRate +
        details.marginRate + details.insurancePremiumRate + details.platformFee),
      config.precision + 1);

    return interestRate;

  },

  getNetInterestRate: async (_creditRating, _requestedRate, duration) => {

    const details = await getInterestDetails(_creditRating);

    let interestRate = math.format(math.eval((_requestedRate - details.insurancePremiumRate - details.platformFee) / 365 * duration + details.insurancePremiumRate + details.platformFee), config.precision + 1);

    return interestRate;

  },

  getInsurancePremium: async (_orderbookId) => {

    const riskRating = await getUserRiskRating(_orderbookId);

    const details = await getInterestDetails(riskRating);

    // Todo: Insert logic here to verify the _requestedRate is greater than or equal to the base rate
    let insurancePremium = math.format(math.eval(details.insurancePremiumRate * 10 ** config.precision), config.precision + 1);

    return insurancePremium;
  }


}
