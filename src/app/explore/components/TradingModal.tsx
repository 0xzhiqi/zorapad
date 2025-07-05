'use client';

import { useEffect, useState } from 'react';

import { tradeCoin } from '@zoralabs/coins-sdk';
import { AlertTriangle, ArrowDown, ArrowUp, CheckCircle, Wallet, X } from 'lucide-react';
import { useActiveAccount, useActiveWalletConnectionStatus } from 'thirdweb/react';
import { Address, createPublicClient, createWalletClient, custom, http, parseEther } from 'viem';
import { baseSepolia } from 'viem/chains';

import { Novel, formatNumber } from './types';

interface TradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  novel: Novel;
}

type TradeStep = {
  id: number;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
};

export default function TradingModal({ isOpen, onClose, novel }: TradingModalProps) {
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [isTrading, setIsTrading] = useState(false);
  const [tradeSteps, setTradeSteps] = useState<TradeStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [estimatedOutput, setEstimatedOutput] = useState<string>('');
  const [ethBalance, setEthBalance] = useState<string>('0');
  const [tokenBalance, setTokenBalance] = useState<string>('0');

  const account = useActiveAccount();
  const connectionStatus = useActiveWalletConnectionStatus();

  const erc20Abi = [
    {
      inputs: [{ name: '_owner', type: 'address' }],
      name: 'balanceOf',
      outputs: [{ name: 'balance', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
  ] as const;

  useEffect(() => {
    if (isOpen && account) {
      const fetchBalances = async () => {
        const publicClient = createPublicClient({
          chain: baseSepolia,
          transport: http(
            process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'
          ),
        });

        try {
          // Fetch ETH balance
          const ethBal = await publicClient.getBalance({
            address: account.address as Address,
          });
          setEthBalance((Number(ethBal) / 1e18).toFixed(4));

          // Fetch token balance if coin address exists
          if (novel.coinAddress) {
            const tokenBal = await publicClient.readContract({
              address: novel.coinAddress as Address,
              abi: erc20Abi,
              functionName: 'balanceOf',
              args: [account.address as Address],
            });
            setTokenBalance((Number(tokenBal) / 1e18).toFixed(4));
          }
        } catch (error) {
          console.error('Error fetching balances:', error);
          setEthBalance('0');
          setTokenBalance('0');
        }
      };
      fetchBalances();
    }
  }, [isOpen, account, novel.coinAddress]);

  if (!isOpen) return null;

  const initializeSteps = (type: 'buy' | 'sell') => {
    if (type === 'buy') {
      return [
        { id: 1, label: 'Preparing transaction', status: 'pending' as const },
        { id: 2, label: `Purchasing ${novel.coinSymbol}`, status: 'pending' as const },
        { id: 3, label: `Receiving ${novel.coinSymbol}`, status: 'pending' as const },
      ];
    } else {
      return [
        { id: 1, label: 'Preparing transaction', status: 'pending' as const },
        { id: 2, label: `Selling ${novel.coinSymbol}`, status: 'pending' as const },
        { id: 3, label: 'Receiving ETH', status: 'pending' as const },
      ];
    }
  };

  const updateStepStatus = (stepId: number, status: TradeStep['status']) => {
    setTradeSteps((prev) => prev.map((step) => (step.id === stepId ? { ...step, status } : step)));
  };

  const validateTradeParameters = () => {
    if (!novel.coinAddress || !amount || !account) {
      throw new Error('Please connect your wallet and enter an amount');
    }

    if (connectionStatus !== 'connected') {
      throw new Error('Please connect your wallet first');
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      throw new Error('Please enter a valid amount');
    }

    // Check if coin address is valid
    if (!novel.coinAddress.startsWith('0x') || novel.coinAddress.length !== 42) {
      throw new Error('Invalid coin address');
    }

    // Minimum amount check
    if (amountNum < 0.001) {
      throw new Error('Minimum amount is 0.001');
    }

    // Balance validation
    if (tradeType === 'buy' && amountNum > parseFloat(ethBalance)) {
      throw new Error(
        `Insufficient ETH balance. You have ${ethBalance} ETH but need ${amountNum} ETH`
      );
    }

    if (tradeType === 'sell' && amountNum > parseFloat(tokenBalance)) {
      throw new Error(
        `Insufficient ${novel.coinSymbol} balance. You have ${tokenBalance} ${novel.coinSymbol} but need ${amountNum} ${novel.coinSymbol}`
      );
    }
  };

  const handleTrade = async () => {
    setIsTrading(true);
    setError(null);
    setWarning(null);
    const steps = initializeSteps(tradeType);
    setTradeSteps(steps);

    // Create clients outside try block to avoid scope issues
    const rpcUrl = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(rpcUrl),
    });

    try {
      // Validate inputs
      validateTradeParameters();

      if (!account) {
        throw new Error('Please connect your wallet first');
      }

      const requiredAmount = parseEther(amount);
      const requiredInEth = Number(requiredAmount) / 1e18;

      console.log('ETH balance:', ethBalance, 'ETH');
      console.log('Token balance:', tokenBalance, novel.coinSymbol);
      console.log(
        'Required amount:',
        requiredInEth,
        tradeType === 'buy' ? 'ETH' : novel.coinSymbol
      );

      // Check if amount is too small
      if (requiredInEth < 0.001) {
        throw new Error('Minimum trade amount is 0.001');
      }

      // Create wallet client that works with Thirdweb's smart wallet
      const walletClient = createWalletClient({
        chain: baseSepolia,
        account: account.address as Address,
        transport: custom({
          async request({ method, params }) {
            console.log('Custom transport method:', method);

            if (method === 'eth_requestAccounts') {
              return [account!.address];
            }
            if (method === 'eth_accounts') {
              return [account!.address];
            }
            if (method === 'eth_sendTransaction') {
              const tx = params?.[0];
              if (!tx) throw new Error('No transaction provided');

              console.log('Sending transaction via Thirdweb:', tx);
              const result = await account!.sendTransaction({
                to: tx.to,
                value: tx.value ? BigInt(tx.value) : undefined,
                data: tx.data,
                gas: tx.gas ? BigInt(tx.gas) : undefined,
                gasPrice: tx.gasPrice ? BigInt(tx.gasPrice) : undefined,
                chainId: baseSepolia.id,
              });
              return result.transactionHash;
            }
            if (method === 'personal_sign' || method === 'eth_sign') {
              const message = params?.[0];
              if (!message) throw new Error('No message provided');
              return await account!.signMessage({ message });
            }
            if (method === 'eth_chainId') {
              return `0x${baseSepolia.id.toString(16)}`;
            }

            throw new Error(`Unsupported method: ${method}`);
          },
        }),
      });

      // Step 1: Prepare transaction
      updateStepStatus(1, 'active');

      console.log('Preparing trade transaction...');

      updateStepStatus(1, 'completed');

      // Step 2: Execute trade with better error handling
      updateStepStatus(2, 'active');

      // Validate the coin address first
      if (!novel.coinAddress || novel.coinAddress === '0x' || novel.coinAddress.length !== 42) {
        throw new Error(
          'Invalid or missing coin contract address. Please check if this coin exists on Base Sepolia.'
        );
      }

      // Use the correct single parameter structure that the SDK expects
      const tradeConfig = {
        tradeParameters: {
          sell:
            tradeType === 'buy'
              ? { type: 'eth' as const }
              : { type: 'erc20' as const, address: novel.coinAddress as Address },
          buy:
            tradeType === 'buy'
              ? { type: 'erc20' as const, address: novel.coinAddress as Address }
              : { type: 'eth' as const },
          amountIn: parseEther(amount),
          sender: account.address as Address,
        },
        walletClient,
        account: {
          address: account.address as Address,
          type: 'json-rpc' as const,
        },
        publicClient,
      };

      console.log('Trade config:', tradeConfig);
      console.log('Coin address being traded:', novel.coinAddress);
      console.log('Network:', baseSepolia.name);

      let result;
      try {
        result = await tradeCoin(tradeConfig);
        console.log('Trade result:', result);
      } catch (tradeError: any) {
        console.error('Detailed trade error:', tradeError);

        // More specific error handling
        if (tradeError.message?.includes('Quote failed') || tradeError.message?.includes('500')) {
          throw new Error(
            `Trading failed: This coin (${novel.coinAddress}) may not be tradeable on Base Sepolia yet, or there may be insufficient liquidity. Please verify the coin exists and has trading enabled.`
          );
        } else if (tradeError.message?.includes('network')) {
          throw new Error('Network error. Please check your connection and try again.');
        } else if (tradeError.message?.includes('rejected')) {
          throw new Error('Transaction was rejected by user.');
        } else {
          throw new Error(`Trading failed: ${tradeError.message || 'Unknown error occurred'}`);
        }
      }

      console.log('Trade result:', result);

      // Step 3: Completion
      updateStepStatus(2, 'completed');
      updateStepStatus(3, 'active');

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: result.hash,
      });

      console.log('Transaction confirmed:', receipt);

      updateStepStatus(3, 'completed');

      // Close modal after successful trade
      setTimeout(() => {
        setIsTrading(false);
        onClose();
        setTradeSteps([]);
        setWarning(null);
        setEstimatedOutput('');
      }, 2000);
    } catch (error: any) {
      console.error('Trading error:', error);

      let errorMessage = 'Trading failed. Please try again.';

      // Handle specific error cases
      if (error.message?.includes('Quote failed') || error.message?.includes('500')) {
        errorMessage =
          'This coin cannot be traded yet. It may not exist on Base Sepolia, lack liquidity, or trading may not be enabled. Please verify the coin contract address.';
      } else if (
        error.message?.includes('insufficient') ||
        error.message?.includes('Insufficient')
      ) {
        errorMessage = error.message; // Use the specific insufficient balance message
      } else if (error.message?.includes('User rejected')) {
        errorMessage = 'Transaction was rejected by user.';
      } else if (error.message?.includes('Invalid coin address')) {
        errorMessage = 'Invalid coin contract address.';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);

      // Mark current active step as error
      const activeStep = tradeSteps.find((step) => step.status === 'active');
      if (activeStep) {
        updateStepStatus(activeStep.id, 'error');
      }

      setIsTrading(false);
    }
  };

  const resetModal = () => {
    setTradeSteps([]);
    setError(null);
    setWarning(null);
    setIsTrading(false);
    setEstimatedOutput('');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  // Function to estimate output without executing trade (simplified)
  const estimateOutput = async () => {
    if (!amount || !novel.coinAddress) return;

    try {
      // For now, we'll provide a simple estimation
      // In a real implementation, you might call a separate quote endpoint
      const inputAmount = parseFloat(amount);
      const estimatedRate = tradeType === 'buy' ? 1000 : 0.001; // Simple mock rate
      const estimated = inputAmount * estimatedRate;

      setEstimatedOutput((estimated * 1e18).toString());
      setError(null);
      setWarning(null);
    } catch (error) {
      console.error('Estimation error:', error);
      setEstimatedOutput('');
      if (amount && parseFloat(amount) > 0) {
        setWarning('Unable to estimate output. This is a simplified estimate.');
      }
    }
  };

  // Trigger estimation when amount or trade type changes
  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      const timeoutId = setTimeout(estimateOutput, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setEstimatedOutput('');
      setWarning(null);
    }
  }, [amount, tradeType]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-md">
        <div className="rounded-3xl border border-white/20 bg-gradient-to-br from-purple-900/95 via-blue-900/95 to-indigo-900/95 backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 p-6 pb-2">
            <div className="flex-1">
              <div className="flex justify-between">
                <h3 className="text-xl font-bold text-white">Trade {novel.coinSymbol}</h3>
                <button
                  onClick={handleClose}
                  className="rounded-full p-2 text-white/70 transition-all hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-white/70">{novel.coinName}</p>
              {!isTrading && (
                <div className="mt-2 flex items-center space-x-1 text-sm text-white/70">
                  <Wallet className="h-4 w-4" />
                  <span>
                    Balance:{' '}
                    <span className="font-semibold text-white">
                      {parseFloat(ethBalance).toFixed(4)} ETH
                    </span>
                    <span className="mx-2 text-white/50">•</span>
                    <span className="font-semibold text-white">
                      {parseFloat(tokenBalance).toFixed(2)} {novel.coinSymbol}
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Trading Interface */}
          <div className="space-y-6 p-6">
            {/* Warning Message */}
            {warning && (
              <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/20 p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-300" />
                  <p className="text-sm text-yellow-300">{warning}</p>
                </div>
              </div>
            )}

            {/* Progress Steps */}
            {tradeSteps.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-white/90">Transaction Progress</h4>
                <div className="space-y-3">
                  {tradeSteps.map((step) => (
                    <div key={step.id} className="flex items-center space-x-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                          step.status === 'completed'
                            ? 'border-green-400 bg-green-400 text-white'
                            : step.status === 'active'
                              ? 'border-blue-400 bg-blue-400 text-white'
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
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Trade Type Toggle */}
            {!isTrading && (
              <div className="flex rounded-2xl bg-white/10 p-1">
                <button
                  onClick={() => setTradeType('buy')}
                  className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    tradeType === 'buy'
                      ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-400 text-white shadow-lg'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <ArrowUp className="mr-2 inline h-4 w-4" />
                  Buy
                </button>
                <button
                  onClick={() => setTradeType('sell')}
                  className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    tradeType === 'sell'
                      ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-400 text-white shadow-lg'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <ArrowDown className="mr-2 inline h-4 w-4" />
                  Sell
                </button>
              </div>
            )}

            {/* Amount Input */}
            {!isTrading && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90">
                  Amount in {tradeType === 'buy' ? 'ETH' : novel.coinSymbol}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.001"
                    min="0.001"
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 focus:outline-none"
                  />
                </div>
                <div className="flex justify-between text-xs text-white/50">
                  <span>Minimum: 0.001 {tradeType === 'buy' ? 'ETH' : novel.coinSymbol}</span>
                  {estimatedOutput && (
                    <span className="text-green-400">
                      ≈ {(Number(estimatedOutput) / 1e18).toFixed(6)}{' '}
                      {tradeType === 'buy' ? novel.coinSymbol : 'ETH'}
                    </span>
                  )}
                </div>
                {/* Balance validation warnings */}
                {amount && parseFloat(amount) > 0 && (
                  <>
                    {tradeType === 'buy' && parseFloat(amount) > parseFloat(ethBalance) && (
                      <p className="text-sm text-red-400">Amount exceeds ETH balance.</p>
                    )}
                    {tradeType === 'sell' && parseFloat(amount) > parseFloat(tokenBalance) && (
                      <p className="text-sm text-red-400">
                        Amount exceeds {novel.coinSymbol} balance.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Market Info */}
            {!isTrading && novel.coinData && (
              <div className="space-y-3 rounded-xl bg-white/5 p-4">
                <h4 className="text-sm font-medium text-white/90">Market Information</h4>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div className="text-center">
                    <p className="text-white/60">Market Cap</p>
                    <p className="font-semibold text-white">
                      ${formatNumber(novel.coinData.marketCap)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-white/60">24h Volume</p>
                    <p className="font-semibold text-white">
                      ${formatNumber(novel.coinData.volume24h)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-white/60">Holders</p>
                    <p className="font-semibold text-white">{novel.coinData.uniqueHolders}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Trade Button */}
            {!isTrading && (
              <button
                onClick={handleTrade}
                disabled={
                  !amount ||
                  connectionStatus !== 'connected' ||
                  parseFloat(amount || '0') < 0.001 ||
                  (tradeType === 'buy' && parseFloat(amount || '0') > parseFloat(ethBalance)) ||
                  (tradeType === 'sell' && parseFloat(amount || '0') > parseFloat(tokenBalance))
                }
                className="w-full rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-400 px-6 py-4 font-semibold text-white shadow-lg transition-all hover:from-emerald-500 hover:via-teal-500 hover:to-blue-500 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
              >
                {connectionStatus !== 'connected'
                  ? 'Connect Wallet'
                  : `${tradeType === 'buy' ? 'Buy' : 'Sell'} ${novel.coinSymbol}`}
              </button>
            )}

            {/* Disclaimer */}
            <p className="text-center text-xs text-white/50">
              Investing involves risk. Please invest responsibly
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
