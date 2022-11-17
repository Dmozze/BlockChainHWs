// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract WorkToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("Work", "WRK") {
        _mint(msg.sender, initialSupply);
    }
}