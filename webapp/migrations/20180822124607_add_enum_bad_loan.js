'use strict';
const env = process.env.NODE_ENV || 'development';
const config = require(`${__dirname}/../config/config.json`)[env];

module.exports = {
  up: function(queryInterface, Sequelize, done) {
    return queryInterface.sequelize.query("ALTER TABLE \
      " + config.database_SC + ".loans MODIFY COLUMN \
      " + config.database_SC + ".loans.status \
      enum('collateral due', 'active', 'terminated', 'funds due', 'active loan', 'repayment due', 'repaid', 'bad loan') \
      DEFAULT 'funds due';").spread((results, metadata) => {
      // Results will be an empty array and metadata will contain the number of affected rows.
      console.log(results);
    }).nodeify(done);
  },
}
