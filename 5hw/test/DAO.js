const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const {anyValue} = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const {expect} = require("chai");
const {ethers} = require("hardhat");

async function deployDAO() {
    const [owner, userA, userB, userC] = await ethers.getSigners();
    const DAO = await ethers.getContractFactory("DAO");
    const dao = await DAO.deploy();
    await dao.deployed();
    return {dao, owner, userA, userB, userC};
}

const HASH = 12312;


describe("base DAO", function () {


    it("deploy", async function () {
        const {dao} = await deployDAO();
        expect(await dao.totalSupply()).to.equal(100);
    });

    it("decimals", async function () {
        const {dao} = await deployDAO();
        expect(await dao.decimals()).to.equal(6);
    });

    it("create proposal + check ById search", async function () {
        const {dao, owner, userA} = await deployDAO();
        await dao.connect(userA).createProposal(12);
        expect(await dao.checkProposalInQueueById(0)).to.be.true;
        expect(await dao.checkProposalInQueueById(1)).to.be.false;
    });

    it("create proposal + check ByHash search", async function () {
        const {dao, owner, userA} = await deployDAO();
        await dao.connect(userA).createProposal(HASH);
        expect(await dao.checkProposalInQueueByHash(HASH)).to.be.true;
        expect(await dao.checkProposalInQueueByHash(HASH + 1)).to.be.false;
    });

    it("check capacity of queue", async function () {
        const {dao, owner, userA} = await deployDAO();
        await dao.connect(userA).createProposal(12);
        await dao.connect(userA).createProposal(13);
        await dao.connect(userA).createProposal(14);
        expect(await dao.checkProposalInQueueByHash(12)).to.be.true;
        expect(await dao.checkProposalInQueueByHash(13)).to.be.true;
        expect(await dao.checkProposalInQueueByHash(14)).to.be.true;
        expect(await dao.checkProposalInQueueByHash(15)).to.be.false;
        try {
            await dao.connect(userA).createProposal(15);
            expect(false).to.be.true;
        } catch (e) {
            expect(e.message).to.equal("VM Exception while processing transaction: reverted with reason string 'DAO: Too many proposals on voting'");
        }
    });
});

