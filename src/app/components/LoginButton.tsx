'use client';

import { useEffect, useState } from 'react';

import { signIn, signOut, useSession } from 'next-auth/react';
import { SiweMessage } from 'siwe';
import { createThirdwebClient } from 'thirdweb';
import { baseSepolia } from 'thirdweb/chains';
import { ConnectButton, useActiveAccount, useActiveWalletChain } from 'thirdweb/react';
import { darkTheme } from 'thirdweb/react';
import { createWallet, inAppWallet } from 'thirdweb/wallets';

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || 'your-client-id-here',
});

const wallets = [
  inAppWallet({
    auth: {
      options: ['google', 'telegram', 'email', 'passkey', 'phone', 'line', 'facebook'],
    },
  }),
  createWallet('io.metamask'),
  createWallet('io.rabby'),
  createWallet('com.trustwallet.app'),
  createWallet('com.coinbase.wallet'),
];

interface ConnectButtonProps {
  className?: string;
}

const LoginButton: React.FC<ConnectButtonProps> = ({ className }) => {
  const { data: session, status } = useSession();
  const account = useActiveAccount();
  const activeChain = useActiveWalletChain();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleWalletAuth = async () => {
    if (!account?.address || session || isAuthenticating) return;

    setIsAuthenticating(true);

    try {
      // Check if wallet is on Base Sepolia
      if (activeChain?.id !== baseSepolia.id) {
        alert('Please switch your wallet to the Base Sepolia network.');
        return;
      }

      // Use Smart Wallet's address
      const walletAddress = account.address;
      console.log('Client: Smart Wallet address:', walletAddress);

      // Get nonce from server
      const nonceRes = await fetch('/api/auth/siwe');
      const { nonce } = await nonceRes.json();
      console.log('Client: Nonce fetched:', nonce);

      // Create SIWE message using Smart Wallet's address
      const message = new SiweMessage({
        scheme: window.location.protocol.slice(0, -1),
        domain: window.location.host,
        address: walletAddress,
        statement: 'Sign in with Ethereum to ZoraPad',
        uri: window.location.origin || 'http://localhost:3000',
        version: '1',
        chainId: baseSepolia.id,
        nonce,
      });

      console.log('Client: SIWE message:', JSON.stringify(message, null, 2));
      const messageToSign = message.prepareMessage();
      console.log('Client: Message to sign:', messageToSign);

      // Sign message with Smart Wallet (delegates to admin signer)
      const signature = await account.signMessage({
        message: messageToSign,
      });
      console.log('Client: Signature:', signature);
      console.log('Client: Expected signing address:', walletAddress);

      // Skip client-side verification to rely on server-side EIP-1271
      console.log('Client: Skipping local verification, sending to server');

      // Sign in with NextAuth
      const result = await signIn('credentials', {
        message: JSON.stringify(message),
        signature,
        nonce,
        smartWalletAddress: walletAddress,
        redirect: false,
      });

      if (result?.error) {
        console.error('Client: Authentication failed:', result.error);
        throw new Error(`Authentication failed on server: ${result.error}`);
      }

      console.log('Client: Authentication successful');
    } catch (error: any) {
      console.error('Client: Wallet authentication error:', error);
      alert(
        `Authentication failed: ${error.message || 'Please ensure you are signing with the correct wallet account.'}`
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Auto-authenticate when wallet connects
  useEffect(() => {
    if (account?.address && !session && status !== 'loading') {
      const timer = setTimeout(() => {
        handleWalletAuth();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [account?.address, session, status]);

  // Handle account changes
  useEffect(() => {
    if (session && account?.address) {
      const sessionAddress = session.user?.walletAddress?.toLowerCase();
      const currentAddress = account.address.toLowerCase();

      if (sessionAddress && sessionAddress !== currentAddress) {
        console.log('Client: Wallet address changed, signing out...');
        signOut({ redirect: false });
      }
    }
  }, [account?.address, session]);

  // Handle disconnect
  const handleDisconnect = async () => {
    await signOut({ redirect: false });
  };

  return (
    <div className={`thirdweb-button-container ${className || ''}`}>
      <ConnectButton
        accountAbstraction={{
          chain: baseSepolia,
          sponsorGas: true,
        }}
        client={client}
        connectButton={{
          label: session ? 'Connected' : 'Login',
        }}
        detailsButton={{
          displayBalanceToken: undefined,
        }}
        connectModal={{ size: 'compact', title: 'Login' }}
        onDisconnect={handleDisconnect}
        theme={darkTheme({
          colors: {
            primaryText: '#ffffff',
            secondaryText: 'rgba(255, 255, 255, 0.8)',
            accentText: '#a78bfa',
            modalBg: 'rgba(30, 27, 75, 0.95)',
            connectedButtonBg: 'rgba(30, 27, 75, 0.95)',
            connectedButtonBgHover: 'rgba(30, 27, 75, 1)',
            borderColor: 'rgba(167, 139, 250, 0.3)',
            selectedTextColor: '#ffffff',
            selectedTextBg: 'linear-gradient(to right, #ec4899, #8b5cf6)',
            primaryButtonBg: 'linear-gradient(to right, #ec4899, #8b5cf6)',
            primaryButtonText: '#ffffff',
            secondaryButtonBg: 'rgba(255, 255, 255, 0.1)',
            secondaryButtonText: '#ffffff',
            secondaryButtonHoverBg: 'rgba(255, 255, 255, 0.2)',
            danger: '#ef4444',
          },
        })}
        wallets={wallets}
      />
      {isAuthenticating && <div className="mt-2 text-sm text-white/60">Authenticating...</div>}
    </div>
  );
};

export default LoginButton;
