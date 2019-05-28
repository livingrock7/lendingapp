pragma solidity ^0.4.18;

import './ERCClaimToken.sol';
import '../Utils/Ownable.sol';
import '../Utils/secure.sol';
import './SmartMoney.sol';


contract eClaim is ERCClaimToken, Secure, Ownable {

    // EvidenceType
    uint8 constant CREATE = 0;
    uint8 constant ACCEPT = 1;
    uint8 constant ACTIVE = 2;
    uint8 constant TRANSFER = 3;//this is not used for LoanData status
    uint8 constant BREACH = 4;
    uint8 constant ENFORCE = 5;
    uint8 constant CLOSE = 6;
    uint8 constant BORROWER_PAYS_ON_TIME = 7;   //borrower pays on time
    uint8 constant BORROWER_PAYS_LATE = 8; //borrower repays late
    uint8 constant INSURER_PAYS = 9; //insurer repays

    struct EvidenceData {
        uint8 eType;
        uint256 timestamp;
        address user1;//parameter1
        string user1DataType;
        address user2;//parameter2
        string user2DataType;
    }

    struct LoanData {
        // string creditorUserDataType;
        // string debitorUserDataType;
        uint amount;
        uint8 status;
        uint8 tokenized;
        address borrower;
        address tokenAddress;
        uint256 tokenAmount;
        address lender;
        uint256 loanId;
        address loanContractAddr;
    }

    struct EvidenceFiles {
        string contractFile;
        string evidenceFile;
    }

    mapping(uint256=>LoanData) public loans;
    mapping(uint256=>EvidenceFiles) private evidenceFiles;
    mapping(uint256=>EvidenceData[]) private evidencedata;

    //SmartMoney token for tokenize of loans. Owner of this token is eclaim!
    SmartMoney private smartmoney;

    event StatusChanged(uint256 indexed loanID, string newStatus, uint8 indexed statusCode);

    constructor()
    Ownable() public payable {
        ceoAddress = msg.sender;

        smartmoney = new SmartMoney();
    }

    modifier onlyLoanContractOf(uint256 _orderbookId) {
        require(loans[_orderbookId].loanContractAddr == msg.sender, "Only Loan Contract Allowed");
        _;
    }

    function getSMTAddress() public view returns (address) {
        return smartmoney;
    }

    function createLoan(uint256 _id) internal {
        _mint(loans[_id].lender, loans[_id].borrower, _id);
        tokenizeClaim(_id);
    }

    function addEvidenceData(uint256 _id, uint8 _eType,
        address _user1, string _user1DataType,
        address _user2, string _user2DataType) internal {

        evidencedata[_id].push(EvidenceData(_eType, now, _user1, _user1DataType, _user2, _user2DataType));
    }

    function saveContractFile(uint256 _id, string _filePath) onlyCEO public {
        evidenceFiles[_id].contractFile = _filePath;
    }

    function saveEvidenceFile(uint256 _id, string _filePath) onlyCEO public {
        evidenceFiles[_id].evidenceFile = _filePath;
    }

    function changeStatus(uint256 _id, uint8 _status) public onlyLoanContractOf(_id) {
        //_burn(_id);
        //delete loandata[_id];
        loans[_id].status = _status;
        evidencedata[_id].push(EvidenceData(_status, now, msg.sender, "Loan Contract", 0x0, ""));

        if(_status == BORROWER_PAYS_ON_TIME)
          emit StatusChanged(_id, "Borrower Repaid On Time", _status);
        else if (_status == BORROWER_PAYS_LATE)
          emit StatusChanged(_id, "Borrower Repaid Late", _status);
        else if (_status == INSURER_PAYS)
          emit StatusChanged(_id, "Insurer Repaid", _status);

    }

    function transfer(address _to, string userDataType, uint256 _id) public {
        require(loans[_id].status >= ACCEPT);
        require(loans[_id].status < CLOSE);
        transferCredit(_to, _id);
        evidencedata[_id].push(EvidenceData(TRANSFER, now, msg.sender, "SmartCredit.io", 0x0, ""));
        // loandata[_id].creditorUserDataType = userDataType;
    }

    function breach(uint256 _id) public onlyCreditorOf(_id) {
        require(loans[_id].status >= ACCEPT);
        require(loans[_id].status < CLOSE);

        loans[_id].status = BREACH;
        emit StatusChanged(_id, "BREACH", BREACH);
        evidencedata[_id].push(EvidenceData(BREACH, now, msg.sender, "SmartCredit.io", 0x0, ""));
    }

    function enforce(uint256 _id) public onlyCreditorOf(_id) {
        require(loans[_id].status >= ACCEPT);
        require(loans[_id].status < CLOSE);

        loans[_id].status = ENFORCE;
        emit StatusChanged(_id, "ENFORCE", ENFORCE);
        evidencedata[_id].push(EvidenceData(BREACH, now, msg.sender, "SmartCredit.io", 0x0, ""));
    }


    function getCreditor(uint256 _id) public view returns(address) {
        return creditorOf(_id);
    }

    function getDebtor(uint256 _id) public view returns(address) {
        return debtorOf(_id);
    }

    // function getCreditorType(uint256 _id) public view returns(string) {
    //     return loandata[_id].creditorUserDataType;
    // }

    // function getdebtorType(uint256 _id) public view returns(string) {
    //     return loandata[_id].debitorUserDataType;
    // }

    function getAmount(uint256 _id) public view returns(uint) {
        return loans[_id].amount;
    }

    function getStatus(uint256 _id) public view returns(uint8) {
        return loans[_id].status;
    }

    function getContractFilePath(uint256 _id) public view returns(string) {
        return evidenceFiles[_id].contractFile;
    }

    function getEvidenceFilePath(uint256 _id) public view returns(string) {
        return evidenceFiles[_id].evidenceFile;
    }

    function getEvidenceDataCount(uint256 _id) public view returns(uint) {
        return evidencedata[_id].length;
    }

    function getEvidenceDataType(uint256 _id, uint index) public view returns(uint8) {
        return evidencedata[_id][index].eType;
    }

    function getEvidenceDataTimestamp(uint256 _id, uint index) public view returns(uint256) {
        return evidencedata[_id][index].timestamp;
    }

    function getEvidenceDataUser1(uint256 _id, uint index) public view returns(address) {
        return evidencedata[_id][index].user1;
    }

    function getEvidenceDataUser1DataType(uint256 _id, uint index) public view returns(string) {
        return evidencedata[_id][index].user1DataType;
    }

    function getEvidenceDataUser2(uint256 _id, uint index) public view returns(address) {
        return evidencedata[_id][index].user2;
    }

    function getEvidenceDataUser2DataType(uint256 _id, uint index) public view returns(string) {
        return evidencedata[_id][index].user2DataType;
    }

    // author: Anurag
    function getEvidenceData(uint256 _id, uint index) public view returns(uint8, uint256, address, string, address, string) {
      return (evidencedata[_id][index].eType, evidencedata[_id][index].timestamp,
              evidencedata[_id][index].user1, evidencedata[_id][index].user1DataType,
              evidencedata[_id][index].user2, evidencedata[_id][index].user2DataType);
    }

    function tokenizeClaim(uint256 _id) internal {
        require(loans[_id].status >= ACCEPT);
        require(loans[_id].status < CLOSE);

        address tokenOwner = creditorOf(_id);
        uint amount = loans[_id].amount;

        smartmoney.tokenize(tokenOwner, _id, amount);
        loans[_id].tokenized = 1;
    }

    function deTokenizeClaim(uint256 _id) public onlyLoanContractOf(_id) {
        require(loans[_id].status >= ACCEPT, "Loan Status should be Active");

        // Todo This should be discussed(Important). Should we add more loan status?
        // require(loans[_id].status < CLOSE);

        smartmoney.deTokenize(_id);
        loans[_id].tokenized = 0;
    }
}