describe("Base voting", function () {

    it("Base Voting YES", async function () {
        const {dao, owner, userA, userB} = await deployDAO();
        const coinsTransfer = 12;
        await dao.transfer(userA.address, coinsTransfer);
        await dao.connect(userA).createProposal(HASH);
        await dao.connect(userA).vote(HASH, true);
        expect(await dao.checkProposalInQueueByHash(HASH)).to.be.true;
    });

    it("Base Voting NO", async function () {
        const {dao, owner, userA, userB} = await deployDAO();
        const coinsTransfer = 12;
        await dao.transfer(userA.address, coinsTransfer);
        await dao.connect(userA).createProposal(HASH);
        await dao.connect(userA).vote(HASH, false);
        expect(await dao.checkProposalInQueueByHash(HASH)).to.be.true;
        expect(await dao.noVotes(HASH)).to.equal(coinsTransfer);
    });

    it("Base Voting YES + NO", async function () {
        const {dao, owner, userA, userB} = await deployDAO();
        const coinsTransferA = 12;
        const coinsTransferB = 25;
        await dao.transfer(userA.address, coinsTransferA);
        await dao.transfer(userB.address, coinsTransferB);
        await dao.connect(userB).createProposal(HASH);
        await dao.connect(userA).vote(HASH, false);
        await dao.connect(userB).vote(HASH, true);
        expect(await dao.checkProposalInQueueByHash(HASH)).to.be.true;
        expect(await dao.yesVotes(HASH)).to.equal(coinsTransferB);
        expect(await dao.noVotes(HASH)).to.equal(coinsTransferA);
    });

    it("two accounts voting YES", async function () {
        const {dao, owner, userA, userB} = await deployDAO();
        const coinsTransferA = 12;
        const coinsTransferB = 25;
        await dao.transfer(userA.address, coinsTransferA);
        await dao.transfer(userB.address, coinsTransferB);
        await dao.connect(userB).createProposal(HASH);
        await dao.connect(userA).vote(HASH, true);
        await dao.connect(userB).vote(HASH, true);
        expect(await dao.checkProposalInQueueByHash(HASH)).to.be.true;
        expect(await dao.yesVotes(HASH)).to.equal(coinsTransferA + coinsTransferB);
        expect(await dao.noVotes(HASH)).to.equal(0);
    });

    it("accept proposal", async function () {
        const {dao, owner, userA, userB} = await deployDAO();
        const coinsTransferA = 25;
        const coinsTransferB = 26;
        await dao.transfer(userA.address, coinsTransferA);
        await dao.transfer(userB.address, coinsTransferB);
        await dao.connect(userB).createProposal(HASH);
        await dao.connect(userA).vote(HASH, true);
        expect(await dao.checkProposalInQueueByHash(HASH)).to.be.true;
        await dao.connect(userB).vote(HASH, true);
        expect(await dao.checkProposalInQueueByHash(HASH)).to.be.false;
        expect(await dao.proposalStatus(0)).to.equal(1);
    });

    it("reject proposal", async function () {
        const {dao, owner, userA, userB} = await deployDAO();
        const coinsTransferA = 25;
        const coinsTransferB = 26;
        await dao.transfer(userA.address, coinsTransferA);
        await dao.transfer(userB.address, coinsTransferB);
        await dao.connect(userB).createProposal(HASH);
        await dao.connect(userA).vote(HASH, false);
        expect(await dao.checkProposalInQueueByHash(HASH)).to.be.true;
        await dao.connect(userB).vote(HASH, false);
        expect(await dao.checkProposalInQueueByHash(HASH)).to.be.false;
        expect(await dao.proposalStatus(0)).to.equal(2);
        expect(await dao.checkProposalInQueueByHash(HASH)).to.be.false;
    });

    it("cancel proposal", async function () {
        const {dao, owner, userA, userB} = await deployDAO();
        const coinsTransferA = 25;
        const coinsTransferB = 26;
        await dao.transfer(userA.address, coinsTransferA);
        await dao.connect(userA).createProposal(HASH);
        await dao.connect(userA).vote(HASH, false);
        expect(await dao.checkProposalInQueueByHash(HASH)).to.be.true;
        await time.increase(86400 * 3 + 20);
        await dao.checkAndClearQueue();
        expect(await dao.checkProposalInQueueByHash(HASH)).to.be.false;
        expect(await dao.proposalStatus(0)).to.equal(0);
    });

    it("check reverting of voting", async function () {
        const {dao, owner, userA, userB} = await deployDAO();
        const coinsTransferA = 25;
        await dao.transfer(userA.address, coinsTransferA);
        await dao.connect(userA).createProposal(HASH);
        await dao.connect(userA).vote(HASH, false);
        expect(await dao.noVotes(HASH)).to.equal(coinsTransferA);
        await dao.connect(userA).revertVote(HASH);
        expect(await dao.noVotes(HASH)).to.equal(0);
        await dao.connect(userA).vote(HASH, false);
        expect(await dao.noVotes(HASH)).to.equal(coinsTransferA);
    });
});

describe("Transfer check", function () {
    it("base Transfer", async function () {
        const {dao, owner, userA, userB} = await deployDAO();
        const coinsTransfer = 12;
        await dao.transfer(userA.address, coinsTransfer);
        expect(await dao.balanceOf(userA.address)).to.equal(coinsTransfer);
    });

    it("Transfer with voting", async function () {
        const {dao, owner, userA, userB} = await deployDAO();
        const coinsTransfer = 12;
        await dao.transfer(userA.address, coinsTransfer);
        await dao.connect(userA).createProposal(HASH);
        await dao.connect(userA).vote(HASH, true);
        await dao.connect(userA).transfer(userB.address, coinsTransfer);
        expect(await dao.balanceOf(userA.address)).to.equal(0);
        expect(await dao.balanceOf(userB.address)).to.equal(coinsTransfer);
        expect(await dao.yesVotes(HASH)).to.equal(0);
    });

    it("Transfer with voting recipient side", async function () {
        const {dao, owner, userA, userB} = await deployDAO();
        const coinsTransferA = 12;
        const coinsTransferB = 25;
        await dao.transfer(userA.address, coinsTransferA);
        await dao.transfer(userB.address, coinsTransferB);
        await dao.connect(userA).createProposal(HASH);
        expect(await dao.checkProposalInQueueByHash(HASH)).to.be.true;

        await dao.connect(userB).vote(HASH, true);
        expect(await dao.yesVotes(HASH)).to.equal(coinsTransferB);
        expect(await dao.noVotes(HASH)).to.equal(0);
        await dao.connect(userA).transfer(userB.address, coinsTransferA);
        expect(await dao.yesVotes(HASH)).to.equal(coinsTransferB + coinsTransferA);
        expect(await dao.noVotes(HASH)).to.equal(0);
        expect(await dao.balanceOf(userA.address)).to.equal(0);
        expect(await dao.balanceOf(userB.address)).to.equal(coinsTransferB + coinsTransferA);

    });

    it("Transfer with voting both sides", async function () {
        const {dao, owner, userA, userB} = await deployDAO();
        const coinsTransferA = 12;
        const coinsTransferB = 25;
        await dao.transfer(userA.address, coinsTransferA);
        await dao.transfer(userB.address, coinsTransferB);
        await dao.connect(userA).createProposal(HASH);
        expect(await dao.checkProposalInQueueByHash(HASH)).to.be.true;
        await dao.connect(userA).vote(HASH, true);
        expect(await dao.yesVotes(HASH)).to.equal(coinsTransferA);
        expect(await dao.noVotes(HASH)).to.equal(0);
        await dao.connect(userB).vote(HASH, true);
        expect(await dao.yesVotes(HASH)).to.equal(coinsTransferA + coinsTransferB);
        expect(await dao.noVotes(HASH)).to.equal(0);
        await dao.connect(userA).transfer(userB.address, coinsTransferA);
        expect(await dao.yesVotes(HASH)).to.equal(coinsTransferB + coinsTransferA);
        expect(await dao.noVotes(HASH)).to.equal(0);
        expect(await dao.balanceOf(userA.address)).to.equal(0);
        expect(await dao.balanceOf(userB.address)).to.equal(coinsTransferB + coinsTransferA);
    });

});

