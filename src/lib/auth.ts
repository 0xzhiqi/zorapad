import { PrismaAdapter } from '@auth/prisma-adapter';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { SiweMessage } from 'siwe';
import { createPublicClient, http, isAddress } from 'viem';
import { baseSepolia } from 'viem/chains';

import { prisma } from './prisma';

// Create a public client for EIP-1271 verification
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.BASE_SEPOLIA_RPC_URL || `https://sepolia.base.org`),
});

/**
 * Verify signature using both ECDSA (for EOAs) and EIP-1271 (for smart wallets)
 */
async function verifySignature(
  message: SiweMessage,
  signature: string,
  address: string
): Promise<boolean> {
  if (!isAddress(address)) {
    throw new Error('Invalid address format');
  }

  console.log('Verifying signature for address:', address);
  console.log('Signature length:', signature.length);
  console.log('Signature starts with:', signature.substring(0, 20));

  // Check if the address is a contract (smart wallet)
  const code = await publicClient.getCode({ address: address as `0x${string}` });
  const isContract = code && code !== '0x';

  console.log('Address is contract:', isContract);

  if (isContract) {
    // This is a smart wallet, use EIP-1271 verification
    try {
      console.log('Attempting EIP-1271 verification for smart wallet');

      // Prepare the message that was signed
      const messageToVerify = message.prepareMessage();
      console.log('Message to verify:', messageToVerify);

      // Use viem's verifyMessage which handles EIP-1271
      const isValid = await publicClient.verifyMessage({
        address: address as `0x${string}`,
        message: messageToVerify,
        signature: signature as `0x${string}`,
      });

      console.log('EIP-1271 verification result:', isValid);
      return isValid;
    } catch (contractError) {
      console.error('EIP-1271 verification failed:', contractError);
      return false;
    }
  } else {
    // This is an EOA, try standard ECDSA verification
    // But first check if signature looks like a standard ECDSA signature
    const signatureWithoutPrefix = signature.startsWith('0x') ? signature.slice(2) : signature;

    if (signatureWithoutPrefix.length === 130) {
      // 65 bytes = 130 hex chars
      try {
        console.log('Attempting standard SIWE verification for EOA...');
        const result = await message.verify({
          signature,
          domain: message.domain,
          nonce: message.nonce,
        });

        if (result.success) {
          console.log('Standard SIWE verification successful');
          return true;
        }
      } catch (eoaError) {
        console.log(
          'Standard SIWE verification failed:',
          eoaError instanceof Error ? eoaError.message : String(eoaError)
        );
      }
    } else {
      console.log(
        'Signature format suggests smart wallet signature, but address is not a contract'
      );
      console.log(
        "This might be a smart wallet that hasn't been deployed yet or a delegated signature"
      );

      // Try EIP-1271 verification anyway - some wallets might work this way
      try {
        const messageToVerify = message.prepareMessage();
        const isValid = await publicClient.verifyMessage({
          address: address as `0x${string}`,
          message: messageToVerify,
          signature: signature as `0x${string}`,
        });

        console.log('EIP-1271 verification result for undeployed smart wallet:', isValid);
        return isValid;
      } catch (error) {
        console.error('EIP-1271 verification failed for undeployed smart wallet:', error);
      }
    }
  }

  return false;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: 'Ethereum',
      credentials: {
        message: {
          label: 'Message',
          type: 'text',
          placeholder: '0x0',
        },
        signature: {
          label: 'Signature',
          type: 'text',
          placeholder: '0x0',
        },
        nonce: { label: 'Nonce', type: 'text' },
        smartWalletAddress: { label: 'Smart Wallet Address', type: 'text' },
      },
      async authorize(credentials) {
        try {
          console.log('=== Starting authentication ===');
          console.log('Credentials received:', {
            hasMessage: !!credentials?.message,
            hasSignature: !!credentials?.signature,
            hasNonce: !!credentials?.nonce,
            smartWalletAddress: credentials?.smartWalletAddress,
          });

          if (!credentials?.message || typeof credentials.message !== 'string') {
            console.error('No valid message provided');
            return null;
          }

          const siwe = new SiweMessage(JSON.parse(credentials.message));
          const nextAuthUrl = new URL(process.env.NEXTAUTH_URL!);

          console.log('SIWE Message parsed:', {
            address: siwe.address,
            domain: siwe.domain,
            chainId: siwe.chainId,
            nonce: siwe.nonce,
          });

          if (!credentials?.signature || typeof credentials.signature !== 'string') {
            console.error('No valid signature provided');
            return null;
          }

          // Verify the signature (supports both EOA and smart wallets via EIP-1271)
          const isValidSignature = await verifySignature(siwe, credentials.signature, siwe.address);

          if (!isValidSignature) {
            console.error('Signature verification failed');
            return null;
          }

          console.log('Signature verification successful');

          // Additional validation
          if (siwe.domain !== nextAuthUrl.host) {
            console.error('Domain mismatch:', siwe.domain, 'vs', nextAuthUrl.host);
            return null;
          }

          if (siwe.nonce !== credentials?.nonce) {
            console.error('Nonce mismatch');
            return null;
          }

          // Check if message is expired
          if (siwe.expirationTime && new Date() > new Date(siwe.expirationTime)) {
            console.error('Message expired');
            return null;
          }

          // Check if message is not yet valid
          if (siwe.notBefore && new Date() < new Date(siwe.notBefore)) {
            console.error('Message not yet valid');
            return null;
          }

          const walletAddress = siwe.address.toLowerCase();
          console.log('Looking up user with wallet address:', walletAddress);

          let user = await prisma.user.findUnique({
            where: { walletAddress },
          });

          if (!user) {
            console.log('Creating new user for address:', walletAddress);
            user = await prisma.user.create({
              data: {
                walletAddress,
                name: `User ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
              },
            });
          }

          console.log('Authentication successful for user:', user.id);

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            walletAddress: user.walletAddress || undefined,
          };
        } catch (error) {
          console.error('=== Authentication error ===', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.walletAddress = (user as any).walletAddress;
        token.sub = user.id; // Store user ID in token
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        // Fetch fresh user data from database on each session check
        const freshUser = await prisma.user.findUnique({
          where: { id: token.sub as string },
          select: {
            id: true,
            name: true,
            walletAddress: true,
          },
        });
        
        if (freshUser) {
          session.user.id = freshUser.id;
          session.user.name = freshUser.name;
          (session.user as any).walletAddress = freshUser.walletAddress;
        } else {
          // Fallback to token data if user not found
          (session.user as any).walletAddress = token.walletAddress;
          session.user.id = token.sub as string;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
});
