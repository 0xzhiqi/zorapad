'use client';

import { createThirdwebClient } from 'thirdweb';
import { baseSepolia } from 'thirdweb/chains';
import { ConnectButton } from 'thirdweb/react';
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
  return (
    <div className={`thirdweb-button-container ${className || ''}`}>
      <ConnectButton
        accountAbstraction={{
          chain: baseSepolia,
          sponsorGas: true,
        }}
        client={client}
        connectButton={{
          label: 'Login',
        }}
        detailsButton={{
          displayBalanceToken: undefined, // Hide balance to save space
        }}
        connectModal={{ size: 'compact', title: 'Login' }}
        theme={darkTheme({
          colors: {
            // Primary text - bright white for good contrast
            primaryText: '#ffffff',
            // Secondary text - soft white/violet for subtlety
            secondaryText: 'rgba(255, 255, 255, 0.8)',
            // Accent text - violet to match ZoraPad theme
            accentText: '#a78bfa',
            // Background colors matching the dark gradient theme
            modalBg: 'rgba(30, 27, 75, 0.95)', // Dark purple similar to ZoraPad bg
            // Connected button background - same as modal background
            connectedButtonBg: 'rgba(30, 27, 75, 0.95)',
            connectedButtonBgHover: 'rgba(30, 27, 75, 1)',
            // Border colors with violet accent
            borderColor: 'rgba(167, 139, 250, 0.3)',
            // Selected states with ZoraPad gradient colors
            selectedTextColor: '#ffffff',
            selectedTextBg: 'linear-gradient(to right, #ec4899, #8b5cf6)', // Pink-500 to violet-500 gradient
            // Primary button matching ZoraPad's "Get Started Free" button exactly
            primaryButtonBg: 'linear-gradient(to right, #ec4899, #8b5cf6)', // from-pink-500 to-violet-500
            primaryButtonText: '#ffffff',
            // Secondary button with transparent background
            secondaryButtonBg: 'rgba(255, 255, 255, 0.1)',
            secondaryButtonText: '#ffffff',
            secondaryButtonHoverBg: 'rgba(255, 255, 255, 0.2)',
            // Danger/error states
            danger: '#ef4444',
            // Success states with emerald (used in ZoraPad)
          },
        })}
        wallets={wallets}
      />
    </div>
  );
};

export default LoginButton;
