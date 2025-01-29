import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACTS } from '../constants/contracts';

declare global {
  interface Window {
    ethereum?: any;
  }
}

const TokenManagement = () => {
  const [account, setAccount] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [tokenInfo, setTokenInfo] = useState({
    totalSupply: '0',
    publicSale: '0',
    teamAllocation: '0',
    communityAllocation: '0',
    remainingLockTime: '0'
  });
  const [distributionAmount, setDistributionAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const [account] = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        setAccount(account);
      }
    } catch (err: any) {
      setError('Failed to connect wallet: ' + err.message);
    }
  };

  const loadTokenInfo = async () => {
    if (!account) return;

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      const tokenContract = new ethers.Contract(
        CONTRACTS.Token.address,
        CONTRACTS.Token.artifact.abi,
        signer
      );

      // Get contract owner
      const owner = await tokenContract.owner();
      setIsOwner(owner.toLowerCase() === account.toLowerCase());

      // Get token info
      const [remainingLock, publicSale, teamAlloc, communityAlloc] = await Promise.all([
        tokenContract.remainingLockTime(),
        tokenContract.PUBLIC_SALE_ALLOCATION(),
        tokenContract.TEAM_ALLOCATION(),
        tokenContract.COMMUNITY_ALLOCATION()
      ]);

      setTokenInfo({
        totalSupply: ethers.utils.formatEther(await tokenContract.TOTAL_SUPPLY()),
        publicSale: ethers.utils.formatEther(publicSale),
        teamAllocation: ethers.utils.formatEther(teamAlloc),
        communityAllocation: ethers.utils.formatEther(communityAlloc),
        remainingLockTime: remainingLock.toString()
      });

    } catch (err: any) {
      setError('Failed to load token info: ' + err.message);
    }
  };

//   const handleDistributeCommunityTokens = async () => {
//     if (!isOwner || !distributionAmount || !recipientAddress) return;
  
//     try {
//       // Validate recipient address
//       if (!ethers.utils.isAddress(recipientAddress)) {
//         setError('Invalid recipient address format');
//         return;
//       }
  
//       // Convert to checksum address
//       const checksumAddress = ethers.utils.getAddress(recipientAddress);
      
//       setLoading(true);
//       const provider = new ethers.providers.Web3Provider(window.ethereum);
//       const signer = provider.getSigner();
      
//       const tokenContract = new ethers.Contract(
//         CONTRACTS.Token.address,
//         CONTRACTS.Token.artifact.abi,
//         signer
//       );
  
//       const amount = ethers.utils.parseEther(distributionAmount);
      
//       // Add explicit gas limit
//       const tx = await tokenContract.distributeCommunityTokens(checksumAddress, amount, {
//         gasLimit: 500000 // Adjust based on your contract's needs
//       });
      
//       await tx.wait();
//       await loadTokenInfo();
//       setDistributionAmount('');
//       setRecipientAddress('');
//     } catch (err: any) {
//       console.error('Full error:', err);
//       // Extract custom error message
//       const errorMessage = err.reason || err.message;
//       setError(`Distribution failed: ${errorMessage}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleUnlockTeamTokens = async () => {
//     if (!isOwner) return;

//     try {
//       setLoading(true);
//       const provider = new ethers.providers.Web3Provider(window.ethereum);
//       const signer = provider.getSigner();
      
//       const tokenContract = new ethers.Contract(
//         CONTRACTS.Token.address,
//         CONTRACTS.Token.artifact.abi,
//         signer
//       );

//       const tx = await tokenContract.unlockTeamTokens(account);
//       await tx.wait();

//       await loadTokenInfo();
//     } catch (err: any) {
//       setError('Failed to unlock team tokens: ' + err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

  useEffect(() => {
    if (account) {
      loadTokenInfo();
    }
  }, [account]);

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6">X1Coin Management</h1>
      
      {!account ? (
        <button
          onClick={connectWallet}
          className="w-full bg-blue-500 text-white p-2 rounded"
        >
          Connect Wallet
        </button>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <p>Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
            <p>Total Supply: {tokenInfo.totalSupply} X1C</p>
            <p>Public Sale Allocation: {tokenInfo.publicSale} X1C</p>
            <p>Team Allocation: {tokenInfo.teamAllocation} X1C</p>
            <p>Community Allocation: {tokenInfo.communityAllocation} X1C</p>
            <p>Remaining Lock Time: {(Number(tokenInfo.remainingLockTime) / 86400).toFixed(2)} days ({tokenInfo.remainingLockTime} seconds)</p>
          </div>

          {/* {isOwner && (
            <div className="space-y-4 border-t pt-4">
              <h2 className="text-xl font-semibold">Owner Actions</h2>
              
              <div className="space-y-2">
                <h3 className="font-medium">Distribute Community Tokens</h3>
                <input
                    type="text"
                    value={recipientAddress}
                    onChange={(e) => {
                        const addr = e.target.value;
                        if (ethers.utils.isAddress(addr)) {
                        setRecipientAddress(ethers.utils.getAddress(addr));
                        } else {
                        setRecipientAddress(addr);
                        }
                    }}
                    placeholder="Recipient address"
                    className="w-full p-2 border rounded"
                />
                <input
                  type="number"
                  value={distributionAmount}
                  onChange={(e) => setDistributionAmount(e.target.value)}
                  placeholder="Amount"
                  className="w-full p-2 border rounded"
                />
                <button
                  onClick={handleDistributeCommunityTokens}
                  disabled={loading || !distributionAmount || !recipientAddress}
                  className="w-full bg-green-500 text-white p-2 rounded"
                >
                  {loading ? 'Processing...' : 'Distribute Tokens'}
                </button>
              </div>

              <div>
                <h3 className="font-medium">Team Tokens</h3>
                <button
                  onClick={handleUnlockTeamTokens}
                  disabled={loading || Number(tokenInfo.remainingLockTime) > 0}
                  className="w-full bg-purple-500 text-white p-2 rounded mt-2"
                >
                  {loading ? 'Processing...' : 'Unlock Team Tokens'}
                </button>
              </div>
            </div>
          )} */}

          {error && (
            <div className="text-red-500 mt-4">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TokenManagement;