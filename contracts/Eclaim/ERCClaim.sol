pragma solidity ^0.4.18;

/**
 * @title ERCClaim interface
 * @dev created base on ERC721. This is extension of ERC721.
 */
contract ERCClaim {
  event TransferCreditor(address indexed _from, address indexed _to, uint256 _tokenId);
  event TransferDebtor(address indexed _from, address indexed _to, uint256 _tokenId);

  function creditsOf(address _owner) public view returns (uint256 _credits);
  function debtsOf(address _owner) public view returns (uint256 _debts);
  function creditorOf(uint256 _tokenId) public view returns (address _creditor);
  function debtorOf(uint256 _tokenId) public view returns (address _debtor);
  function transferCredit(address _to, uint256 _tokenId) public;
}
