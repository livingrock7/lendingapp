pragma solidity ^0.4.18;

import "../Utils/SafeMath.sol";
import "../Utils/ERC20Interface.sol";
import '../Utils/Ownable.sol';

// ----------------------------------------------------------------------------
// Smart money contract for eClaim
//
// Symbol      : SMT
// Name        : Smart Money
// Decimals    : 18
//
// ----------------------------------------------------------------------------


// ----------------------------------------------------------------------------
// Contract function to receive approval and execute function in one call
//
// Borrowed from MiniMeToken
// ----------------------------------------------------------------------------
contract ApproveAndCallFallBack {
    function receiveApproval(address from, uint256 tokens, address token, bytes data) public;
}


// ----------------------------------------------------------------------------
// ERC20 Token, with the addition of symbol, name and decimals and an
// infinit supply
// ----------------------------------------------------------------------------
contract SmartMoney is ERC20Interface, Ownable {
    using SafeMath for uint;

    string public symbol;
    string public  name;
    uint8 public decimals;
    uint public _totalSupply;

    uint constant MAX_HOLDERS = 5;

    // Mapping owner to map of loan and credited loan count
    mapping(address => mapping(uint => uint)) balanceEthToLoan;

    // Mapping loan to map of creditors and credited loan count
    //mapping(uint => mapping(address => uint)) balanceLoanToEth;

    // Mapping from owner to list of credited loan IDs
    mapping (address => uint[]) private creditedLoan;

    // Mapping from loan to list of owners
    mapping (uint => address[]) private creditedOwner;

    mapping(address => mapping(address => uint)) allowed;

    // ------------------------------------------------------------------------
    // Constructor
    // ------------------------------------------------------------------------
    constructor() public {
        symbol = "SMT";
        name = "Smart Money Token";
        decimals = 18;
    }


    // ------------------------------------------------------------------------
    // Total supply
    // ------------------------------------------------------------------------
    function totalSupply() public constant returns (uint) {
        return _totalSupply;
    }


    // ------------------------------------------------------------------------
    // Get the token balance for account `tokenOwner`
    // ------------------------------------------------------------------------
    function balanceOf(address tokenOwner) public constant returns (uint balance) {
        uint value = 0;
        for (uint i = 0; i < creditedLoan[tokenOwner].length; i ++) {
            uint loanID = creditedLoan[tokenOwner][i];
            value += balanceEthToLoan[tokenOwner][loanID];
        }
        return value;
    }

    // ------------------------------------------------------------------------
    // Get the token balance for loan id
    // ------------------------------------------------------------------------
    function balanceOfLoan(uint loanID) public constant returns (uint balance) {
        uint value = 0;
        for (uint i = 0; i < creditedOwner[loanID].length; i ++) {
            address tokenOwner = creditedOwner[loanID][i];
            //value += balanceLoanToEth[loanID][tokenOwner];
            value += balanceEthToLoan[tokenOwner][loanID];
        }
        return value;
    }

        // ------------------------------------------------------------------------
    // Get the token balance for account `tokenOwner`
    // ------------------------------------------------------------------------
    function balanceOfLoanUser(address tokenOwner, uint loanID) public constant returns (uint balance) {
        return balanceEthToLoan[tokenOwner][loanID];
    }

    function removeCreditLoan(address tokenOwner, uint index) private {
        uint last = creditedLoan[tokenOwner].length - 1;
        creditedLoan[tokenOwner][index] = creditedLoan[tokenOwner][last];
        delete creditedLoan[tokenOwner][last];

    }

    function removeCreditOwner(uint loanID, uint index) private {
        uint last = creditedOwner[loanID].length - 1;
        creditedOwner[loanID][index] = creditedOwner[loanID][last];
        delete creditedOwner[loanID][last];

    }

    // ------------------------------------------------------------------------
    // Create token related to loan
    // ------------------------------------------------------------------------
    function tokenize(address tokenOwner, uint loanID, uint amount) onlyOwner public {
        require(amount > 0);

        if (balanceEthToLoan[tokenOwner][loanID] == 0) {
            creditedLoan[tokenOwner].push(loanID);
            creditedOwner[loanID].push(tokenOwner);
        }

        balanceEthToLoan[tokenOwner][loanID] = balanceEthToLoan[tokenOwner][loanID].add(amount);
        //balanceLoanToEth[loanID][tokenOwner] = balanceLoanToEth[loanID][tokenOwner].add(amount);

        _totalSupply = _totalSupply.add(amount);

        emit Transfer(0x0, tokenOwner, amount);
    }


    // ------------------------------------------------------------------------
    // destroy all token related to loan
    // ------------------------------------------------------------------------
    function deTokenize(uint loanID) onlyOwner public {
        for (uint256 i = 0; i < creditedOwner[loanID].length; i ++) {
            address tokenOwner = creditedOwner[loanID][i];

            uint amount = balanceEthToLoan[tokenOwner][loanID];
            balanceEthToLoan[tokenOwner][loanID] = 0;

            _totalSupply = _totalSupply.sub(amount);
            emit Transfer(tokenOwner, 0x0, amount);

            for (uint j = 0; j < creditedLoan[tokenOwner].length; j ++) {
                if (loanID == creditedLoan[tokenOwner][j]) {
                    removeCreditLoan(tokenOwner, j);
                    break;
                }
            }
        }

        delete creditedOwner[loanID];
    }

    // ------------------------------------------------------------------------
    // Transfer the balance from token owner's account to `to` account
    // - Owner's account must have sufficient balance to transfer
    // - 0 value transfers are allowed
    // ------------------------------------------------------------------------
    function transfer(address to, uint tokens) public returns (bool success) {
        uint balanceSender = balanceOf(msg.sender);
        require(balanceSender >= tokens);

        uint transferred = 0;
        uint i = 0;
        while(true) {
            uint loanID = creditedLoan[msg.sender][i];

            uint countSender = balanceEthToLoan[msg.sender][loanID];

            if(creditedOwner[loanID].length > MAX_HOLDERS){
                revert("Too Many Holders");
            } else if (creditedOwner[loanID].length == MAX_HOLDERS && tokens < countSender){
                revert("Too many holders");
            }

            uint countReceiver = balanceEthToLoan[to][loanID];
            uint toTransfer = countSender;
            if (toTransfer > tokens - transferred)
                toTransfer = tokens - transferred;

            balanceEthToLoan[msg.sender][loanID] = countSender.sub(toTransfer);
            balanceEthToLoan[to][loanID] = countReceiver.add(toTransfer);

            //balanceLoanToEth[loanID][msg.sender] = balanceLoanToEth[loanID][msg.sender].sub(toTransfer);
            //balanceLoanToEth[loanID][to] = balanceLoanToEth[loanID][to].add(toTransfer);

            if (countReceiver == 0) {
                creditedLoan[to].push(loanID);
                creditedOwner[loanID].push(to);
            }

            if (balanceEthToLoan[msg.sender][loanID] == 0) {
                removeCreditLoan(msg.sender, i);

                for (uint j = 0; j < creditedOwner[loanID].length; j ++) {
                    if (creditedOwner[loanID][j] == msg.sender) {
                        removeCreditOwner(loanID, j);
                        break;
                    }
                }
            }
            else {
                i ++;
            }

            transferred += toTransfer;
            if (transferred == tokens) {
                emit Transfer(msg.sender, to, transferred);
                return true;
            }

            if (i >= creditedLoan[msg.sender].length)
                break;

        }

        emit Transfer(msg.sender, to, transferred);
        return false;
    }


    // ------------------------------------------------------------------------
    // Token owner can approve for `spender` to transferFrom(...) `tokens`
    // from the token owner's account
    //
    // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20-token-standard.md
    // recommends that there are no checks for the approval double-spend attack
    // as this should be implemented in user interfaces
    // ------------------------------------------------------------------------
    function approve(address spender, uint tokens) public returns (bool success) {
        allowed[msg.sender][spender] = tokens;
        emit Approval(msg.sender, spender, tokens);
        return true;
    }


    // ------------------------------------------------------------------------
    // Transfer `tokens` from the `from` account to the `to` account
    //
    // The calling account must already have sufficient tokens approve(...)-d
    // for spending from the `from` account and
    // - From account must have sufficient balance to transfer
    // - Spender must have sufficient allowance to transfer
    // - 0 value transfers are allowed
    // ------------------------------------------------------------------------
    function transferFrom(address from, address to, uint tokens) public returns (bool success) {
        uint balanceSender = balanceOf(from);
        require(balanceSender >= tokens);

        allowed[from][msg.sender] = allowed[from][msg.sender].sub(tokens);

        uint transferred = 0;
        uint i = 0;
        while(true) {
            uint loanID = creditedLoan[from][i];

            uint countSender = balanceEthToLoan[from][loanID];
            uint countReceiver = balanceEthToLoan[to][loanID];
            uint toTransfer = countSender;
            if (toTransfer > tokens - transferred)
                toTransfer = tokens - transferred;

            balanceEthToLoan[from][loanID] = countSender.sub(toTransfer);
            balanceEthToLoan[to][loanID] = countReceiver.add(toTransfer);

            //balanceLoanToEth[loanID][from] = balanceLoanToEth[loanID][from].sub(toTransfer);
            //balanceLoanToEth[loanID][to] = balanceLoanToEth[loanID][to].add(toTransfer);

            if (countReceiver == 0) {
                creditedLoan[to].push(loanID);
            }

            if (balanceEthToLoan[from][loanID] == 0) {
                creditedLoan[from][i] = creditedLoan[from][creditedLoan[from].length - 1];
                delete creditedLoan[from][creditedLoan[from].length - 1];
            }
            else {
                i ++;
            }

            transferred += toTransfer;
            if (transferred == tokens) {
                emit Transfer(from, to, transferred);
                return true;
            }

            if (i >= creditedLoan[msg.sender].length)
                break;

        }

        emit Transfer(msg.sender, to, transferred);
        return false;

    }


    // ------------------------------------------------------------------------
    // Returns the amount of tokens approved by the owner that can be
    // transferred to the spender's account
    // ------------------------------------------------------------------------
    function allowance(address tokenOwner, address spender) public constant returns (uint remaining) {
        return allowed[tokenOwner][spender];
    }


    // ------------------------------------------------------------------------
    // Token owner can approve for `spender` to transferFrom(...) `tokens`
    // from the token owner's account. The `spender` contract function
    // `receiveApproval(...)` is then executed
    // ------------------------------------------------------------------------
    function approveAndCall(address spender, uint tokens, bytes data) public returns (bool success) {
        allowed[msg.sender][spender] = tokens;
        emit Approval(msg.sender, spender, tokens);
        ApproveAndCallFallBack(spender).receiveApproval(msg.sender, tokens, this, data);
        return true;
    }


    // ------------------------------------------------------------------------
    // Don't accept ETH
    // ------------------------------------------------------------------------
    function () public payable {
        revert();
    }


    // ------------------------------------------------------------------------
    // Owner can transfer out any accidentally sent ERC20 tokens
    // ------------------------------------------------------------------------
    function transferAnyERC20Token(address tokenAddress, uint tokens) public onlyOwner returns (bool success) {
        return ERC20Interface(tokenAddress).transfer(owner, tokens);
    }

    function getCreditedOwners(uint loanID) view public returns(address[]) {
        return creditedOwner[loanID];
    }
}
