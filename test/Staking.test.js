const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StakingContract", () => {
  let x1coin, staking, owner, user;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();
    
    // Deploy X1Coin
    const X1Coin = await ethers.getContractFactory("X1Coin");
    x1coin = await X1Coin.deploy();
    await x1coin.waitForDeployment();

    // Deploy StakingContract
    const Staking = await ethers.getContractFactory("StakingContract");
    staking = await Staking.deploy(await x1coin.getAddress());
    await staking.waitForDeployment();

    // Fund user with tokens
    const amount = ethers.parseUnits("10000", 18);
    await x1coin.distributeCommunityTokens(user.address, amount);
    await x1coin.connect(user).approve(staking.getAddress(), amount);

    // Fund staking contract with rewards
    const rewardsAmount = ethers.parseUnits("100000", 18);
    await x1coin.distributeCommunityTokens(await staking.getAddress(), rewardsAmount);

    await x1coin.distributeCommunityTokens(
        await staking.getAddress(),
        ethers.parseUnits("100000", 18)
    );
  });

  describe("Staking", () => {
    it("Should stake tokens successfully", async () => {
      const stakeAmount = ethers.parseUnits("1000", 18);
      await staking.connect(user).stake(stakeAmount);
      
      const stakeInfo = await staking.stakes(user.address);
      expect(stakeInfo.amount).to.equal(stakeAmount);
    });

    it("Should prevent zero amount staking", async () => {
      await expect(
        staking.connect(user).stake(0)
      ).to.be.revertedWith("Cannot stake 0");
    });

    it("Should prevent multiple stakes", async () => {
      const stakeAmount = ethers.parseUnits("1000", 18);
      await staking.connect(user).stake(stakeAmount);
      
      await expect(
        staking.connect(user).stake(stakeAmount)
      ).to.be.revertedWith("Existing stake");
    });
  });

  describe("Unstaking", () => {
    beforeEach(async () => {
      const stakeAmount = ethers.parseUnits("1000", 18);
      await staking.connect(user).stake(stakeAmount);
    });

    it("Should unstake with rewards", async () => {
      const stakeAmount = ethers.parseUnits("1000", 18);
  
      // Get initial balance
      const balanceBefore = await x1coin.balanceOf(user.address);
  
      // Verify stake exists
      const newStake = await staking.stakes(user.address);
      expect(newStake.exists).to.be.true;
  
      // Fast forward 365 days
      const timeElapsed = 365 * 24 * 60 * 60 + 5;
      await ethers.provider.send("evm_increaseTime", [timeElapsed]);
      await ethers.provider.send("evm_mine");
  
      // Unstake
      await staking.connect(user).unstake();
      const balanceAfter = await x1coin.balanceOf(user.address);
  
      // Verify stake removal
      const finalStake = await staking.stakes(user.address);
      expect(finalStake.exists).to.be.false;
  
      // Calculate expected reward and total using precise math
      const rewardRate = 10n;
      const reward = (BigInt(stakeAmount) * rewardRate * BigInt(timeElapsed)) / (BigInt(365 * 24 * 60 * 60) * 100n);
      const expectedTotal = BigInt(stakeAmount) + reward;
  
      // Assert balances with tolerance for precision errors
      const actualDifference = BigInt(balanceAfter) - BigInt(balanceBefore);
      expect(actualDifference).to.be.closeTo(expectedTotal, expectedTotal / 10000n);
    });
  

    it("Should prevent early unstaking", async () => {
      await expect(
        staking.connect(user).unstake()
      ).to.be.revertedWith("Locked");
    });

    it("Should clear stake after unstaking", async () => {
      await ethers.provider.send("evm_increaseTime", [30 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      await staking.connect(user).unstake();
      const stakeInfo = await staking.stakes(user.address);
      expect(stakeInfo.amount).to.equal(0);
    });
  });

  describe("Reward Calculation", () => {
    it("Should calculate correct rewards", async () => {
        const stakeAmount = ethers.parseUnits("1000", 18);
        await staking.connect(user).stake(stakeAmount);
    
        // Fast forward exactly 180 days
        await ethers.provider.send("evm_increaseTime", [180 * 24 * 60 * 60]);
        await ethers.provider.send("evm_mine");
    
        const userBalanceBefore = await x1coin.balanceOf(user.address);
        await staking.connect(user).unstake();
        const userBalanceAfter = await x1coin.balanceOf(user.address);
    
        // Calculate expected reward precisely
        const expectedReward = (stakeAmount * 10n * 180n * 24n * 60n * 60n) / 
                              (365n * 24n * 60n * 60n * 100n);
        
        const expectedTotal = stakeAmount + expectedReward;

        const tolerance = ethers.parseUnits("1", 16); // 0.01 token tolerance
        expect(userBalanceAfter - userBalanceBefore)
        .to.be.closeTo(expectedTotal, tolerance);
    });
  });
});