// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MoneyToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("Money", "MNY") {
        _mint(msg.sender, initialSupply);
    }
}