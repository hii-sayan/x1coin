// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract X1Coin is ERC20, Ownable {
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18;
    uint256 public constant PUBLIC_SALE_ALLOCATION = TOTAL_SUPPLY * 50 / 100;
    uint256 public constant TEAM_ALLOCATION = TOTAL_SUPPLY * 30 / 100;
    uint256 public constant COMMUNITY_ALLOCATION = TOTAL_SUPPLY * 20 / 100;

    uint256 public immutable unlockTime;
    uint256 private _communityReleased;

    event TokensDistributed(address indexed to, uint256 amount);
    event TeamTokensUnlocked(address indexed to, uint256 amount);

    constructor() 
        ERC20("X1Coin", "X1C") 
        Ownable() 
    {
        _mint(msg.sender, PUBLIC_SALE_ALLOCATION);
        _mint(address(this), TEAM_ALLOCATION + COMMUNITY_ALLOCATION);
        unlockTime = block.timestamp + 180 days;
    }

    function decimals() public pure override returns (uint8) {
        return 18;
    }

    function distributeCommunityTokens(address to, uint256 amount) external onlyOwner {
        require(_communityReleased + amount <= COMMUNITY_ALLOCATION, "Exceeds community allocation");
        _communityReleased += amount;
        _transfer(address(this), to, amount);
        emit TokensDistributed(to, amount); 
    }

    function unlockTeamTokens(address to) external onlyOwner {
        require(block.timestamp >= unlockTime, "Team tokens locked");
        _transfer(address(this), to, TEAM_ALLOCATION);
        emit TeamTokensUnlocked(to, TEAM_ALLOCATION); 
    }

    function remainingLockTime() public view returns (uint256) {
        return unlockTime > block.timestamp ? unlockTime - block.timestamp : 0;
    }

    function approve(address spender, uint256 amount) public override returns (bool) {
        _approve(_msgSender(), spender, amount);
        return true;
    }
}