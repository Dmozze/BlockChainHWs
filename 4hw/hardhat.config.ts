import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import '@typechain/hardhat'
import "@uniswap/hardhat-v3-deploy";

const CHAIN_IDS = {
    hardhat: 31337, // chain ID for hardhat testing
};

const config: HardhatUserConfig = {
  solidity: "0.8.14",
    networks: {
        hardhat: {
            chainId: CHAIN_IDS.hardhat,
            forking: {
                // Using Alchemy
                url: `https://eth-mainnet.alchemyapi.io/v2/${"ZEZye0TRwdKzjfbXJMtFTANtF_qaGc5M"}`, // url to RPC node, ${ALCHEMY_KEY} - must be your API key
                blockNumber: 12821000, // a specific block number with which you want to work
            },
        },
        // ... you can also add more necessary information to your config
    }
};

export default config;
