pragma solidity ^0.4.18;

//Access control by CEO
contract Secure {
    address public ceoAddress;

    event Event_SetCEO(address _newCEO);

    // @dev Access modifier for CEO-only functionality
    modifier onlyCEO() {
        require(msg.sender == ceoAddress);
        _;
    }

     modifier onlyCLevel() {
        require(
            msg.sender == ceoAddress
        );
        _;
    }

    // @dev Assigns a new address to act as the CEO. Only available to the current CEO.
    // @param _newCEO The address of the new CEO
    function setCEO(address _newCEO) public onlyCEO {
        require(_newCEO != address(0));

        ceoAddress = _newCEO;

        emit Event_SetCEO(_newCEO);
    }
}
