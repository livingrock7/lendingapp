pragma solidity ^0.4.12;

import "./Utils/SafeMath.sol";
import "./Utils/ERC20.sol";
import "./LoanCreator.sol";
import "./Eclaim/SmartMoney.sol";


/**
 *  @title LoanContract
 *  @notice The LoanContract keeps the record of a loan request or loan offer created.
 *  It manages the ENS collateral and fund transfer between Lender and borrower
 *          - ensDomainName: The name of the domain against which the loan is borrowed.
            - ensDomainHash: Sha of the domain name.
            - timestamp: Start date of the loan
            - borrower: Borrower who is the owner of the collateral.
            - lender: Lender who is funding the loan.
            - principal: The loan principal.
            - duration: The duration of the loan.
            - interestRate: The interest rate for the specific loan.
            - status: The status of the loan. Can be:
                - UNFUNDED: The loan not funded yet.
                - FUNDED: The loan is funded now.
                - CLOSED: The loan cycle is closed now.
                - DEFAULT: The loan period has expired, but the loan principal has not been paid.
            - ensStatus: The status of the ENS transfer. Can be:
                - TRANSFERED: The ENS transfered to loan contract as collateral.
                - NOTTRANSFERED: The ENS not transfered to loan contract as collateral.

 */

 contract LoanContract {

    using SafeMath for uint256;

    address private borrower;
    address private lender;
    address private loanCreator;

    /* Will be removed in prod. Required for testing purposes*/
    address private admin = 0x8fAF15DFB86aDFC862C5952B776de2dCe7A36c99;

    uint256 public platformFee;
    address public platformAddr;

    uint256 public insurancePremium;
    address public insurer;

    uint256 public outstandingAmount;

    enum LoanStatus {
        OPEN,
        UNFUNDED,
        FUNDED,
        ACTIVE,
        REPAID,
        CLOSED,
        DEFAULTED
    }

    enum ENSStatus {
        TRANSFERED,
        NOTTRANSFERED
    }


    uint256 public principal;
    uint256 public duration;
    uint256 public interest;

    bytes32 public ensDomainHash;
    string public ensDomainName;

    uint256 public createdOn;
    uint256 public updatedOn;
    uint256 public expiresOn;

    uint256 public riskRating;
    uint public loanId;
    uint public orderBookId;

    address public tokenAddress;
    uint256 public tokenAmount;

    LoanStatus public loanStatus;

    ENSStatus public ensStatus;


    modifier onlyLoanCreator {
        require(msg.sender == loanCreator);
        _;
    }

    modifier onlyBorrower {
        require(msg.sender == borrower);
        _;
    }

    modifier onlyLender {
        require(msg.sender == lender);
        _;
    }

    modifier onlyInsurer {
        require(msg.sender == insurer, "Only Insurer Allowed");
        _;
    }

    modifier onlyAdmin {
        require(msg.sender == admin, 'Only Admin Allowed');
        _;
    }

    modifier onlyIfActive {
        require(uint(loanStatus) == 3, "Loan Not Active");
        _;
    }

    event TransferedCollateral(address indexed loanContract, address indexed receiver, uint256 indexed loanId);
    event LoanRepaid(address indexed loanContract, address indexed from, uint256 indexed loanId);
    event BadLoanRepaid(address indexed loanContract, address indexed from, uint256 indexed loanId);
    event LoanDefaulted(address indexed loanContract, address to, address indexed claimer, uint256 indexed loanId);
    event LogCreditorTransfer(address owner, uint256 balance, uint256 amount);

    /**
     * @notice The LoanContract constructor sets the following values
     *      - The owner of the contract
     *      - The principal of loan
     *      - The duration of the loan
     *      - Interest to be charged
     *      - Loan status to UNFUNDED
     *      - ENS status to NOTTRANSFERED
     *      - riskRating for the loan
     *      - ContractType either LENDER or BORROWER
     */

    constructor (uint256 _principal, uint256 _duration,
        uint256 _interest, uint _loanId, uint _orderbookId, address _lender, address _borrower,
        address _tokenAddress, uint256 _tokenAmount)
        public {

            principal = _principal;
            duration = _duration; //In minutes
            interest = _interest;

            loanId = _loanId;
            orderBookId = _orderbookId;

            loanStatus = LoanStatus.FUNDED;

            tokenAddress = _tokenAddress;
            tokenAmount = _tokenAmount;

            createdOn = now;
            updatedOn = now;

            borrower = _borrower;
            lender = _lender;

            outstandingAmount = getRepaymentAmount(principal, interest);
            // platformFee = outstandingAmount.sub(_insurancePremium);

            loanCreator = msg.sender;  // Required for calling the function of this contract from Loan Creator Contract
    }

    /**
     * @dev Function required to transfer ether to a contract
     *
     */
    function() payable public {
      if(msg.sender == insurer)
        repayBadLoan();
      else
        repayLoan();
    }

    function setLoanActive() external onlyLoanCreator {
        loanStatus = LoanStatus.ACTIVE;
        expiresOn = now + duration * 1 minutes;
        updatedOn = now;
    }


    /**
     *  @notice Sets the ensStatus to TRANSFERED when a user transfers ens to this contract.
     *
     *  @param _ensDomainHash The hash of the ensDomain
     *  @param _ensDomainName The name of the ensDomain
     */
    function setENSArrived(bytes32 _ensDomainHash, string _ensDomainName) external {
        ensDomainHash = _ensDomainHash;
        ensDomainName = _ensDomainName;
        ensStatus = ENSStatus.TRANSFERED;
    }

    function transferToCreditedOwners(uint256 amount) private {
        address smartMoneyAddress = LoanCreator(loanCreator).getSMTAddress();

        address[] memory creditedOwners = SmartMoney(smartMoneyAddress).getCreditedOwners(orderBookId);

        for(uint i=0; i< creditedOwners.length; i++){

            uint256 balance = SmartMoney(smartMoneyAddress).balanceOfLoanUser(creditedOwners[i], orderBookId);

            uint256 value = getProRataAmount(amount, balance);

            creditedOwners[i].transfer(value);

            emit LogCreditorTransfer(creditedOwners[i], balance, value);
        }


    }

    function getProRataAmount(uint256 _amount, uint256 _balance) internal returns(uint256) {

        return (_amount.mul((_balance.mul(10**18)).div(principal))).div(10**18);
    }


    /**
     * @dev The function for repaying the loan on and before the loan expires
     *  checks the loan status to be active
    */
    function repayLoan() public payable {

        if(now <= expiresOn){

          require(msg.value >= outstandingAmount);

          loanStatus = LoanStatus.REPAID;

          transferToCreditedOwners(outstandingAmount.sub(platformFee.add(insurancePremium)));

          outstandingAmount = 0;

          updatedOn = now;

          emit LoanRepaid(this, msg.sender, loanId);

          transferCollateral(borrower);

          deTokenizeSMT();

          transferPlatformFee();

          transferInsurancePremium();

          changeLoanStatus(7);

        } else {

          require(outstandingAmount >= 0);

          outstandingAmount = outstandingAmount.sub(msg.value);

          insurer.transfer(msg.value);

          if(outstandingAmount <=0){
              updatedOn = now;
              changeLoanStatus(8);
          }

        }

    }

    function repayBadLoan() public payable onlyInsurer {

        require(now > expiresOn);

        require(msg.value >= principal);

        // loanStatus = LoanStatus.DEFAULTED;

        transferToCreditedOwners(principal);

    emit BadLoanRepaid(this, msg.sender, loanId);

        transferCollateral(insurer);

        deTokenizeSMT();

        changeLoanStatus(9);
    }


    /**
     * @dev function to transfer collateral to borrower after loan repayment
    */
    function transferCollateral(address _receiver) private {

        // require(uint(loanStatus) == 4 || uint(loanStatus) == 6);

        ERC20 token = ERC20(tokenAddress);

        token.transfer(_receiver, tokenAmount);

    emit TransferedCollateral(this, _receiver, loanId);

    }

    /**
     * @dev function for updating the loan status to close on loan repayment
    */
    function changeLoanStatus(uint8 status) private {

        LoanCreator(loanCreator).changeStatus(orderBookId, status);

    }

    function deTokenizeSMT() private {

        LoanCreator(loanCreator).deTokenizeClaim(orderBookId);

    }

    function setPlatformFeeDetails(uint256 _platformFee, address _platformAddr) public onlyLoanCreator {
        platformFee = (principal.mul(_platformFee)).div(10**4);
        platformAddr = _platformAddr;
    }

    function transferPlatformFee() private {
         // require(uint(loanStatus) == 5);

         platformAddr.transfer(platformFee);

    }

    function setInsurancePremiumDetails(uint256 _insurancePremiumRate, address _insurer) public onlyLoanCreator {
        insurancePremium = (principal.mul(_insurancePremiumRate)).div(10**4);
        insurer = _insurer;
    }

    function transferInsurancePremium() private {
        // require(uint(loanStatus) == 5);

         insurer.transfer(insurancePremium);
    }

    function getRepaymentAmount(uint256 _principal, uint256 _interest) internal returns(uint256){
        uint256 _amount = _principal.add((_principal.mul(_interest)).div(10**4));
        return _amount;
    }

    /**
     * @notice This function returns loan details for the current loan contract
     *
     * @return _principal The amount of the loan
     * @return _duration The duration of the loan
     * @return _interest The interest for the loan
     * @return _ensDomainHash and _ensDomainName that is transfered as collateral
     * @return _riskRating riskRating for the loan
     * @return _status LoanStatus
     */
    function getLoanInfo()
        public view
        returns (address, uint256, uint256, uint256, uint256, address, address, uint256, uint256){
        return (this, orderBookId, principal, duration, interest, borrower, lender, outstandingAmount, expiresOn);
    }

    function getBorrowerAddress() view public returns(address) {
        return borrower;
    }

    function getPrincipal() view public returns(uint256) {
        return principal;
    }

    function getLoanId() view public returns(uint256) {
        return loanId;
    }


    /**
     *  @notice this is test function to test the amount of ether stored in the contract
     *  Will be removed in PROD
     */
    function getMainBalance() public view returns(uint) {
        return this.balance;
    }

     /**
     * @dev to be called in case ETH get stuck in contract.
     * Will be removed in PROD. Only for dev
    */
    function transferFundsBack() onlyAdmin public {
        admin.transfer(this.balance);
    }

    /**
     * @dev to be called in case collateral get stuck in contract.
     * Will be removed in PROD. Only for dev
    */
    function transferCollateral() onlyAdmin public {
        ERC20 token = ERC20(tokenAddress);
        token.transfer(admin, tokenAmount);
    }

    /**
     *  @notice function for destroying a contract state.
     */
    function kill(address recipient) external {
        selfdestruct(recipient);
    }
    //TODO: function to transfer capability to manage the ENS name while the deed contract stays with this contract.

}
