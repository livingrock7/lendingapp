# Pilot Phase II for SmartCredit.io

## Quick Setup (Switch to Kovan Network)

This guide is for deploying on Kovan Testnet

* Use screen for starting multiple terminal instances on from same window.
#### useful commands:
	screen	// for starting a new session
	ctrl-A + C	// for creating a new window
	ctrl-A + N	// for switching between windows

start session in terminal with command $screen

#### Contract Deployment

Step 1: Update the mnemonic with your 12 words mnemonic used for deploying the contract in truffle.js
        ```
        var mnemonic = "12 words mnemonic here";
        ```

Note: Before going to Step-2, please confirm that the truffle compiler version is updated.

  Check truffle verison using
  ```sh
  $ truffle version
  ```
  Output should be:
  ```
  Truffle v4.1.14 (core: 4.1.14)
  Solidity v0.4.24 (solc-js)
  ```
  if compiler version is not 0.4.24, please update compiler using
```sh
$ npm install -g truffle@4.1.14
```

Step 2: Deploy the contracts. Inside project root directory run the following commands
```sh
$ truffle compile
$ truffle migrate --network kovan
```
Step 6: Get the address of the deployed Loan Creator, SmartMoney Contract and Standard token contract. Update the loanCreator_address, smart_money_address and token_address in /webapp/config/config.json. Also, Update the loanCreator_address and token_address in public/javascripts/web3js.js file

Update SmartMoney Contract address in config.json.

Note: Insurer address has to be set in webapp/config/config.json for current phase of development.

#### Application Deployment

Step 1: Update account mnemonic in config.json in webapp/config/config.json

Step 2: Create a database schema named "smartcredit" and update the database configuration in config/config.json file for developement environment.

    Important: Update timezone for database.

		Also, make sure the database is case insensitive by using the following commands
				sudo nano /etc/my.cnf
				lower_case_table_names=1
				sudo /etc/init.d/mysql restart

Step 3: Update the aws_config.json file with access_id and access_key and region for AWS SES service.

Step 4: You could update the variables for batch processes scheduler in config file

			"scheduler": {
				"recurrence_rule_mins": 3,				// Set this for specifying when the job should recur in mins
				"collateral_expiration_duration_mins": 10,	// Set this for specifying the waiting duration for
																											loan requests without collateral before terminating them
				"approval_expiration_duration_mins": 10		// Set this for specifying the fund transfer waiting duration for approved loan request

				"repayment_reminder_duration_mins": 2		//For loan repayment reminder
			}

Step 5: Run the claim application and update its url in config file under eclaim_url

Step 6: Install the node dependencies using

```sh
$ npm install
```

Step 7: Run the application

```sh
$ npm start
```

#### Contracts Testing Using Truffle tests

Step 1: Install and run local ethereum node using the following commands.

```sh
$ npm install -g ganache-cli
$ ganache-cli -m "paste the mnemonic here" -l 8000000
```

Step 2: Run truffle tests using the following command.
```sh
$ truffle test
```
Step 3: Once tests are finished close the local node.

#### Application Testing using NPM tests

Step 1: Install and run local ethereum node using the following commands.

```sh
$ npm install -g ganache-cli
$ ganache-cli -m "paste the mnemonic here" -l 8000000
```

Step 2: Deploy the contracts. Inside project root directory run the following commands
```sh
$ truffle compile
$ truffle migrate
```

Step 3: Get the address of the deployed Loan Creator, SmartMoney Contract and Standard token contract. Update the loanCreator_address and token_address in /webapp/config/config.json for test environment.Also, update the mnemonic used above.
Update SmartMoney Contract address in config.json.

Note: Change the NODE_ENV value to test in .env file inside webapp folder

Step 4: Create a database schema named "smartcredit_test" and update the database configuration in config/config.json file for test environment.

    Important: Update timezone for database.

		Also, make sure the database is case insensitive by using the following commands
				sudo nano /etc/my.cnf
				lower_case_table_names=1
				sudo /etc/init.d/mysql restart

Note: For tests, email notification is disabled. Mysql logging is disabled too.
The current tests will not be testing the batch processes and mysql event schedulers.

Step 5: Install node dependencies if node done earlier and then run the test.

```sh
$ npm test
```

Step 6: For re running the tests, close the local node and reploy contracts.
