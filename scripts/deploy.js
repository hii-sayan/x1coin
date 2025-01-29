async function main() {
    // Get the contract factory
    const X1Coin = await ethers.getContractFactory("X1Coin");
    const StakingContract = await ethers.getContractFactory("StakingContract");

    // Deploy X1Coin first
    const x1coin = await X1Coin.deploy();
    await x1coin.waitForDeployment();
    const x1CoinAddress = await x1coin.getAddress();
    console.log(`X1Coin deployed to: ${x1CoinAddress}`);

    // Deploy StakingContract with X1Coin address as constructor argument
    const stakingcontract = await StakingContract.deploy(x1CoinAddress);
    await stakingcontract.waitForDeployment();
    const stakingAddress = await stakingcontract.getAddress();
    console.log(`StakingContract deployed to: ${stakingAddress}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});