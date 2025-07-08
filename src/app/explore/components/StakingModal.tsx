'use client';

import { useEffect, useState, useMemo } from 'react';

import { AlertTriangle, CheckCircle, Wallet, X } from 'lucide-react';
import { prepareContractCall, sendTransaction, waitForReceipt } from 'thirdweb';
import { getContract } from 'thirdweb';
import { useActiveAccount, useActiveWallet, useActiveWalletConnectionStatus } from 'thirdweb/react';
import { Address, createPublicClient, http, parseEther } from 'viem';
import { baseSepolia } from 'viem/chains';

import { baseSepoliaChain, client } from '../../../lib/thirdweb';
import { Novel } from './types';

interface StakingModalProps {
  isOpen: boolean;
  onClose: () => void;
  novel: Novel;
}

type StakeStep = {
  id: number;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
};

export default function StakingModal({ isOpen, onClose, novel }: StakingModalProps) {
  const [amount, setAmount] = useState('');
  const [isStaking, setIsStaking] = useState(false);
  const [stakeSteps, setStakeSteps] = useState<StakeStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<string>('0');
  const [isSuccess, setIsSuccess] = useState(false);

  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const connectionStatus = useActiveWalletConnectionStatus();

  const erc20Abi = useMemo(() => [
    {
      inputs: [
        { name: '_spender', type: 'address' },
        { name: '_value', type: 'uint256' },
      ],
      name: 'approve',
      outputs: [{ name: '', type: 'bool' }],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [{ name: '_owner', type: 'address' }],
      name: 'balanceOf',
      outputs: [{ name: 'balance', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
  ] as const, []);

  const novelAbi = [
    {
      inputs: [{ internalType: 'uint256', name: '_amount', type: 'uint256' }],
      name: 'stake',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ] as const;

  useEffect(() => {
    if (isOpen && account && novel.coinAddress) {
      const fetchBalance = async () => {
        const publicClient = createPublicClient({
          chain: baseSepolia,
          transport: http(
            process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'
          ),
        });
        const balance = await publicClient.readContract({
          address: novel.coinAddress as Address,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [account.address as Address],
        });
        setWalletBalance((Number(balance) / 1e18).toFixed(4));
      };
      fetchBalance();
    }
  }, [isOpen, account, novel.coinAddress, erc20Abi]);

  if (!isOpen) return null;

  const initializeSteps = () => {
    return [
      { id: 1, label: `Transferring ${novel.coinSymbol} token`, status: 'pending' as const },
      { id: 2, label: `Staking ${novel.coinSymbol} token`, status: 'pending' as const },
      { id: 3, label: 'Finalising staking', status: 'pending' as const },
    ];
  };

  const updateStepStatus = (stepId: number, status: StakeStep['status']) => {
    setStakeSteps((prev) => prev.map((step) => (step.id === stepId ? { ...step, status } : step)));
  };

  const handleStake = async () => {
    setIsStaking(true);
    setError(null);
    const steps = initializeSteps();
    setStakeSteps(steps);

    if (!account || !wallet || !novel.coinAddress || !novel.novelAddress) {
      setError('Required information is missing. Please connect your wallet.');
      setIsStaking(false);
      return;
    }

    try {
      const amountInWei = parseEther(amount);

      // Get contract instances
      const tokenContract = getContract({
        client,
        chain: baseSepoliaChain,
        address: novel.coinAddress,
        abi: erc20Abi,
      });

      const novelContract = getContract({
        client,
        chain: baseSepoliaChain,
        address: novel.novelAddress,
        abi: novelAbi,
      });

      // Step 1: Approve
      updateStepStatus(1, 'active');
      const approveTransaction = prepareContractCall({
        contract: tokenContract,
        method: 'approve',
        params: [novel.novelAddress, amountInWei],
      });

      const approveResult = await sendTransaction({
        transaction: approveTransaction,
        account,
      });

      await waitForReceipt({
        client,
        chain: baseSepoliaChain,
        transactionHash: approveResult.transactionHash,
      });
      updateStepStatus(1, 'completed');

      // Step 2: Stake
      updateStepStatus(2, 'active');
      const stakeTransaction = prepareContractCall({
        contract: novelContract,
        method: 'stake',
        params: [amountInWei],
      });

      const stakeResult = await sendTransaction({
        transaction: stakeTransaction,
        account,
      });

      await waitForReceipt({
        client,
        chain: baseSepoliaChain,
        transactionHash: stakeResult.transactionHash,
      });
      updateStepStatus(2, 'completed');

      // Step 3: Save to DB
      updateStepStatus(3, 'active');
      const response = await fetch('/api/stake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          novelId: novel.id,
          amountStaked: amount,
          stakeTransactionHash: stakeResult.transactionHash,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to save stake to database.';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      updateStepStatus(3, 'completed');

      // Show success state
      setIsSuccess(true);
      setIsStaking(false);

      // Close modal and reset after 2 seconds
      setTimeout(() => {
        resetModal();
        onClose();
      }, 2000);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
      setError(errorMessage);
      stakeSteps.forEach((s) => updateStepStatus(s.id, 'error'));
      setIsStaking(false);
    }
  };

  const resetModal = () => {
    setStakeSteps([]);
    setError(null);
    setIsStaking(false);
    setIsSuccess(false);
    setAmount('');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-md">
        <div className="rounded-3xl border border-white/20 bg-gradient-to-br from-purple-900/95 via-blue-900/95 to-indigo-900/95 backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 p-6 pb-2">
            <div className="flex-1">
              <div className="flex justify-between">
                <h3 className="text-xl font-bold text-white">Stake {novel.coinSymbol}</h3>
                <button
                  onClick={handleClose}
                  className="rounded-full p-2 text-white/70 transition-all hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-white/70">{novel.coinName}</p>
              {!isStaking && !isSuccess && (
                <div className="mt-2 flex items-center space-x-1 text-sm text-white/70">
                  <Wallet className="h-4 w-4" />
                  <span>
                    Balance:{' '}
                    <span className="font-semibold text-white">
                      {parseFloat(walletBalance).toFixed(2)} {novel.coinSymbol}
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Staking Interface */}
          <div className="space-y-6 p-6">
            {/* Success State */}
            {isSuccess && (
              <div className="flex flex-col items-center space-y-4 py-8">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg">
                  <CheckCircle className="h-10 w-10 text-white" />
                </div>
                <h4 className="text-2xl font-bold text-white">Staked Successfully</h4>
                <p className="text-center text-sm text-white/70">
                  Your {amount} {novel.coinSymbol} tokens have been staked successfully
                </p>
              </div>
            )}

            {/* Progress Steps */}
            {stakeSteps.length > 0 && !isSuccess && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-white/90">Staking in Progress...</h4>
                <div className="space-y-3">
                  {stakeSteps.map((step) => (
                    <div key={step.id} className="flex items-center space-x-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                          step.status === 'completed'
                            ? 'border-emerald-400 bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-400 text-white'
                            : step.status === 'active'
                              ? 'border-blue-400 bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 text-white'
                              : step.status === 'error'
                                ? 'border-red-400 bg-red-400 text-white'
                                : 'border-white/30 text-white/50'
                        }`}
                      >
                        {step.status === 'completed' ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : step.status === 'active' ? (
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : step.status === 'error' ? (
                          <X className="h-4 w-4" />
                        ) : (
                          <span className="text-xs font-bold">{step.id}</span>
                        )}
                      </div>
                      <span
                        className={`text-sm ${
                          step.status === 'completed' || step.status === 'active'
                            ? 'text-white'
                            : step.status === 'error'
                              ? 'text-red-400'
                              : 'text-white/50'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/20 p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-300" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              </div>
            )}

            {/* Amount Input */}
            {!isStaking && !isSuccess && (
              <div>
                <label className="mb-4 block text-sm font-semibold text-white/90">
                  Staking Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.001"
                    min="0"
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 focus:outline-none"
                  />
                </div>
                {parseFloat(amount) > parseFloat(walletBalance) && (
                  <p className="mt-2 text-sm text-red-400">Amount exceeds balance.</p>
                )}
              </div>
            )}

            {/* Stake Button */}
            {!isStaking && !isSuccess && (
              <button
                onClick={handleStake}
                disabled={
                  !amount ||
                  parseFloat(amount) <= 0 ||
                  parseFloat(amount) > parseFloat(walletBalance) ||
                  connectionStatus !== 'connected'
                }
                className="w-full rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-400 px-6 py-4 font-semibold text-white shadow-lg transition-all hover:from-emerald-500 hover:via-teal-500 hover:to-blue-500 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
              >
                {connectionStatus !== 'connected' ? 'Connect Wallet' : 'Stake'}
              </button>
            )}

            {/* Disclaimer */}
            {!isSuccess && (
              <p className="text-center text-xs text-white/50">
                Stake to receive share of revenue from story
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
