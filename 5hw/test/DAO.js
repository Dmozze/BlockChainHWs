const {
    time,
    loadFixture,
} = require('@nomicfoundation/hardhat-network-helpers');
const { anyValue } = require('@nomicfoundation/hardhat-chai-matchers/withArgs');
const { expect } = require('chai');
const {ethers} = require("hardhat");

describe('DAO', function () {

    const TOTAL_SUPPLY = 100;

    const AmountA = 25;
    const AmountB = 40;

    async function deployDAOFixture() {
        const [owner, AccountA, AccountB] = await ethers.getSigners();

        const DAO = await ethers.getContractFactory('DAO');
        const dao = await DAO.deploy(TOTAL_SUPPLY);

        return { dao, owner, AccountA, AccountB };
    }

    describe('Deployment', function () {
        it(`Should mint only ${TOTAL_SUPPLY} coins`, async function () {
            const { dao, owner } = await loadFixture(deployDAOFixture);

            expect(await dao.totalSupply()).to.equal(TOTAL_SUPPLY);
        });

        it('Should mint coins to owner', async function () {
            const { dao, owner } = await loadFixture(deployDAOFixture);

            expect(await dao.balanceOf(owner.address)).to.equal(TOTAL_SUPPLY);
        });
    });

    describe('Transfer', function () {

        it('Should transfer coins between accounts', async function () {
            const { dao, owner, AccountA, AccountB } = await loadFixture(deployDAOFixture);

            await dao.transfer(AccountA.address, AmountA);
            await dao.transfer(AccountB.address, AmountB);

            expect(await dao.balanceOf(AccountA.address)).to.equal(AmountA);
            expect(await dao.balanceOf(AccountB.address)).to.equal(AmountB);
        });
    });

    describe('Create Proposal', function () {

        it('Should create a proposal', async function () {
            const { dao, owner, AccountA, AccountB } = await loadFixture(deployDAOFixture);

            await dao.transfer(AccountA.address, AmountA);
            await dao.transfer(AccountB.address, AmountB);
            const hash =

            const id = await dao.createProposal(123);
            console.log(id['value'])

            expect(await dao.proposals(0)['amount']).to.equal(123);
        });
    });

    describe('Vote', function () {

            it('Should vote', async function () {
                const { dao, owner, AccountA, AccountB } = await loadFixture(deployDAOFixture);

                await dao.transfer(AccountA.address, AmountA);
                await dao.transfer(AccountB.address, AmountB);

                await dao.createProposal();

                await dao.vote(0, true);

                expect(await dao.votes(0)).to.equal(true);
            });

it('Should not vote twice', async function () {
                const { dao, owner, AccountA, AccountB } = await loadFixture(deployDAOFixture);

                await dao.transfer(AccountA.address, AmountA);
                await dao.transfer(AccountB.address, AmountB);

                await dao.createProposal();

                await dao.vote(0, true);

                expect(await dao.votes(0)).to.equal(true);
            });
    });

    // TODO: Test 25 / 35 / 40

});