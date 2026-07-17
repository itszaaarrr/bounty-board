require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    // Armchain Local Development
    armchainLocal: {
      url: process.env.ARMCHAIN_LOCAL_RPC || "http://127.0.0.1:8545",
      chainId: 888,
      accounts: process.env.DEPLOYER_PRIVATE_KEY 
        ? [process.env.DEPLOYER_PRIVATE_KEY] 
        : [],
    },
    // Armchain Testnet
    armchainTestnet: {
      url: process.env.ARMCHAIN_TESTNET_RPC || "https://testnet-rpc.armchain.io",
      chainId: 889,
      accounts: process.env.DEPLOYER_PRIVATE_KEY 
        ? [process.env.DEPLOYER_PRIVATE_KEY] 
        : [],
    },
    // Armchain Mainnet
    armchain: {
      url: process.env.ARMCHAIN_RPC || "https://rpc.armchain.org",
      chainId: 1339,
      accounts: process.env.DEPLOYER_PRIVATE_KEY 
        ? [process.env.DEPLOYER_PRIVATE_KEY] 
        : [],
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
