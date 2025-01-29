// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract StakingContract is ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    IERC20 public immutable stakingToken;
    uint256 public constant REWARD_RATE = 10; 
    uint256 public constant LOCK_PERIOD = 30 days;

    struct Stake {
        uint256 amount;
        uint256 startTime;
        bool exists;
    }

    mapping(address => Stake) public stakes;

    constructor(address tokenAddress) {
        stakingToken = IERC20(tokenAddress);
    }

    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot stake 0");
        require(!stakes[msg.sender].exists, "Existing stake");

        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        stakes[msg.sender] = Stake(amount, block.timestamp, true);
    }

    function unstake() external nonReentrant {
        Stake storage userStake = stakes[msg.sender];
        require(userStake.exists, "No stake");
        require(block.timestamp >= userStake.startTime + LOCK_PERIOD, "Locked");

        uint256 reward = Math.mulDiv(
            userStake.amount,
            REWARD_RATE * (block.timestamp - userStake.startTime),
            365 days * 100
        );

        uint256 totalAmount = userStake.amount + reward;
        delete stakes[msg.sender];
        stakingToken.safeTransfer(msg.sender, totalAmount);
    }
}