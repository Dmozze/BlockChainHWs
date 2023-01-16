const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("FlashSwap", function () {

    it("should flash swap", async function () {
        const FlashSwap = await ethers.getContractFactory("FlashSwap");
        const flashSwap = await FlashSwap.deploy();
        await flashSwap.deployed();
        const tx = await flashSwap.flashSwap(10000000000000);
    });
});