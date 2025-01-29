import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACTS } from '../constants/contracts';

declare global {
    interface Window {
        ethereum?: any;  
    }
}

const REWARD_RATE = 0.10; 
const STAKING_PERIOD = 30 * 24 * 60 * 60 * 1000; 

const StakingApp = () => {
    const [account, setAccount] = useState('');
    const [amount, setAmount] = useState('');
    const [balance, setBalance] = useState('0');
    const [stakeInfo, setStakeInfo] = useState({ amount: '0', exists: false, startTime: 0 });
    const [loading, setLoading] = useState(false);
    const [rewardAmount, setRewardAmount] = useState('0');
    const [canClaim, setCanClaim] = useState(false);

    const connectWallet = async () => {
        if (window.ethereum) {
            const [account] = await window.ethereum.request({ method: 'eth_requestAccounts' });
            setAccount(account);
        }
    };

    const loadData = async () => {
        if (!account) return;

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        const tokenContract = new ethers.Contract(
            CONTRACTS.Token.address,
            CONTRACTS.Token.artifact.abi,
            signer
        );

        const stakingContract = new ethers.Contract(
            CONTRACTS.Staking.address,
            CONTRACTS.Staking.artifact.abi,
            signer
        );

        const balance = await tokenContract.balanceOf(account);
        const stake = await stakingContract.stakes(account);

        setBalance(ethers.utils.formatEther(balance));
        const stakedAmount = ethers.utils.formatEther(stake.amount);
        const startTime = stake.startTime.toNumber() * 1000;

        setStakeInfo({ amount: stakedAmount, exists: stake.exists, startTime });

        // Calculate potential reward
        if (stake.exists) {
            const reward = parseFloat(stakedAmount) * REWARD_RATE;
            setRewardAmount(reward.toFixed(4));
            setCanClaim(Date.now() >= startTime + STAKING_PERIOD);
        }
    };

    const handleStake = async () => {
        try {
            setLoading(true);
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            const tokenContract = new ethers.Contract(
                CONTRACTS.Token.address,
                CONTRACTS.Token.artifact.abi,
                signer
            );

            const stakingContract = new ethers.Contract(
                CONTRACTS.Staking.address,
                CONTRACTS.Staking.artifact.abi,
                signer
            );

            const amountWei = ethers.utils.parseEther(amount);

            // Approve tokens
            const approveTx = await tokenContract.approve(CONTRACTS.Staking.address, amountWei);
            await approveTx.wait();

            // Stake tokens
            const stakeTx = await stakingContract.stake(amountWei);
            await stakeTx.wait();

            await loadData();
            setAmount('');
        } catch (error) {
            console.error('Staking error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUnstake = async () => {
        try {
            setLoading(true);
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            const stakingContract = new ethers.Contract(
                CONTRACTS.Staking.address,
                CONTRACTS.Staking.artifact.abi,
                signer
            );

            const tx = await stakingContract.unstake();
            await tx.wait();

            await loadData();
        } catch (error) {
            console.error('Unstaking error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClaimReward = async () => {
        try {
            setLoading(true);
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            const stakingContract = new ethers.Contract(
                CONTRACTS.Staking.address,
                CONTRACTS.Staking.artifact.abi,
                signer
            );

            const tx = await stakingContract.claimReward();
            await tx.wait();

            await loadData();
        } catch (error) {
            console.error('Reward claim error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (account) {
            loadData();
        }
    }, [account]);

    return (
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
            <h1 className="text-2xl font-bold mb-6">X1Coin Staking</h1>

            {!account ? (
                <button
                    onClick={connectWallet}
                    className="w-full bg-blue-500 text-white p-2 rounded"
                >
                    Connect Wallet
                </button>
            ) : (
                <div className="space-y-4">
                    <div>
                        <p>Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
                        <p>Balance: {balance} X1C</p>
                    </div>

                    {stakeInfo.exists ? (
                        <div>
                            <p>Staked Amount: {stakeInfo.amount} X1C</p>
                            <p>Potential Reward: {rewardAmount} X1C</p>
                            {canClaim ? (
                                <button
                                    onClick={handleClaimReward}
                                    disabled={loading}
                                    className="w-full bg-purple-500 text-white p-2 rounded mt-2"
                                >
                                    {loading ? 'Processing...' : 'Claim Reward'}
                                </button>
                            ) : (
                                <p className="text-gray-500">Rewards can be claimed after 30 days.</p>
                            )}
                            <button
                                onClick={handleUnstake}
                                disabled={loading}
                                className="w-full bg-red-500 text-white p-2 rounded mt-2"
                            >
                                {loading ? 'Processing...' : 'Unstake'}
                            </button>
                        </div>
                    ) : (
                        <div>
                            {/* <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Amount to stake"
                                className="w-full p-2 border rounded mb-2"
                            />
                            <button
                                onClick={handleStake}
                                disabled={loading || !amount}
                                className="w-full bg-green-500 text-white p-2 rounded"
                            >
                                {loading ? 'Processing...' : 'Stake'}
                            </button> */}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default StakingApp;
