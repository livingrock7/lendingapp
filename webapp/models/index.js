const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
require('dotenv').config();
const basename = path.basename(module.filename);
const env = process.env.NODE_ENV;
const config = require(`${__dirname}/../config/config.json`)[env];
const db = {};

let smartCredit;
if (config.use_env_variable) {
  smartCredit = new Sequelize(process.env[config.use_env_variable]);
} else {
  smartCredit = new Sequelize(
    config.database_SC, config.username, config.password, config
  );
}

fs
  .readdirSync(__dirname)
  .filter(file =>
    (file.indexOf('.') !== 0) &&
    (file !== basename) &&
    (file.slice(-3) === '.js'))
  .forEach(file => {
    const model = smartCredit.import(path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

/*
* Query for turning event scheduler on in the mysql server
*/
let start_event_scheduler = 'SET GLOBAL event_scheduler = ON;';
smartCredit.query(start_event_scheduler).spread((results, metadata) => {
  if(config.logging)
    console.log(results, metadata);
  // Results will be an empty array and metadata will contain the number of affected rows.
});


/*
* Event scheduler for identifying the loans which has passed the expiration date for
* repayment. Status is changed to bad loans.
* Scheduler runs every 1 minute.
*/

let badloan_event = 'CREATE OR REPLACE EVENT loans_not_repaid \
ON SCHEDULE EVERY ' + config.scheduler.recurrence_rule_mins +' MINUTE \
DO \
UPDATE ' + config.database_SC + '.loans \
SET ' + config.database_SC + '.loans.status = "bad loan" \
WHERE ' + config.database_SC + '.loans.expirationDate < NOW() AND ' + config.database_SC + '.loans.status = "active loan";';

smartCredit.query(badloan_event).spread((results, metadata) => {
  if(config.logging)
    console.log(results, metadata);
  // Results will be an empty array and metadata will contain the number of affected rows.
});

/*
* Event Scheduler for terminating out of date loan requests whose valid till date has expired
* and collateral has not been transferred. Status is update to terminated.
* Scheduler runs every 1 minute.
*/
let syncOutOfDateLoanRequests_event = 'CREATE OR REPLACE EVENT syncOutOfDateLoanRequests \
ON SCHEDULE \
EVERY ' + config.scheduler.recurrence_rule_mins +' MINUTE \
DO \
UPDATE ' + config.database_SC + '.orderbooks \
SET ' + config.database_SC + '.orderbooks.status = "terminated" \
WHERE ' + config.database_SC + '.orderbooks.status = "collateral due" AND ' + config.database_SC + '.orderbooks.validtill < NOW();'

smartCredit.query(syncOutOfDateLoanRequests_event).spread((results, metadata) => {
  if(config.logging)
    console.log(results, metadata);
  // Results will be an empty array and metadata will contain the number of affected rows.
});

/*
* Event Scheduler for syncing the approved loan requests without funds transferred within 7 days (currently 2 minutes from approval).
* Scheduler deletes the approved loan from the Loan table and reverts the status of loan request to active and available for
* approval from another lender.
* Scheduler runs every 1 minute.
*/
let syncApprovedLoanRequestsWithoutFunds = 'CREATE OR REPLACE EVENT syncApprovedLoanRequestsWithoutFunds \
ON SCHEDULE \
EVERY ' + config.scheduler.recurrence_rule_mins +' MINUTE \
DO \
BEGIN \
UPDATE ' + config.database_SC + '.orderbooks \
SET ' + config.database_SC + '.orderbooks.status = "active" \
WHERE ' + config.database_SC + '.orderbooks.id IN \
( SELECT orderbookId FROM ( \
SELECT ' + config.database_SC + '.loans.OrderBookId \
FROM ' + config.database_SC + '.loans \
WHERE ' + config.database_SC + '.loans.status = "funds due" AND DATE_ADD(' + config.database_SC + '.loans.createdAt, INTERVAL ' + config.scheduler.approval_expiration_duration_mins +' MINUTE) < NOW() \
)s \
); \
DELETE FROM ' + config.database_SC + '.loans WHERE ' + config.database_SC + '.loans.status = "funds due" AND DATE_ADD(' + config.database_SC + '.loans.createdAt, INTERVAL ' + config.scheduler.approval_expiration_duration_mins +' MINUTE) < NOW(); \
END ';

smartCredit.query(syncApprovedLoanRequestsWithoutFunds).spread((results, metadata) => {
  if(config.logging)
    console.log(results, metadata);
  // Results will be an empty array and metadata will contain the number of affected rows.
});

/*
* Event Scheduler for calculating the left over duration of the active loans and update
* duration in loans table.
* Scheduler runs every day (currently running every 1 minute)
*/
let calculateLeftLoanDuration = 'CREATE OR REPLACE EVENT calculateLeftLoanDuration \
ON SCHEDULE \
EVERY 1 MINUTE \
DO \
UPDATE ' + config.database_SC + '.loans \
SET ' + config.database_SC + '.loans.duration = ' + config.database_SC + '.loans.duration - 1 \
WHERE ' + config.database_SC + '.loans.status = "active loan" AND ' + config.database_SC + '.loans.duration > 0;';

smartCredit.query(calculateLeftLoanDuration).spread((results, metadata) => {
  if(config.logging)
    console.log(results, metadata);
  // Results will be an empty array and metadata will contain the number of affected rows.
});

db.sequelize = smartCredit;
db.Sequelize = Sequelize;

module.exports = db;
