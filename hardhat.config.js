require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-chai-matchers");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545", // Localhost network URL
    },
    // You can add other networks here (e.g., Goerli, Mainnet, etc.)
  },
  paths: {
    artifacts: "./artifacts", // Path to the artifacts directory
  },
};