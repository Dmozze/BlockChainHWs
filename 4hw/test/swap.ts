import {expect} from "chai";
import {ethers} from "hardhat";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {MNYToken, MNYToken__factory, WRKToken, WRKToken__factory} from "../typechain-types";
import {Contract} from "ethers";



describe("Token contract", function () {

    let moneyToken: MNYToken;
    let workToken: WRKToken;
    let swapContract: Contract;
    let pairContract: Contract;
    let owner_money: SignerWithAddress;
    let owner_work: SignerWithAddress;
    let owner_swap: SignerWithAddress;
    let address_swap;


    beforeEach(async function () {

        [owner_money, owner_work, owner_swap] = await ethers.getSigners();

        const moneyTokenFactory = (await ethers.getContractFactory(
            "MoneyToken", owner_money
        )) as MNYToken__factory;
        const totalSupply_money = (10 ** 10).toString()
        const change_token = (10 ** 10 / 2).toString()
        moneyToken = await moneyTokenFactory.deploy(
            ethers.utils.parseEther(totalSupply_money),
        )


        const workTokenFactory = (await ethers.getContractFactory(
            "WorkToken", owner_work
        )) as WRKToken__factory;
        const totalSupply_work = (10 ** 10).toString()
        workToken = await workTokenFactory.deploy(
            ethers.utils.parseEther(totalSupply_work),
        )

        await workToken.connect(owner_work).transfer(await owner_money.getAddress(), ethers.utils.parseEther(change_token),);

        await moneyToken.connect(owner_money).transfer(await owner_work.getAddress(), ethers.utils.parseEther(change_token),);


        const compiledUniswapFactory = require("@uniswap/v2-core/build/UniswapV2Factory.json");
        swapContract = await new ethers.ContractFactory(compiledUniswapFactory.interface, compiledUniswapFactory.bytecode, owner_swap).deploy(await owner_swap.getAddress());

        await swapContract.createPair(moneyToken.address, workToken.address);
        address_swap = await swapContract.getPair(moneyToken.address, workToken.address);
        const compiledPairFactory = require("@uniswap/v2-core/build/IUniswapV2Pair.json");
        pairContract = await new ethers.ContractFactory(compiledPairFactory.interface, compiledPairFactory.bytecode, owner_swap).attach(address_swap);

        console.log("BEFOREEACH balance of 1st address for two tokens is " + await moneyToken.balanceOf(owner_money.address) + " " + await workToken.balanceOf(owner_money.address))
        console.log("BEFOREEACH balance of 2nd address for two tokens is " + await moneyToken.balanceOf(owner_work.address) + " " + await workToken.balanceOf(owner_work.address))

    });

    describe("SWAP", function () {

        it("MAKING IT", async function () {
            expect(moneyToken.address).to.equal(await pairContract.token0())
            await workToken.connect(owner_money).transfer(await pairContract.address, ethers.utils.parseEther((10 ** 10 / 2).toString()),)
            await moneyToken.connect(owner_money).transfer(await pairContract.address, ethers.utils.parseEther((10 ** 10 / 2).toString()),)
            await pairContract.connect(owner_money).mint(owner_money.address)
            console.log("pool tokens is for 1_st address (it's about successful minting) " + await pairContract.getReserves())
            console.log("balance of 2nd address for two tokens is " + await moneyToken.balanceOf(owner_work.address) + " " + await workToken.balanceOf(owner_work.address))
            await moneyToken.connect(owner_work).transfer(pairContract.address, ethers.utils.parseEther((10 ** 10 / 2).toString()),)
            console.log("balance of 2nd address for two tokens is " + await moneyToken.balanceOf(owner_work.address) + " " + await workToken.balanceOf(owner_work.address))
            await pairContract.connect(owner_work).swap(0, ethers.utils.parseEther((10 ** 10 / 4.01).toString()), owner_work.address,"0x")
            console.log("balance of 2nd address for two tokens is " + await moneyToken.balanceOf(owner_work.address) + " " + await workToken.balanceOf(owner_work.address))
        });


    });
});