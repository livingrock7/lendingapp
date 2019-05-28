pragma solidity ^0.4.18;

import "./ERCClaim.sol";
import "../Utils/SafeMath.sol";

/**
 * @title ERCClaimToken
 * Generic implementation for the required functionality of the ERCClaim standard
 */
contract ERCClaimToken is ERCClaim {
  using SafeMath for uint256;

  // Total amount of tokens
  uint256 private totalTokens;

  // Mapping from token ID to creditor
  mapping (uint256 => address) private tokenCreditor;

  // Mapping from token ID to debtor
  mapping (uint256 => address) private tokenDebtor;

  // Mapping from owner to list of credited token IDs
  mapping (address => uint256[]) private creditedTokens;

  // Mapping from owner to list of debted token IDs
  mapping (address => uint256[]) private debtedTokens;

  // Mapping from token ID to index of the creditor tokens list
  mapping(uint256 => uint256) private creditedTokensIndex;

  // Mapping from token ID to index of the debtor tokens list
  mapping(uint256 => uint256) private debtedTokensIndex;

  /**
  * @dev Guarantees msg.sender is owner of the given token
  * @param _tokenId uint256 ID of the token to validate its ownership belongs to msg.sender
  */
  modifier onlyCreditorOf(uint256 _tokenId) {
    require(creditorOf(_tokenId) == msg.sender);
    _;
  }

  modifier onlyLoanContractOf(uint256 _tokenId) {
      require(address(_tokenId) == msg.sender);
      _;
  }

  /**
  * @dev Gets the total amount of tokens stored by the contract
  * @return uint256 representing the total amount of tokens
  */
  function totalSupply() public view returns (uint256) {
    return totalTokens;
  }

  /**
  * @dev Gets the credit amount of the specified address
  * @param _owner address to query the balance of
  * @return uint256 representing the amount owned by the passed address
  */
  function creditsOf(address _owner) public view returns (uint256) {
    return creditedTokens[_owner].length;
  }

  /**
  * @dev Gets the debt amount of the specified address
  * @param _owner address to query the debt of
  * @return uint256 representing the amount debted by the passed address
  */
  function debtsOf(address _owner) public view returns (uint256) {
    return debtedTokens[_owner].length;
  }

  /**
  * @dev Gets the list of tokens owned by a given address
  * @param _owner address to query the tokens of
  * @return uint256[] representing the list of tokens owned by the passed address
  */
  function creditedtokensOf(address _owner) public view returns (uint256[]) {
    return creditedTokens[_owner];
  }

    /**
  * @dev Gets the list of tokens debted by a given address
  * @param _owner address to query the tokens of
  * @return uint256[] representing the list of tokens debted by the passed address
  */
  function debtedtokensOf(address _owner) public view returns (uint256[]) {
    return debtedTokens[_owner];
  }

  /**
  * @dev Gets the creditor of the specified token ID
  * @param _tokenId uint256 ID of the token to query the creditor of
  * @return owner address currently marked as the creditor of the given token ID
  */
  function creditorOf(uint256 _tokenId) public view returns (address) {
    address owner = tokenCreditor[_tokenId];
    require(owner != address(0));
    return owner;
  }

  /**
  * @dev Gets the debtor of the specified token ID
  * @param _tokenId uint256 ID of the token to query the debtor of
  * @return owner address currently marked as the debtor of the given token ID
  */
  function debtorOf(uint256 _tokenId) public view returns (address) {
    address owner = tokenDebtor[_tokenId];
    require(owner != address(0));
    return owner;
  }


  /**
  * @dev Transfers the ownership of a given token ID to another address
  * @param _to address to receive the ownership of the given token ID
  * @param _tokenId uint256 ID of the token to be transferred
  */
  function transferCredit(address _to, uint256 _tokenId) public onlyCreditorOf(_tokenId) {
    clearAndTransfer(msg.sender, _to, _tokenId);
  }

  /**
  * @dev Mint token function
  * @param _creditor The address that will own the minted token
  * @param _debtor The address that will be the debtor of the minted token
  * @param _tokenId uint256 ID of the token to be minted by the msg.sender
  */
  function _mint(address _creditor, address _debtor, uint256 _tokenId) internal {
    require(_creditor != address(0));
    require(_debtor != address(0));
    addToken(_creditor, _debtor, _tokenId);
    emit TransferCreditor(0x0, _creditor, _tokenId);
    emit TransferDebtor(0x0, _debtor, _tokenId);
  }

  /**
  * @dev Burns a specific token
  * @param _tokenId uint256 ID of the token being burned by the msg.sender
  */
  function _burn(uint256 _tokenId) onlyCreditorOf(_tokenId) internal {
    removeToken(msg.sender, _tokenId);
    emit TransferCreditor(msg.sender, 0x0, _tokenId);
  }

  /**
  * @dev Internal function to clear current token and transfer the ownership of a given token ID
  * @param _from address which you want to send tokens from
  * @param _to address which you want to transfer the token to
  * @param _tokenId uint256 ID of the token to be transferred
  */
  function clearAndTransfer(address _from, address _to, uint256 _tokenId) internal {
    require(_to != address(0));
    require(_to != creditorOf(_tokenId));
    require(_to != debtorOf(_tokenId));
    require(creditorOf(_tokenId) == _from);

    address _debtor = debtorOf(_tokenId);

    removeToken(_from, _tokenId);
    addToken(_to, _debtor, _tokenId);
    emit TransferCreditor(_from, _to, _tokenId);
  }

  /**
  * @dev Internal function to add a token ID to the list of a given address of creditor and debtor
  * @param _creditor address representing the new creditor of the given token ID
  * @param _debtor address representing the new debtor of the given token ID
  * @param _tokenId uint256 ID of the token to be added to the tokens list of the given address
  */
  function addToken(address _creditor, address _debtor, uint256 _tokenId) private {
    require(tokenCreditor[_tokenId] == address(0));
    require(tokenDebtor[_tokenId] == address(0));

    tokenCreditor[_tokenId] = _creditor;
    tokenDebtor[_tokenId] = _debtor;
    uint256 length1 = creditsOf(_creditor);
    uint256 length2 = debtsOf(_debtor);
    creditedTokens[_creditor].push(_tokenId);
    debtedTokens[_debtor].push(_tokenId);
    creditedTokensIndex[_tokenId] = length1;
    debtedTokensIndex[_tokenId] = length2;
    totalTokens = totalTokens.add(1);
  }

  /**
  * @dev Internal function to add a token ID to the list of a given address of creditor
  * @param _creditor address representing the new creditor of the given token ID
  * @param _tokenId uint256 ID of the token to be added to the tokens list of the given address
  */
  function addTokenWithCreditor(address _creditor, uint256 _tokenId) internal {
    require(tokenCreditor[_tokenId] == address(0));

    tokenCreditor[_tokenId] = _creditor;
    uint256 length1 = creditsOf(_creditor);
    creditedTokens[_creditor].push(_tokenId);
    creditedTokensIndex[_tokenId] = length1;
    totalTokens = totalTokens.add(1);

    emit TransferCreditor(0x0, _creditor, _tokenId);
  }

  /**
  * @dev Internal function to add a debtor to token ID
  * @param _debtor address representing the new debtor of the given token ID
  * @param _tokenId uint256 ID of the token
  */
  function addDebtorToToken(address _debtor, uint256 _tokenId) internal {
    require(tokenDebtor[_tokenId] == address(0));

    tokenDebtor[_tokenId] = _debtor;
    uint256 length2 = debtsOf(_debtor);
    debtedTokens[_debtor].push(_tokenId);
    debtedTokensIndex[_tokenId] = length2;

    emit TransferDebtor(0x0, _debtor, _tokenId);
  }

  /**
  * @dev Internal function to remove a token ID from the list of a given address
  * @param _from address representing the previous owner of the given token ID
  * @param _tokenId uint256 ID of the token to be removed from the tokens list of the given address
  */
  function removeToken(address _from, uint256 _tokenId) private {
    require(creditorOf(_tokenId) == _from);
    address _debtor = debtorOf(_tokenId);

    uint256 _creditedTokenIndex = creditedTokensIndex[_tokenId];
    uint256 _debtedTokenIndex = debtedTokensIndex[_tokenId];
    uint256 lastcreditedTokenIndex = creditsOf(_from).sub(1);
    uint256 lastcreditedToken = creditedTokens[_from][lastcreditedTokenIndex];
    uint256 lastdebtedTokenIndex = debtsOf(_debtor).sub(1);
    uint256 lastdebtedToken = debtedTokens[_debtor][lastdebtedTokenIndex];

    tokenCreditor[_tokenId] = 0;
    creditedTokens[_from][_creditedTokenIndex] = lastcreditedToken;
    creditedTokens[_from][lastcreditedTokenIndex] = 0;

    tokenDebtor[_tokenId] = 0;
    debtedTokens[_debtor][_debtedTokenIndex] = lastdebtedToken;
    debtedTokens[_debtor][lastdebtedTokenIndex] = 0;

    // Note that this will handle single-element arrays. In that case, both tokenIndex and lastTokenIndex are going to
    // be zero. Then we can make sure that we will remove _tokenId from the ownedTokens list since we are first swapping
    // the lastToken to the first position, and then dropping the element placed in the last position of the list

    creditedTokens[_from].length--;
    creditedTokensIndex[_tokenId] = 0;
    creditedTokensIndex[lastcreditedToken] = _creditedTokenIndex;

    debtedTokens[_debtor].length--;
    debtedTokensIndex[_tokenId] = 0;
    debtedTokensIndex[lastdebtedToken] = _debtedTokenIndex;


    totalTokens = totalTokens.sub(1);
  }
}
