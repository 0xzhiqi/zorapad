'use client';

import { useEffect, useState } from 'react';

import { DeployCurrency, createCoin } from '@zoralabs/coins-sdk';
import { BookOpen, Check, Loader2, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { createThirdwebClient, defineChain } from 'thirdweb';
import { deployContract } from 'thirdweb/deploys';
import { useActiveAccount } from 'thirdweb/react';
import { privateKeyToAccount } from 'thirdweb/wallets';
import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { baseSepolia } from 'viem/chains';

import { NOVEL_CONTRACT_ABI, NOVEL_CONTRACT_BYTECODE } from '@/constants/contracts/novel';

import { createInitialNovel, deleteNovel, updateNovelWithContract } from './actions';

// Create Thirdweb client
const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

const baseSepoliaChain = defineChain(84532);

interface ProgressStep {
  id: number;
  title: string;
  status: 'pending' | 'active' | 'completed' | 'error';
}

const LaunchNewNovelPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const account = useActiveAccount();

  const [formData, setFormData] = useState({
    novelTitle: '',
    coinName: '',
    coinSymbol: '',
    seekPublicFeedback: false,
  });

  const [isLaunching, setIsLaunching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentNovelId, setCurrentNovelId] = useState<string | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([
    { id: 1, title: 'Creating Novel Entry', status: 'pending' },
    { id: 2, title: 'Launching Coin', status: 'pending' },
    { id: 3, title: 'Deploying Contract', status: 'pending' },
    { id: 4, title: 'Finalising Details', status: 'pending' },
  ]);

  console.log('Session:', session);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/');
      return;
    }
  }, [session, status, router]);

  const updateStepStatus = (stepId: number, status: ProgressStep['status']) => {
    setProgressSteps((prev) =>
      prev.map((step) => (step.id === stepId ? { ...step, status } : step))
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    let processedValue = value;

    // Convert coinSymbol to uppercase automatically
    if (name === 'coinSymbol') {
      processedValue = value.toUpperCase();
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : processedValue,
    }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!account?.address) {
      setError('Please connect your wallet first');
      return;
    }

    if (!formData.novelTitle.trim() || !formData.coinName.trim() || !formData.coinSymbol.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.coinSymbol.length < 1 || formData.coinSymbol.length > 6) {
      setError('Coin symbol must be 1 - 6 uppercase letters only');
      return;
    }

    // Check if private key is available
    if (!process.env.NEXT_PUBLIC_PRIVATE_KEY) {
      setError('Deployment private key not configured');
      return;
    }

    setIsLaunching(true);
    setError('');

    // Reset progress steps
    setProgressSteps([
      { id: 1, title: 'Creating Novel Entry', status: 'pending' },
      { id: 2, title: 'Launching Coin', status: 'pending' },
      { id: 3, title: 'Deploying Contract', status: 'pending' },
      { id: 4, title: 'Finalising Details', status: 'pending' },
    ]);

    let novelId: string | null = null;
    let coinAddress: string | null = null;

    try {
      const smartWalletAddress = account.address;

      if (!smartWalletAddress) {
        throw new Error('Smart wallet address is not available');
      }

      // Step 1: Create initial novel entry
      updateStepStatus(1, 'active');
      const initialNovelResult = await createInitialNovel({
        title: formData.novelTitle,
        coinName: formData.coinName,
        coinSymbol: formData.coinSymbol.toUpperCase(),
        seekPublicFeedback: formData.seekPublicFeedback,
        owners: smartWalletAddress,
        payoutRecipient: smartWalletAddress,
        walletAddress: smartWalletAddress,
      });

      if (!initialNovelResult.success || !initialNovelResult.novel) {
        updateStepStatus(1, 'error');
        throw new Error(initialNovelResult.error || 'Failed to create novel entry');
      }

      novelId = initialNovelResult.novel.id;
      setCurrentNovelId(novelId);
      updateStepStatus(1, 'completed');

      // Step 2: Create coin with novel ID as IPFS URI
      updateStepStatus(2, 'active');

      const rpcUrl =
        process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://base-sepolia-rpc.publicnode.com';

      // Create viem clients for Zora SDK
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(rpcUrl),
      });

      // Create a wallet client that works with Thirdweb's smart wallet
      const walletClient = createWalletClient({
        chain: baseSepolia,
        account: account.address,
        transport: custom({
          async request({ method, params }) {
            console.log('Custom transport method:', method);

            if (method === 'eth_requestAccounts') {
              return [account.address];
            }
            if (method === 'eth_accounts') {
              return [account.address];
            }
            if (method === 'eth_sendTransaction') {
              const tx = params?.[0];
              if (!tx) throw new Error('No transaction provided');

              console.log('Sending transaction via Thirdweb:', tx);
              const result = await account.sendTransaction({
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
              return await account.signMessage({ message });
            }
            if (method === 'eth_chainId') {
              return `0x${baseSepolia.id.toString(16)}`;
            }

            throw new Error(`Unsupported method: ${method}`);
          },
        }),
      });

      // Prepare coin parameters with a proper IPFS URI
      const coinParams = {
        name: formData.coinName,
        symbol: formData.coinSymbol.toUpperCase(),
        uri: `ipfs://bafybeigoxzqzbnxsn35vq7lls3ljxdcwjafxvbvkivprsodzrptpiguysy` as const,
        payoutRecipient: smartWalletAddress,
        chainId: baseSepolia.id,
        currency: DeployCurrency.ETH,
      };

      console.log('Creating coin with novel ID as IPFS:', coinParams);

      // Create the coin using Zora SDK
      const coinResult = await createCoin(coinParams, walletClient, publicClient, {
        gasMultiplier: 120,
      });

      console.log('Coin created successfully:', coinResult);

      if (!coinResult.address) {
        throw new Error('Failed to get coin address from deployment result');
      }

      coinAddress = coinResult.address;
      updateStepStatus(2, 'completed');

      // Step 3: Deploy Novel contract using Thirdweb with private key wallet
      updateStepStatus(3, 'active');

      console.log('Deploying Novel contract with params:', {
        coinAddress: coinAddress,
        creatorAddress: smartWalletAddress,
      });

      try {
        // Create a private key account for deployment
        const deploymentAccount = privateKeyToAccount({
          client,
          privateKey: process.env.NEXT_PUBLIC_PRIVATE_KEY as `0x${string}`,
        });

        console.log('Using deployment account:', deploymentAccount.address);

        // Deploy the Novel contract using the private key account
        const contractAddress = await deployContract({
          client,
          chain: baseSepoliaChain,
          account: deploymentAccount,
          constructorParams: {
            _coinAddress: coinAddress,
            _creatorAddress: smartWalletAddress,
          },
          bytecode: NOVEL_CONTRACT_BYTECODE as `0x${string}`,
          abi: NOVEL_CONTRACT_ABI,
        });

        console.log('Contract deployment result:', contractAddress);

        if (!contractAddress) {
          throw new Error('Failed to get contract address from deployment result');
        }

        // The contractAddress should now be the actual contract address
        const finalContractAddress = contractAddress;
        console.log('Novel contract deployed successfully:', finalContractAddress);
        updateStepStatus(3, 'completed');

        // Step 4: Update novel with both coin and contract details
        updateStepStatus(4, 'active');

        const updateResult = await updateNovelWithContract({
          novelId: novelId,
          coinAddress: coinAddress,
          coinTransactionHash: coinResult.hash || '',
          novelAddress: finalContractAddress,
          novelContractTransactionHash: '', // We don't have the transaction hash from deployContract
        });

        if (!updateResult.success) {
          throw new Error(updateResult.error || 'Failed to update novel with contract details');
        }

        updateStepStatus(4, 'completed');
        setSuccess('Novel, coin, and contract launched successfully!');

        // Show success popup
        setShowSuccessPopup(true);

        // Redirect to novel page after 2 seconds
        setTimeout(() => {
          router.push(`/edit-novel/${novelId}`);
        }, 2000);
      } catch (contractError: any) {
        console.error('Contract deployment error:', contractError);
        updateStepStatus(3, 'error');
        throw new Error(`Contract deployment failed: ${contractError.message}`);
      }
    } catch (error: any) {
      console.error('Error in novel creation process:', error);

      // If we have a novel ID and deployment failed, delete the novel
      if (novelId) {
        try {
          await deleteNovel(novelId);
          console.log('Cleaned up novel entry after deployment failure');
        } catch (deleteError) {
          console.error('Failed to clean up novel entry:', deleteError);
        }
      }

      // Update the appropriate step status to error
      const currentActiveStep = progressSteps.find((step) => step.status === 'active');
      if (currentActiveStep) {
        updateStepStatus(currentActiveStep.id, 'error');
      }

      setError(`Failed to launch novel: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setIsLaunching(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="mx-auto max-w-2xl">
          {/* Form with Header Inside */}
          <div className="relative rounded-lg bg-white p-8 shadow-lg">
            {/* X Close Button */}
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              disabled={isLaunching}
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header Inside Form */}
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-violet-500">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <h1 className="mb-2 text-4xl font-bold text-purple-600">Launch New Novel</h1>
              <p className="text-gray-600">
                Bring your story to life with a coin and contract on ZoraPad
              </p>
            </div>

            {/* Progress Steps - Show only when launching */}
            {isLaunching && (
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  {progressSteps.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                            step.status === 'completed'
                              ? 'border-green-500 bg-green-500 text-white'
                              : step.status === 'active'
                                ? 'border-purple-500 bg-purple-500 text-white'
                                : step.status === 'error'
                                  ? 'border-red-500 bg-red-500 text-white'
                                  : 'border-gray-300 bg-gray-200 text-gray-500'
                          }`}
                        >
                          {step.status === 'completed' ? (
                            <Check className="h-5 w-5" />
                          ) : step.status === 'active' ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            step.id
                          )}
                        </div>
                        <span
                          className={`mt-2 text-center text-xs font-medium ${
                            step.status === 'completed'
                              ? 'text-green-600'
                              : step.status === 'active'
                                ? 'text-purple-600'
                                : step.status === 'error'
                                  ? 'text-red-600'
                                  : 'text-gray-500'
                          }`}
                        >
                          {step.title}
                        </span>
                      </div>
                      {index < progressSteps.length - 1 && (
                        <div
                          className={`mx-2 h-1 w-12 ${
                            progressSteps[index + 1].status === 'completed' ||
                            progressSteps[index + 1].status === 'active'
                              ? 'bg-purple-300'
                              : 'bg-gray-300'
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Novel Title */}
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">Title</label>
                <input
                  type="text"
                  name="novelTitle"
                  value={formData.novelTitle}
                  onChange={handleInputChange}
                  placeholder="Enter your novel title (E.g. My New Novel)"
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none"
                  required
                  disabled={isLaunching}
                />
              </div>

              {/* Coin Name */}
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">Coin Name</label>
                <input
                  type="text"
                  name="coinName"
                  value={formData.coinName}
                  onChange={handleInputChange}
                  placeholder="Enter your coin name (e.g. My Novel Coin)"
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none"
                  required
                  disabled={isLaunching}
                />
              </div>

              {/* Coin Symbol */}
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">Coin Symbol</label>
                <input
                  type="text"
                  name="coinSymbol"
                  value={formData.coinSymbol}
                  onChange={handleInputChange}
                  placeholder="Enter your coin symbol (e.g. NOVEL)"
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none"
                  maxLength={10}
                  required
                  disabled={isLaunching}
                />
                {formData.coinSymbol.length > 10 && (
                  <p className="mt-1 text-sm text-red-600">Maximum 10 characters</p>
                )}
              </div>

              {/* Public Feedback */}
              <div>
                <label className="mb-3 block text-sm font-bold text-gray-700">
                  Public Feedback
                </label>
                <p className="mb-4 text-sm text-gray-500">
                  Get valuable insights from the ZoraPad community as you write
                </p>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, seekPublicFeedback: true }))}
                    className={`flex-1 rounded-lg border-2 px-6 py-4 text-center transition-all ${
                      formData.seekPublicFeedback
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-purple-200'
                    }`}
                    disabled={isLaunching}
                  >
                    <div className="text-lg">Yes, please! ⭐</div>
                    <div className="text-sm">I want community feedback</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, seekPublicFeedback: false }))}
                    className={`flex-1 rounded-lg border-2 px-6 py-4 text-center transition-all ${
                      !formData.seekPublicFeedback
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-purple-200'
                    }`}
                    disabled={isLaunching}
                  >
                    <div className="text-lg">Not yet 🤫</div>
                    <div className="text-sm">Keep it private for now</div>
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <p className="text-green-700">{success}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLaunching}
                  className="flex w-full items-center justify-center space-x-2 rounded-lg bg-gradient-to-r from-pink-500 to-violet-500 px-6 py-3 font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 disabled:scale-100 disabled:opacity-50"
                >
                  {isLaunching ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Launching...</span>
                    </>
                  ) : (
                    <span>Launch My Novel ✨</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Success Popup Modal */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-purple-100/70">
          <div className="mx-4 max-w-md scale-100 transform rounded-xl border border-gray-100 bg-gradient-to-br from-purple-50 to-blue-50 p-10 text-center shadow-2xl transition-all duration-300">
            <h2 className="mb-8 text-3xl font-bold text-purple-500">Launched Successfully</h2>

            {/* Success Icon */}
            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full border-4 border-purple-200 bg-purple-50">
              <Check className="h-10 w-10 text-purple-500" />
            </div>

            {/* Redirecting Text with Loading Animation */}
            <div className="flex items-center justify-center space-x-3 text-gray-600">
              <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
              <span className="text-lg font-medium text-purple-500">Redirecting...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LaunchNewNovelPage;
