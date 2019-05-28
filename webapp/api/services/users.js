'use strict'

const models = require('../../models/');
const RiskRating = require('../../helpers/riskRating.js');

module.exports = {

  findUserById: async (userId) => {

    const user = await models.User.findOne({
      where: {
        userId: userId
      },
    });

    return user;
  },

  findUsersByName: async (name) => {

    const users = await models.User.findAll({
      where: {
        $or: [{
          user: {
            like: '%' + name + '%'
          }
        }]
      },
      attributes: ['userId', 'user']
    });

    return users;
  },

  updateUser: async (userId, data) => {

    const user = await models.User.findOne({
      where: {
        userId: userId,
      }
    });

    let risk = RiskRating.calculateRisk(data);

    const result = await user.update({
      ethAddress: data.ethAddress,
      borrowerRiskRating: risk,
      amazonRating: data.amazonRating,
      alibabaRating: data.alibabaRating,
      airbnbRating: data.airbnbRating,
      ebayRating: data.ebayRating,
      linkedin: data.linkedin,
      facebook: data.facebook,
      leID: data.legalIdentity,
      upwork: data.upwork
    });

    return result;
  },

  updateUserWalletAddress: async (userId, ethAddress) => {
    const user = await models.User.findOne({
      where: {
        userId: userId
      }
    });

    const result = await user.update({
      ethAddress: ethAddress
    });

    return result;
  }


}
