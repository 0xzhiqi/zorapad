import { createThirdwebClient, defineChain } from 'thirdweb';

// Create Thirdweb client
export const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

export const baseSepoliaChain = defineChain(84532);