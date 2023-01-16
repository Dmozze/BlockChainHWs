// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Callee.sol";
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol';



import "hardhat/console.sol";


contract FlashSwap is IUniswapV2Callee {

    address private constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address private constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address private constant LINK = 0x514910771AF9Ca656af840dff83E8264EcF986CA;
    address  private immutable pairDaiWeth = 0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11;

    address  private constant UNISWAP_V2_ROUTER = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;


    IUniswapV2Router02 private immutable uniswapV2Router;

    IERC20 private constant weth = IERC20(WETH);



    constructor() {
        uniswapV2Router = IUniswapV2Router02(UNISWAP_V2_ROUTER);
    }

    function flashSwap(uint wethAmount) external {
        console.log("FlashSwap::flashSwap()");
        bytes memory data = abi.encode(WETH, msg.sender);
        IUniswapV2Pair(pairDaiWeth).swap(wethAmount, 0, address(this), data);
        console.log(1);
    }

    // This function is called by the DAI/WETH pair contract
    function uniswapV2Call(
        address sender,
        uint amount0,
        uint amount1,
        bytes calldata data
    ) external {
        console.log("FlashSwap::uniswapV2Call()");

        require(msg.sender == address(pairDaiWeth), "not pair");
        require(sender == address(this), "not sender");

        (address tokenBorrow, address caller) = abi.decode(data, (address, address));
        require(tokenBorrow == WETH, "token borrow != WETH");

        uint256 amountToRepayWithFee = CalcAmountWithoutFee(amount1);

        // WETH -> LINK
        uint256[] memory amounts = uniswapV2Router.swapExactTokensForTokens(
            amount1,
            0,
            getPathForWethToLink(),
            address(this),
            block.timestamp
        );

        // LINK -> DAI
        amounts = uniswapV2Router.swapExactTokensForTokens(
            amounts[1],
            0,
            getPathForLinkToDai(),
            address(this),
            block.timestamp
        );

        // DAI -> WETH

        amounts = uniswapV2Router.swapExactTokensForTokens(
            amounts[1],
            0,
            getPathForDaiToWeth(),
            address(this),
            block.timestamp
        );

        // calculate profit
        uint256 profit = amounts[1] - amountToRepayWithFee;
        console.log("profit: %s", profit);
        if (profit > 0) {
            weth.transfer(caller, profit);
            weth.transfer(address(pairDaiWeth), amountToRepayWithFee);
        } else {
            revert("no profit");
        }

        //        // Transfer flash swap fee from caller
        //        weth.transferFrom(caller, address(this), amountToRepayWithFee - amount0);
        //        // Repay
        //        weth.transfer(address(pairDaiWeth), amountToRepayWithFee);
    }

    function getPathForWethToLink() private pure returns (address[] memory) {
        address[] memory path = new address[](2);
        path[0] = WETH;
        path[1] = LINK;

        return path;
    }

    function getPathForLinkToDai() private pure returns (address[] memory) {
        address[] memory path = new address[](2);
        path[0] = LINK;
        path[1] = DAI;

        return path;
    }

    function getPathForDaiToWeth() private pure returns (address[] memory) {
        address[] memory path = new address[](2);
        path[0] = DAI;
        path[1] = WETH;

        return path;
    }



    function CalcAmountWithoutFee(uint amount) internal view returns (uint) {
        return (amount * 997) / 1000;
    }

    function CalcAmountOut(uint amountIn, uint reserveIn, uint reserveOut) internal view returns (uint) {
        uint amountInWithFee = CalcAmountWithoutFee(amountIn);
        uint numerator = amountInWithFee * reserveOut;
        uint denominator = reserveIn + amountInWithFee;
        return numerator / denominator;
    }
}