describe("task from the statement", function () {
    it("main task with 25 / 40 / 35", async function () {
        const {dao, owner, userA, userB} = await deployDAO();
        const coinsTransferA = 25;
        const coinsTransferB = 40;
        const coinsTransferC = 35; // it is owner balance
        await dao.transfer(userA.address, coinsTransferA);
        await dao.transfer(userB.address, coinsTransferB);
        await dao.connect(userA).createProposal(HASH);
        expect(await dao.checkProposalInQueueByHash(HASH)).to.be.true;
        await dao.connect(userA).vote(HASH, true);
        expect(await dao.yesVotes(HASH)).to.equal(coinsTransferA);
        expect(await dao.noVotes(HASH)).to.equal(0);
        await dao.connect(userB).vote(HASH, true);
        expect(await dao.proposalStatus(0)).to.equal(1);
    });

    it("invert main task with 25 / 40 / 35", async function () {
        const {dao, owner, userA, userB} = await deployDAO();
        const coinsTransferA = 25;
        const coinsTransferB = 40;
        const coinsTransferC = 35; // it is owner balance
        const HASH = 12312;
        await dao.transfer(userA.address, coinsTransferA);
        await dao.transfer(userB.address, coinsTransferB);
        await dao.connect(userA).createProposal(HASH);
        expect(await dao.checkProposalInQueueByHash(HASH)).to.be.true;
        await dao.connect(userA).vote(HASH, false);
        expect(await dao.noVotes(HASH)).to.equal(coinsTransferA);
        expect(await dao.yesVotes(HASH)).to.equal(0);
        await dao.connect(userB).vote(HASH, false);
        expect(await dao.proposalStatus(0)).to.equal(2);
    });

    it("accepted with one more vote", async function () {
        const {dao, owner, userA, userB} = await deployDAO();
        const coinsTransferA = 50;
        const coinsTransferB = 50;
        await dao.transfer(userA.address, coinsTransferA);
        await dao.transfer(userB.address, coinsTransferB);
        await dao.connect(userA).createProposal(HASH);
        expect(await dao.checkProposalInQueueByHash(HASH)).to.be.true;
        await dao.connect(userA).vote(HASH, true);
        expect(await dao.yesVotes(HASH)).to.equal(coinsTransferA);
        expect(await dao.noVotes(HASH)).to.equal(0);
        await dao.connect(userB).transfer(userA.address, 1);
        expect(await dao.proposalStatus(0)).to.equal(1);
    });

    it("1 vote to accepted", async function () {
        const {dao, owner, userA, userB} = await deployDAO();
        const coinsTransferA = 49;
        const coinsTransferB = 50;
        await dao.transfer(userA.address, coinsTransferA);
        await dao.transfer(userB.address, coinsTransferB);
        await dao.connect(userA).createProposal(HASH);
        expect(await dao.checkProposalInQueueByHash(HASH)).to.be.true;
        await dao.connect(userA).vote(HASH, true);
        await dao.connect(userB).vote(HASH, false);
        expect(await dao.proposalStatus(0)).to.equal(3);
        expect(await dao.yesVotes(HASH)).to.equal(coinsTransferA);
        expect(await dao.noVotes(HASH)).to.equal(coinsTransferB);
        await dao.connect(userB).transfer(userA.address, 1);
        expect(await dao.yesVotes(HASH)).to.equal(coinsTransferA + 1);
        expect(await dao.noVotes(HASH)).to.equal(coinsTransferB - 1);
    });
});