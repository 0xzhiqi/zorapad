# ZoraPad

### Create Share Inspire

ZoraPad is a platform for collaborative story writing that leverages Zora's latest Coin v4 SDK and a custom contract to create tokenised economies around literary works. Authors can launch stories each linked with a token and rewards contract. This engages the community through **staking**, **trading**, and **rewards**.

## Zora Coin v4 Integration

### Core Features from Zora Coin v4 SDK

#### 1. **Story Token Creation**

- Uses `createCoin` function from Zora's Coin v4 SDK
- Authors can define custom token names and symbols
- Each story created in launch-new-novel page gets its own ERC-20 token with ETH as the base currency

#### 2. **Token Trading**

- Uses `tradeCoin` and `createTradeCall` function from Zora's Coin v4 SDK
- Built-in trading interface accessible from the explore page
- Buy/sell functionality with real-time price calculations

#### 3. **Token Information**

- Uses `getCoin` function from Zora's Coin v4 SDK
- Accessible from the explore and community pages
- Real-time token data on market capitalisation, trading volume and token holder distribution

## Custom Contract

### Core Features from Custom Contract

#### 1. **Help Requests by Authors**

- `createRequestBounty` : Author can create a bounty for help on their stories with specified reward amounts for winners and stakers
- `stakeOnRequestBounty` : Community members can stake tokens on submissions to requests they believe are useful or should be added to the story
- `setRequestBountyWinner` : Author announces the winning submission for a bounty
- `claimRequestBounty` : Winner claims their bounty reward after being selected
- `claimStakeOnRequestBounty` : Stakers on winning submissions get their stake back plus a share of the staking reward pool while stakers on non-winning submissions get only their stake back - No one loses

#### 2. **Comments on Stories**

- `stakeOnComment` : Community members stake tokens on comments they find valuable, diverting attention to them
- `awardCommentBounty` : Author can award bounties to useful comments with rewards for both commenters and stakers
- `claimCommentBounty` : Commenters can claim their awarded bounty rewards
- `claimStakeOnCommentBounty` : Stakers on winning comments get their stake back plus a share of the staking reward pool while stakers on non-winning comments get only their stake back - Again, no one loses

#### 3. **Revenue Sharing**

- `stake` : Anyone can stake tokens on a published story to earn a share of revenue from it
- `claimRewards` : Revenue earned exogenously e.g. from advertisements are transferred into the staking pool from which stakers can claim

## Network Configuration

- **Blockchain**: Base Sepolia (Chain ID: 84532)
- **RPC Node**: https://sepolia.base.org
- **Wallet Integration**: Thirdweb smart wallet with SIWE authentication
- **Gas Optimisation**: 120% gas multiplier for reliable transactions
