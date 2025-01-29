const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("X1Coin", () => {
  let x1coin, owner, addr1, addr2;

  beforeEach(async () => {
    const X1Coin = await ethers.getContractFactory("X1Coin");
    [owner, addr1, addr2] = await ethers.getSigners();
    x1coin = await X1Coin.deploy();
    await x1coin.waitForDeployment();
  });

  describe("Deployment", () => {
    it("Should mint initial supply correctly", async () => {
      const totalSupply = await x1coin.totalSupply();
      expect(totalSupply).to.equal(ethers.parseUnits("1000000000", 18));
    });

    it("Should allocate 50% to owner", async () => {
      const ownerBalance = await x1coin.balanceOf(owner.address);
      expect(ownerBalance).to.equal(ethers.parseUnits("500000000", 18));
    });

    it("Should hold 50% in contract", async () => {
      const contractBalance = await x1coin.balanceOf(x1coin.getAddress());
      expect(contractBalance).to.equal(ethers.parseUnits("500000000", 18));
    });
  });

  describe("Community Distribution", () => {
    it("Should allow owner to distribute community tokens", async () => {
      const amount = ethers.parseUnits("100000", 18);
      await x1coin.distributeCommunityTokens(addr1.address, amount);
      
      const addr1Balance = await x1coin.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(amount);
    });

    it("Should prevent non-owners from distributing", async () => {
      const amount = ethers.parseUnits("100000", 18);
      await expect(
        x1coin.connect(addr1).distributeCommunityTokens(addr1.address, amount)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should prevent over-distribution", async () => {
      const excessAmount = ethers.parseUnits("200000001", 18);
      await expect(
          x1coin.distributeCommunityTokens(addr1.address, excessAmount)
      ).to.be.revertedWith("Exceeds community allocation"); 
    });
  });

  describe("Team Token Unlock", () => {
    it("Should unlock team tokens after 6 months", async () => {
      
      await ethers.provider.send("evm_increaseTime", [180 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      const teamAllocation = ethers.parseUnits("300000000", 18);
      await x1coin.unlockTeamTokens(addr1.address);
      
      const addr1Balance = await x1coin.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(teamAllocation);
    });

    it("Should prevent early unlocking", async () => {
      await expect(
        x1coin.unlockTeamTokens(addr1.address)
      ).to.be.revertedWith("Team tokens locked");
    });

    it("Should prevent non-owners from unlocking", async () => {
      await expect(
        x1coin.connect(addr1).unlockTeamTokens(addr1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("X1Coin - approve", function () {
    it("should allow the owner to approve a spender", async function () {
      const amount = ethers.parseUnits("100", 18); 

      await expect(x1coin.connect(owner).approve(addr1.address, amount))
          .to.emit(x1coin, "Approval")
          .withArgs(owner.address, addr1.address, amount);
      
      const allowance = await x1coin.allowance(owner.address, addr1.address);
      expect(allowance).to.equal(amount);
    });

    it("should allow spender to transfer tokens after approval", async function () {
      const amount = ethers.parseUnits("100", 18); // Use ethers.parseUnits

      await x1coin.connect(owner).approve(addr1.address, amount);

      // Spender transfers tokens to receiver
      await x1coin.connect(addr1).transferFrom(owner.address, addr2.address, amount);

      // Check balances
      const ownerBalance = await x1coin.balanceOf(owner.address);
      const receiverBalance = await x1coin.balanceOf(addr2.address);

      // Total supply in owner's hand 500,000,000 * 10^18
      const totalSupply = ethers.parseUnits("500000000", 18);

      
      expect(receiverBalance).to.equal(amount); // Receiver got 100 tokens
      expect(ownerBalance).to.equal(totalSupply - amount); // Owner's balance is reduced by 100 tokens
    });
  });

  
  describe("Additional Test Cases", () => {
    it("Should emit TokensDistributed event when distributing community tokens", async () => {
      const amount = ethers.parseUnits("100000", 18);
      await expect(x1coin.distributeCommunityTokens(addr1.address, amount))
        .to.emit(x1coin, "TokensDistributed")
        .withArgs(addr1.address, amount);
    });

    it("Should emit TeamTokensUnlocked event when unlocking team tokens", async () => {
    
      await ethers.provider.send("evm_increaseTime", [180 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      const teamAllocation = ethers.parseUnits("300000000", 18);
      await expect(x1coin.unlockTeamTokens(addr1.address))
        .to.emit(x1coin, "TeamTokensUnlocked")
        .withArgs(addr1.address, teamAllocation);
    });

    it("Should prevent transferring more than allowance", async () => {
      const amount = ethers.parseUnits("100", 18);
      const excessAmount = ethers.parseUnits("200", 18);

      // Approve spender
      await x1coin.connect(owner).approve(addr1.address, amount);

      // Attempt to transfer more than allowance
      await expect(
        x1coin.connect(addr1).transferFrom(owner.address, addr2.address, excessAmount)
      ).to.be.revertedWith("ERC20: insufficient allowance");
    });

    it("Should prevent transferring from zero address", async () => {
      const amount = ethers.parseUnits("100", 18);
      await expect(
        x1coin.connect(addr1).transferFrom(ethers.ZeroAddress, addr2.address, amount)
      ).to.be.revertedWith("ERC20: insufficient allowance");
    });
  });
});