// frontend/src/constants/contracts.ts
import TokenArtifact from '/Users/sayan/Desktop/x1_bkend/artifacts/contracts/X1Coin.sol/X1Coin.json';
import StakingArtifact from '/Users/sayan/Desktop/x1_bkend/artifacts/contracts/StakingContract.sol/StakingContract.json';

export const CONTRACTS = {
  Token: {
    artifact: TokenArtifact,
    address: ''
  },
  Staking: {
    artifact: StakingArtifact,
    address: ''
  }
};