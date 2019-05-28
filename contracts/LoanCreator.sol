pragma solidity^0.4.24;

import "./LoanContract.sol";
import './Utils/strings.sol';
import "./ENS/AbstractENS.sol";
import "./ENS/HashRegistrarSimplified.sol";
import "./Utils/ERC20.sol";
import "./Eclaim/eClaim.sol";

/**
    @title LoanCreator
    @notice The LoanCreator contract manages smartcredit Loans
    @dev The contract has references to the following external contracts:
            - Registrar Contract from ENS - To verify and transfer domain ownership
            - Reference to LoanContract contract: To deploy new loan contract
                    after fund arrival from lender. Lender will be owner of contract.
            - Loan: Struct type to store loan related information on loan creator contract
            - loans: mapping of a Loan with the orderBookId from the off-chain DB.
            - loanCounter: keeps record of the number of loan requests created.

*/

contract LoanCreator is eClaim {

    using strings for *;

    // AbstractENS public ens;
    // Registrar public registrar;

    uint public loanCounter;

    //Loan Creator contract owner
    address private owner;

    address public platformAddr;
    uint256 public platformFee;

    event FundsTransferedToBorrower(address indexed contractAddress, address indexed borrower);
    event FundsArrived(address indexed from, address indexed to, uint indexed loanId, uint256 amount);
    event LoanContractCreated(address indexed from, uint indexed loanId, address indexed lender, address loan);
    event CollateralDetailsUpdated(address indexed borrower, uint indexed orderBookId);
    event CollateralTransferedToLoan(address indexed from, address indexed to, uint256 indexed loanId);
    event CollateralReturnedToBorrower(address indexed from, address indexed to, uint256 indexed loanId);

    modifier onlyOwner(){
        require(msg.sender == owner);
        _;
    }

    modifier onlyDebtor(uint _orderbookId){
        require(msg.sender == loans[_orderbookId].borrower);
        _;
    }

    modifier onlyCEOorBorrower(uint _orderbookId){
        require(msg.sender == owner || msg.sender == loans[_orderbookId].borrower);
        _;
    }

    /**
     * constructor to set the loan creator contract deployer as owner
    */
    constructor(uint256 _platformFee, address _platformAddr) public{
        owner = msg.sender;
        platformAddr = _platformAddr;
        platformFee = _platformFee;
    }


    /**
     * @dev Update the loan creator contract after a loan request is created
     *  and collateral is successfully transferred to escrow (Loan Creator Contract)
     * @param _borrower The borrower ethereum address
     * @param _principal The principal amount
     * @param _tokenAddress The ERC20 token contract address
     * @param _tokenAmount The token amount transferred
     * @param _orderbookId The order book Id from the off-chain DB
    */
    function updateCollateralArrival(address _borrower,
        uint256 _principal,
        address _tokenAddress,
        uint256 _tokenAmount,
        uint _orderbookId)
        onlyOwner public{

            require(_borrower != address(0));
            require(loans[_orderbookId].borrower == 0);

            loans[_orderbookId] = LoanData(_principal, CREATE,
                0, _borrower,_tokenAddress, _tokenAmount, 0,0,0);

            addEvidenceData(_orderbookId, CREATE, _borrower, "Borrower", 0x0, "");

        emit CollateralDetailsUpdated(_borrower, _orderbookId);
    }

    /**
     * @dev Returns the collateral back to borrower in case of termination or
     *      validity expiration of loan request.
     *      Status of loan request is updated to CLOSE.
     *      Can only be called by either Borrower or Loan Creator Owner(CEO).
     *
     * @param _orderbookId The orderbook Id of the loan request
    */
    function returnCollateralToBorrower(uint _orderbookId)
        onlyCEOorBorrower(_orderbookId) external {

            require(loans[_orderbookId].status < ACCEPT);
            require(loans[_orderbookId].tokenAmount != 0);

                address tokenAddress = loans[_orderbookId].tokenAddress;
                uint256 tokenAmount = loans[_orderbookId].tokenAmount;
                address borrower = loans[_orderbookId].borrower;

            ERC20 token = ERC20(tokenAddress);
                loans[_orderbookId].tokenAmount = 0;
                loans[_orderbookId].status = CLOSE;
                token.transfer(borrower, tokenAmount);

            addEvidenceData(_orderbookId, CLOSE, msg.sender, "SmartCredit.io", 0x0, "");

        emit CollateralReturnedToBorrower( this, borrower, _orderbookId);
    }

    function multipleCollateralReturn(uint256[] memory _orderbookIds) onlyOwner public {

      for(uint i=0; i< _orderbookIds.length; i++){
        uint256 _orderbookId = _orderbookIds[i];
        if(loans[_orderbookId].status < ACCEPT && loans[_orderbookId].tokenAmount != 0){
          address tokenAddress = loans[_orderbookId].tokenAddress;
          uint256 tokenAmount = loans[_orderbookId].tokenAmount;
          address borrower = loans[_orderbookId].borrower;

          ERC20 token = ERC20(tokenAddress);
            loans[_orderbookId].tokenAmount = 0;
            loans[_orderbookId].status = CLOSE;
            token.transfer(borrower, tokenAmount);

            addEvidenceData(_orderbookId, CLOSE, msg.sender, "SmartCredit.io", 0x0, "");

          emit CollateralReturnedToBorrower(this, borrower, _orderbookId);
        }
      }
    }


    /**
     * @dev Transfer funds to escrow after loan request approval by lender
     *
     * @param _loanId The loan Id from the off-chain DB
     * @param _orderbookId The order book Id from the off-chain DB
    */
    function transferFunds(uint _loanId,
        uint _orderbookId)
        public payable {

            /**
            * Add function to get the actual fund amount when msg.value will contain the
            * fee also which could be 0.1% of the loan amount
            */
            require(loans[_orderbookId].status < ACCEPT);
            require(loans[_orderbookId].amount == msg.value);
            require(loans[_orderbookId].loanContractAddr == 0x0);

            loans[_orderbookId].lender = msg.sender;
            loans[_orderbookId].loanId = _loanId;
            loans[_orderbookId].status = ACCEPT;

            addEvidenceData(_orderbookId, ACCEPT, msg.sender, "Lender", 0x0, "");

        emit FundsArrived(msg.sender, this, _orderbookId, msg.value);

    }


    /**
     * @dev Creates loan contract with lender as the owner
     * @param _orderbookId The order book Id from the off-chain DB
    */
    function createLoanContract(uint _orderbookId,
        uint256 _duration,
        uint256 _interest,
        uint256 _insurancePremium,
        address _insurer)
        public onlyOwner {

            require(loans[_orderbookId].status == ACCEPT);

            loans[_orderbookId].status = ACTIVE;

            address loanContract = new LoanContract(loans[_orderbookId].amount, _duration, _interest,
                        loans[_orderbookId].loanId, _orderbookId, loans[_orderbookId].lender, loans[_orderbookId].borrower,
                        loans[_orderbookId].tokenAddress, loans[_orderbookId].tokenAmount);

            loans[_orderbookId].loanContractAddr = loanContract;

        emit LoanContractCreated(this, _orderbookId, loans[_orderbookId].lender, loanContract);

            transferFundsToBorrower(loanContract, loans[_orderbookId].borrower, _orderbookId, loans[_orderbookId].amount, _insurancePremium, _insurer);

    }


    /**
     * @dev Transfer funds to borrower after the loan contract creation
     * @param _loanContractAddress The deployed loan contract address
     * @param _orderbookId The order book Id from the off-chain DB
    */
    function transferFundsToBorrower(address _loanContractAddress,
        address _borrower,
        uint _orderbookId,
        uint256 _amount,
        uint256 _insurancePremium,
        address _insurer)
        private{

            LoanContract loanContract = LoanContract(_loanContractAddress);

            _borrower.transfer(_amount);

            loanContract.setLoanActive();

            loanContract.setPlatformFeeDetails(platformFee, platformAddr);
            loanContract.setInsurancePremiumDetails(_insurancePremium, _insurer);

            addEvidenceData(_orderbookId, ACTIVE, msg.sender, "SmartCredit.io", _loanContractAddress, "");

        emit FundsTransferedToBorrower(_loanContractAddress, _borrower);

            transferCollateralToLoan(_loanContractAddress, _orderbookId);


    }


    /**
     * @dev Transfer Collateral to loan contract
     * @param _loanContractAddress The deployed loan contract address
     * @param _orderbookId The order book Id from the off-chain DB
    */
    function transferCollateralToLoan(address _loanContractAddress,
        uint256 _orderbookId)
        private {

            address tokenAddress = loans[_orderbookId].tokenAddress;
            uint256 tokenAmount = loans[_orderbookId].tokenAmount;

            ERC20 token = ERC20(tokenAddress);

            token.transfer(_loanContractAddress, tokenAmount);

        emit CollateralTransferedToLoan( this, _loanContractAddress, _orderbookId);

            createLoan(_orderbookId);
    }

    function getLoanContractAddress(uint256 _orderbookId) public view returns(address) {
        return loans[_orderbookId].loanContractAddr;
    }

    /**
        @dev Throws if called by any account.
    */
    function() payable public{
        // revert();
    }

    // /**
    //  *  @notice Function to kill the loan contract
    //  */
    // function killLoanContract(address loanContractAddress) onlyOwner public {
    //     LoanContract loanContract = LoanContract(loanContractAddress);
    //     loanContract.kill(owner);
    // }

    // /**
    //  *  @notice this is test function to test the amount of ether stored in the contract
    //  *  Will be removed in PROD
    //  */
    // function getMainBalance() public view returns(uint) {
    //     return address(this).balance;
    // }

    /**
     * function to get the loan getLoanDetails
    */
    // function getLoanDetails(uint orderBookId) view public returns(address, uint256, address, address){
    //     address loanAddr = loans[orderBookId].loanContractAddr;
    //     // uint256 funds = loans[orderBookId].fundAmount;
    //     address lender = loans[orderBookId].lender;
    //     address borrower = loans[orderBookId].borrower;
    //     return (loanAddr, funds, lender, borrower);
    // }

    // /**
    //  * @notice these functions will be removed in prod. Only for testing and dev purposes
    // */
    // function transferFundsBack() onlyOwner public {
    //     owner.transfer(address(this).balance);
    // }


    // /**
    //  *  @notice function to kill the order book contract
    //  */
    // function kill() onlyOwner public {
    //     selfdestruct(owner);
    // }


}
