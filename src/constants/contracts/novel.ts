// constants/contracts/novel.ts

export const NOVEL_CONTRACT_ABI = [
  {
    type: 'constructor',
    inputs: [
      {
        name: '_coinAddress',
        type: 'address',
        internalType: 'address',
      },
      {
        name: '_creatorAddress',
        type: 'address',
        internalType: 'address',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'accRewardPerShare',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'addRevenue',
    inputs: [
      {
        name: '_amount',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'awardCommentBounty',
    inputs: [
      {
        name: '_commentId',
        type: 'bytes32',
        internalType: 'bytes32',
      },
      {
        name: '_winner',
        type: 'address',
        internalType: 'address',
      },
      {
        name: '_bountyAmount',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: '_stakersReward',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'claimCommentBounty',
    inputs: [
      {
        name: '_commentId',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'claimRequestBounty',
    inputs: [
      {
        name: '_bountyId',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'claimRewards',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'claimStakeOnCommentBounty',
    inputs: [
      {
        name: '_commentId',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'claimStakeOnRequestBounty',
    inputs: [
      {
        name: '_bountyId',
        type: 'bytes32',
        internalType: 'bytes32',
      },
      {
        name: '_submissionId',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'coinAddress',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'commentBounties',
    inputs: [
      {
        name: '',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    outputs: [
      {
        name: 'bountyAmount',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'stakersReward',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'stakedAmount',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'winner',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'bountyClaimed',
        type: 'bool',
        internalType: 'bool',
      },
      {
        name: 'totalStakers',
        type: 'uint32',
        internalType: 'uint32',
      },
      {
        name: 'claimedStakers',
        type: 'uint32',
        internalType: 'uint32',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'commentBountyStakedAmount',
    inputs: [
      {
        name: '',
        type: 'bytes32',
        internalType: 'bytes32',
      },
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'commentBountyStakedClaimed',
    inputs: [
      {
        name: '',
        type: 'bytes32',
        internalType: 'bytes32',
      },
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'createRequestBounty',
    inputs: [
      {
        name: '_bountyId',
        type: 'bytes32',
        internalType: 'bytes32',
      },
      {
        name: '_bountyAmount',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: '_stakersReward',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'creatorAddress',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'deleteRequestBounty',
    inputs: [
      {
        name: '_bountyId',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'emergencyWithdraw',
    inputs: [
      {
        name: '_token',
        type: 'address',
        internalType: 'address',
      },
      {
        name: '_amount',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getContractBalance',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getGeneralStakingStats',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getPendingRewards',
    inputs: [
      {
        name: '_user',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getUserStakeInfo',
    inputs: [
      {
        name: '_user',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'pause',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'paused',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'requestBounties',
    inputs: [
      {
        name: '',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    outputs: [
      {
        name: 'bountyAmount',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'stakersReward',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'stakedAmount',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'winningSubmission',
        type: 'bytes32',
        internalType: 'bytes32',
      },
      {
        name: 'winner',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'totalStakers',
        type: 'uint32',
        internalType: 'uint32',
      },
      {
        name: 'claimedStakers',
        type: 'uint32',
        internalType: 'uint32',
      },
      {
        name: 'bountyClaimed',
        type: 'bool',
        internalType: 'bool',
      },
      {
        name: 'exists',
        type: 'bool',
        internalType: 'bool',
      },
      {
        name: 'deactivated',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'requestBountyStakedAmount',
    inputs: [
      {
        name: '',
        type: 'bytes32',
        internalType: 'bytes32',
      },
      {
        name: '',
        type: 'bytes32',
        internalType: 'bytes32',
      },
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'requestBountyStakedClaimed',
    inputs: [
      {
        name: '',
        type: 'bytes32',
        internalType: 'bytes32',
      },
      {
        name: '',
        type: 'bytes32',
        internalType: 'bytes32',
      },
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'setRequestBountyWinner',
    inputs: [
      {
        name: '_bountyId',
        type: 'bytes32',
        internalType: 'bytes32',
      },
      {
        name: '_winner',
        type: 'address',
        internalType: 'address',
      },
      {
        name: '_winningSubmission',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'stake',
    inputs: [
      {
        name: '_amount',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'stakeOnComment',
    inputs: [
      {
        name: '_commentId',
        type: 'bytes32',
        internalType: 'bytes32',
      },
      {
        name: '_commentStakedAmount',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'stakeOnRequestBounty',
    inputs: [
      {
        name: '_bountyId',
        type: 'bytes32',
        internalType: 'bytes32',
      },
      {
        name: '_submissionId',
        type: 'bytes32',
        internalType: 'bytes32',
      },
      {
        name: '_bountyStakedAmount',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'stakes',
    inputs: [
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        name: 'amount',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'rewardDebt',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalRevenueAdded',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalStaked',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'unpause',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'unstake',
    inputs: [
      {
        name: '_amount',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'CommentBountyAwarded',
    inputs: [
      {
        name: 'commentId',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
      {
        name: 'winner',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'bountyAmount',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'stakersReward',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'CommentBountyClaimed',
    inputs: [
      {
        name: 'commentId',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
      {
        name: 'winner',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'amount',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'CommentBountyStakeClaimed',
    inputs: [
      {
        name: 'commentId',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
      {
        name: 'staker',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'amount',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'CommentStaked',
    inputs: [
      {
        name: 'commentId',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
      {
        name: 'staker',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'amount',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'GeneralStaked',
    inputs: [
      {
        name: 'user',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'amount',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'GeneralUnstaked',
    inputs: [
      {
        name: 'user',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'amount',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'Paused',
    inputs: [
      {
        name: 'account',
        type: 'address',
        indexed: false,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'RequestBountyClaimed',
    inputs: [
      {
        name: 'bountyId',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
      {
        name: 'winner',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'amount',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'RequestBountyCreated',
    inputs: [
      {
        name: 'bountyId',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
      {
        name: 'bountyAmount',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'stakersReward',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'RequestBountyDeleted',
    inputs: [
      {
        name: 'bountyId',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'RequestBountyStakeClaimed',
    inputs: [
      {
        name: 'bountyId',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
      {
        name: 'submissionId',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
      {
        name: 'staker',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'amount',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'RequestBountyStaked',
    inputs: [
      {
        name: 'bountyId',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
      {
        name: 'submissionId',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
      {
        name: 'staker',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'amount',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'RequestBountyWinnerSet',
    inputs: [
      {
        name: 'bountyId',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
      {
        name: 'winner',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'winningSubmission',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'RevenueAdded',
    inputs: [
      {
        name: 'amount',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'RewardClaimed',
    inputs: [
      {
        name: 'user',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'amount',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'Unpaused',
    inputs: [
      {
        name: 'account',
        type: 'address',
        indexed: false,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    type: 'error',
    name: 'BountyAlreadyClaimed',
    inputs: [],
  },
  {
    type: 'error',
    name: 'BountyAlreadyExists',
    inputs: [],
  },
  {
    type: 'error',
    name: 'BountyDeactivated',
    inputs: [],
  },
  {
    type: 'error',
    name: 'BountyNotExists',
    inputs: [],
  },
  {
    type: 'error',
    name: 'BountyWinnerAnnounced',
    inputs: [],
  },
  {
    type: 'error',
    name: 'CannotWithdrawStakingToken',
    inputs: [],
  },
  {
    type: 'error',
    name: 'CommentAlreadyAwarded',
    inputs: [],
  },
  {
    type: 'error',
    name: 'EnforcedPause',
    inputs: [],
  },
  {
    type: 'error',
    name: 'ExpectedPause',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InsufficientAllowance',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InsufficientStakedAmount',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InsufficientTokens',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidAddress',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidAmount',
    inputs: [],
  },
  {
    type: 'error',
    name: 'NoRewardsToClaim',
    inputs: [],
  },
  {
    type: 'error',
    name: 'NoStake',
    inputs: [],
  },
  {
    type: 'error',
    name: 'NotWinner',
    inputs: [],
  },
  {
    type: 'error',
    name: 'OnlyCreator',
    inputs: [],
  },
  {
    type: 'error',
    name: 'ReentrancyGuardReentrantCall',
    inputs: [],
  },
  {
    type: 'error',
    name: 'StakeAlreadyClaimed',
    inputs: [],
  },
  {
    type: 'error',
    name: 'TransferFailed',
    inputs: [],
  },
] as const;

export const NOVEL_CONTRACT_BYTECODE =
  '0x60c060405234801561000f575f5ffd5b506040516150c03803806150c0833981810160405281019061003191906101a1565b60015f819055505f73ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16148061009d57505f73ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16145b156100d4576040517fe6c4247b00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b8173ffffffffffffffffffffffffffffffffffffffff1660808173ffffffffffffffffffffffffffffffffffffffff16815250508073ffffffffffffffffffffffffffffffffffffffff1660a08173ffffffffffffffffffffffffffffffffffffffff168152505050506101df565b5f5ffd5b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f61017082610147565b9050919050565b61018081610166565b811461018a575f5ffd5b50565b5f8151905061019b81610177565b92915050565b5f5f604083850312156101b7576101b6610143565b5b5f6101c48582860161018d565b92505060206101d58582860161018d565b9150509250929050565b60805160a051614dd26102ee5f395f8181610a7d015281816120f4015281816125ef015281816129aa01528181612a3f01528181612b6501528181612be90152818161314c015281816133de01526138a001525f81816107450152818161081701528181610bc001528181610c9101528181610d63015281816110a401528181611176015281816114f20152818161171f0152818161195001528181611d9a01528181611fca0152818161228001528181612352015281816126be015281816127900152818161290701528181612ac401528181612e3d01528181612f0f01528181613300015281816133a20152818161365d01528181613e320152818161404901526141a30152614dd25ff3fe608060405234801561000f575f5ffd5b5060043610610204575f3560e01c8063939d623711610118578063c32d3ae2116100ab578063f100eb621161007a578063f100eb6214610597578063f6ed2017146105c7578063fbc9c5a1146105f7578063fcefbd0314610613578063fdc61dd11461064357610204565b8063c32d3ae2146104d9578063e47033391461050a578063e927fc5c14610540578063edfa03a21461055e57610204565b8063b902d681116100e7578063b902d68114610451578063ba7c4dc01461046d578063bda99f7a1461048d578063c012af15146104bd57610204565b8063939d6237146103df57806395ccea67146103fd578063983d475914610419578063a694fc3a1461043557610204565b8063372500ab1161019b57806363ec512d1161016a57806363ec512d1461035f57806367525b721461037b5780636f9fb98a14610399578063817b1cd2146103b75780638456cb59146103d557610204565b8063372500ab146103115780633f4ba83a1461031b5780635610f073146103255780635c975abb1461034157610204565b80632361541d116101d75780632361541d1461028d57806327e576fc146102a95780632e17de78146102d957806331d9e064146102f557610204565b80630b566a15146102085780630fd44a4d146102245780631630a4861461024057806316934fc41461025c575b5f5ffd5b610222600480360381019061021d919061455c565b610661565b005b61023e6004803603810190610239919061459a565b610a7b565b005b61025a60048036038101906102559190614644565b61101d565b005b610276600480360381019061027191906146a8565b61132a565b6040516102849291906146e2565b60405180910390f35b6102a760048036038101906102a29190614709565b61134a565b005b6102c360048036038101906102be9190614734565b61161e565b6040516102d09190614772565b60405180910390f35b6102f360048036038101906102ee919061478b565b61163e565b005b61030f600480360381019061030a9190614709565b611a79565b005b610319611ec6565b005b6103236120f2565b005b61033f600480360381019061033a91906147b6565b612181565b005b6103496125d8565b6040516103569190614820565b60405180910390f35b6103796004803603810190610374919061478b565b6125ed565b005b6103836128fe565b6040516103909190614772565b60405180910390f35b6103a1612904565b6040516103ae9190614772565b60405180910390f35b6103bf6129a2565b6040516103cc9190614772565b60405180910390f35b6103dd6129a8565b005b6103e7612a37565b6040516103f49190614772565b60405180910390f35b61041760048036038101906104129190614839565b612a3d565b005b610433600480360381019061042e9190614877565b612be7565b005b61044f600480360381019061044a919061478b565b612de8565b005b61046b60048036038101906104669190614709565b61314a565b005b6104756134cc565b604051610484939291906148c7565b60405180910390f35b6104a760048036038101906104a291906148fc565b6134e3565b6040516104b49190614772565b60405180910390f35b6104d760048036038101906104d29190614709565b61350e565b005b6104f360048036038101906104ee91906146a8565b613788565b6040516105019291906146e2565b60405180910390f35b610524600480360381019061051f9190614709565b613814565b6040516105379796959493929190614979565b60405180910390f35b61054861389e565b60405161055591906149e6565b60405180910390f35b61057860048036038101906105739190614709565b6138c2565b60405161058e9a99989796959493929190614a0e565b60405180910390f35b6105b160048036038101906105ac91906148fc565b613978565b6040516105be9190614820565b60405180910390f35b6105e160048036038101906105dc91906146a8565b6139ad565b6040516105ee9190614772565b60405180910390f35b610611600480360381019061060c9190614aa8565b613ab4565b005b61062d60048036038101906106289190614734565b614177565b60405161063a9190614820565b60405180910390f35b61064b6141a1565b60405161065891906149e6565b60405180910390f35b6106696141c5565b610671614209565b5f81036106aa576040517f2c5211c600000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b5f73ffffffffffffffffffffffffffffffffffffffff1660095f8481526020019081526020015f206003015f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614610742576040517fe724b6c700000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b807f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff1663dd62ed3e33306040518363ffffffff1660e01b815260040161079e929190614ae6565b602060405180830381865afa1580156107b9573d5f5f3e3d5ffd5b505050506040513d601f19601f820116820180604052508101906107dd9190614b21565b1015610815576040517f13be252b00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b7f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff166323b872dd3330846040518463ffffffff1660e01b815260040161087293929190614b4c565b6020604051808303815f875af115801561088e573d5f5f3e3d5ffd5b505050506040513d601f19601f820116820180604052508101906108b29190614bab565b6108e8576040517f90b8ec1800000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b5f5f600a5f8581526020019081526020015f205f3373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205414905081600a5f8581526020019081526020015f205f3373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f8282546109959190614c03565b925050819055508160095f8581526020019081526020015f206002015f8282546109bf9190614c03565b925050819055508015610a1f57600160095f8581526020019081526020015f2060030160158282829054906101000a900463ffffffff16610a009190614c36565b92506101000a81548163ffffffff021916908363ffffffff1602179055505b3373ffffffffffffffffffffffffffffffffffffffff16837f984dda3b45d7aa247209c9beaa23166002c999314aebd43b7d5ed9dde0ad814084604051610a669190614772565b60405180910390a350610a7761424a565b5050565b7f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610b00576040517f47bc7cc800000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b610b08614209565b610b106141c5565b60065f8481526020019081526020015f20600401601d9054906101000a900460ff1615610b69576040517f92871f9900000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b5f82148015610b7757505f81145b15610bae576040517f2c5211c600000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b5f8183610bbb9190614c03565b9050807f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff166370a08231336040518263ffffffff1660e01b8152600401610c1791906149e6565b602060405180830381865afa158015610c32573d5f5f3e3d5ffd5b505050506040513d601f19601f82011682018060405250810190610c569190614b21565b1015610c8e576040517ff1b7e15e00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b807f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff1663dd62ed3e33306040518363ffffffff1660e01b8152600401610cea929190614ae6565b602060405180830381865afa158015610d05573d5f5f3e3d5ffd5b505050506040513d601f19601f82011682018060405250810190610d299190614b21565b1015610d61576040517f13be252b00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b7f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff166323b872dd3330846040518463ffffffff1660e01b8152600401610dbe93929190614b4c565b6020604051808303815f875af1158015610dda573d5f5f3e3d5ffd5b505050506040513d601f19601f82011682018060405250810190610dfe9190614bab565b610e34576040517f90b8ec1800000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b6040518061014001604052808481526020018381526020015f81526020015f5f1b81526020015f73ffffffffffffffffffffffffffffffffffffffff1681526020015f63ffffffff1681526020015f63ffffffff1681526020015f151581526020016001151581526020015f151581525060065f8681526020019081526020015f205f820151815f01556020820151816001015560408201518160020155606082015181600301556080820151816004015f6101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555060a08201518160040160146101000a81548163ffffffff021916908363ffffffff16021790555060c08201518160040160186101000a81548163ffffffff021916908363ffffffff16021790555060e082015181600401601c6101000a81548160ff02191690831515021790555061010082015181600401601d6101000a81548160ff02191690831515021790555061012082015181600401601e6101000a81548160ff021916908315150217905550905050837f12c47b868e56a59c336817835828779ab83a4c7eb2c371e4826239c651c4df8084846040516110079291906146e2565b60405180910390a25061101861424a565b505050565b6110256141c5565b61102d614209565b5f73ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1603611092576040517fe6c4247b00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b5f818361109f9190614c03565b9050807f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff1663dd62ed3e33306040518363ffffffff1660e01b81526004016110fd929190614ae6565b602060405180830381865afa158015611118573d5f5f3e3d5ffd5b505050506040513d601f19601f8201168201806040525081019061113c9190614b21565b1015611174576040517ff1b7e15e00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b7f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff166323b872dd3330846040518463ffffffff1660e01b81526004016111d193929190614b4c565b6020604051808303815f875af11580156111ed573d5f5f3e3d5ffd5b505050506040513d601f19601f820116820180604052508101906112119190614bab565b611247576040517f90b8ec1800000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b8260095f8781526020019081526020015f205f01819055508160095f8781526020019081526020015f20600101819055508360095f8781526020019081526020015f206003015f6101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508373ffffffffffffffffffffffffffffffffffffffff16857faf97086ee639520f32441ac0eaa3a418a0bd0885068bf60221b603f4a6e2afb985856040516113139291906146e2565b60405180910390a35061132461424a565b50505050565b6002602052805f5260405f205f91509050805f0154908060010154905082565b8060065f8281526020019081526020015f20600401601d9054906101000a900460ff166113a3576040517f8d639beb00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b6113ab6141c5565b6113b3614209565b60065f8381526020019081526020015f20600401601c9054906101000a900460ff161561140c576040517ff4dbea5d00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b3373ffffffffffffffffffffffffffffffffffffffff1660065f8481526020019081526020015f206004015f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16146114a4576040517f618c724200000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b600160065f8481526020019081526020015f20600401601c6101000a81548160ff0219169083151502179055505f60065f8481526020019081526020015f205f015490505f8111156115c2577f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff1663a9059cbb33836040518363ffffffff1660e01b815260040161154b929190614c6d565b6020604051808303815f875af1158015611567573d5f5f3e3d5ffd5b505050506040513d601f19601f8201168201806040525081019061158b9190614bab565b6115c1576040517f90b8ec1800000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b5b3373ffffffffffffffffffffffffffffffffffffffff16837f08dc945a4bd91f87a968416c29e0c3e1dbf75598fa89e0042df491b243eb4679836040516116099190614772565b60405180910390a35061161a61424a565b5050565b600a602052815f5260405f20602052805f5260405f205f91509150505481565b6116466141c5565b61164e614209565b5f8103611687576040517f2c5211c600000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b8060025f3373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f01541015611700576040517fd06ff88e00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b61170933614253565b5f611713336142e2565b90505f81111561183d577f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff1663a9059cbb33836040518363ffffffff1660e01b8152600401611778929190614c6d565b6020604051808303815f875af1158015611794573d5f5f3e3d5ffd5b505050506040513d601f19601f820116820180604052508101906117b89190614bab565b6117ee576040517f90b8ec1800000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b3373ffffffffffffffffffffffffffffffffffffffff167f106f923f993c2149d49b4255ff723acafa1f2d94393f561d3eda32ae348f7241826040516118349190614772565b60405180910390a25b8160025f3373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f015f82825461188b9190614c94565b92505081905550670de0b6b3a764000060045460025f3373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f01546118e89190614cc7565b6118f29190614d35565b60025f3373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f20600101819055508160035f8282546119479190614c94565b925050819055507f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff1663a9059cbb33846040518363ffffffff1660e01b81526004016119a9929190614c6d565b6020604051808303815f875af11580156119c5573d5f5f3e3d5ffd5b505050506040513d601f19601f820116820180604052508101906119e99190614bab565b611a1f576040517f90b8ec1800000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b3373ffffffffffffffffffffffffffffffffffffffff167f7e51b68101307c7e76856df085fca26d377b7e0fc1848450a0ca26d003098c6583604051611a659190614772565b60405180910390a250611a7661424a565b50565b611a816141c5565b611a89614209565b5f600a5f8381526020019081526020015f205f3373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205490505f8103611b12576040517fcacf989a00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b600b5f8381526020019081526020015f205f3373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f9054906101000a900460ff1615611ba2576040517f434d4aea00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b6001600b5f8481526020019081526020015f205f3373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f6101000a81548160ff0219169083151502179055505f5f73ffffffffffffffffffffffffffffffffffffffff1660095f8581526020019081526020015f206003015f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614611d1057600160095f8581526020019081526020015f2060030160198282829054906101000a900463ffffffff16611ca19190614c36565b92506101000a81548163ffffffff021916908363ffffffff16021790555060095f8481526020019081526020015f206002015460095f8581526020019081526020015f206001015483611cf49190614cc7565b611cfe9190614d35565b82611d099190614c03565b9050611d90565b600160095f8581526020019081526020015f2060030160158282829054906101000a900463ffffffff16611d449190614d65565b92506101000a81548163ffffffff021916908363ffffffff1602179055508160095f8581526020019081526020015f206002015f828254611d859190614c94565b925050819055508190505b5f811115611e6a577f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff1663a9059cbb33836040518363ffffffff1660e01b8152600401611df3929190614c6d565b6020604051808303815f875af1158015611e0f573d5f5f3e3d5ffd5b505050506040513d601f19601f82011682018060405250810190611e339190614bab565b611e69576040517f90b8ec1800000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b5b3373ffffffffffffffffffffffffffffffffffffffff16837fd63fcfd4177f21f6ebb620c97d2f80fab658194cb1474da8d52919c83a5bab3983604051611eb19190614772565b60405180910390a35050611ec361424a565b50565b611ece6141c5565b611ed6614209565b611edf33614253565b5f611ee9336142e2565b90505f8103611f24576040517f73380d9900000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b670de0b6b3a764000060045460025f3373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f0154611f7a9190614cc7565b611f849190614d35565b60025f3373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f20600101819055507f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff1663a9059cbb33836040518363ffffffff1660e01b8152600401612023929190614c6d565b6020604051808303815f875af115801561203f573d5f5f3e3d5ffd5b505050506040513d601f19601f820116820180604052508101906120639190614bab565b612099576040517f90b8ec1800000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b3373ffffffffffffffffffffffffffffffffffffffff167f106f923f993c2149d49b4255ff723acafa1f2d94393f561d3eda32ae348f7241826040516120df9190614772565b60405180910390a2506120f061424a565b565b7f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614612177576040517f47bc7cc800000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b61217f6143e9565b565b8260065f8281526020019081526020015f20600401601d9054906101000a900460ff166121da576040517f8d639beb00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b8360065f8281526020019081526020015f20600401601e9054906101000a900460ff1615612234576040517fe1b8b48a00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b61223c6141c5565b612244614209565b5f830361227d576040517f2c5211c600000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b827f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff1663dd62ed3e33306040518363ffffffff1660e01b81526004016122d9929190614ae6565b602060405180830381865afa1580156122f4573d5f5f3e3d5ffd5b505050506040513d601f19601f820116820180604052508101906123189190614b21565b1015612350576040517f13be252b00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b7f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff166323b872dd3330866040518463ffffffff1660e01b81526004016123ad93929190614b4c565b6020604051808303815f875af11580156123c9573d5f5f3e3d5ffd5b505050506040513d601f19601f820116820180604052508101906123ed9190614bab565b612423576040517f90b8ec1800000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b5f5f60075f8881526020019081526020015f205f8781526020019081526020015f205f3373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f20541490508360075f8881526020019081526020015f205f8781526020019081526020015f205f3373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f8282546124ee9190614c03565b925050819055508360065f8881526020019081526020015f206002015f8282546125189190614c03565b92505081905550801561257857600160065f8881526020019081526020015f2060040160148282829054906101000a900463ffffffff166125599190614c36565b92506101000a81548163ffffffff021916908363ffffffff1602179055505b3373ffffffffffffffffffffffffffffffffffffffff1685877f0e1acad0f64b18668f9cd2d2d8e3b900f65f39ffff3e02a9e2e9399e0c4276cc876040516125c09190614772565b60405180910390a4506125d161424a565b5050505050565b5f60015f9054906101000a900460ff16905090565b7f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614612672576040517f47bc7cc800000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b61267a6141c5565b612682614209565b5f81036126bb576040517f2c5211c600000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b807f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff1663dd62ed3e33306040518363ffffffff1660e01b8152600401612717929190614ae6565b602060405180830381865afa158015612732573d5f5f3e3d5ffd5b505050506040513d601f19601f820116820180604052508101906127569190614b21565b101561278e576040517f13be252b00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b7f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff166323b872dd3330846040518463ffffffff1660e01b81526004016127eb93929190614b4c565b6020604051808303815f875af1158015612807573d5f5f3e3d5ffd5b505050506040513d601f19601f8201168201806040525081019061282b9190614bab565b612861576040517f90b8ec1800000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b5f60035411156128a457600354670de0b6b3a7640000826128829190614cc7565b61288c9190614d35565b60045f82825461289c9190614c03565b925050819055505b8060055f8282546128b59190614c03565b925050819055507fd852304f22f619a0bf9cd541fddf19b9acf7df284814155b9240779d7dad970c816040516128eb9190614772565b60405180910390a16128fb61424a565b50565b60055481565b5f7f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff166370a08231306040518263ffffffff1660e01b815260040161295e91906149e6565b602060405180830381865afa158015612979573d5f5f3e3d5ffd5b505050506040513d601f19601f8201168201806040525081019061299d9190614b21565b905090565b60035481565b7f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614612a2d576040517f47bc7cc800000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b612a3561444a565b565b60045481565b7f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614612ac2576040517f47bc7cc800000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b7f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1603612b47576040517fa948df3100000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b8173ffffffffffffffffffffffffffffffffffffffff1663a9059cbb7f0000000000000000000000000000000000000000000000000000000000000000836040518363ffffffff1660e01b8152600401612ba2929190614c6d565b6020604051808303815f875af1158015612bbe573d5f5f3e3d5ffd5b505050506040513d601f19601f82011682018060405250810190612be29190614bab565b505050565b7f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614612c6c576040517f47bc7cc800000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b8260065f8281526020019081526020015f20600401601d9054906101000a900460ff16612cc5576040517f8d639beb00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b612ccd614209565b5f73ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1603612d32576040517fe6c4247b00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b8260065f8681526020019081526020015f206004015f6101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508160065f8681526020019081526020015f2060030181905550818373ffffffffffffffffffffffffffffffffffffffff16857f5e345ac9a73acf63c3865c1923e1e4cbc3eb0c3796c0657fb71033401c54c2e360405160405180910390a450505050565b612df06141c5565b612df8614209565b5f8103612e31576040517f2c5211c600000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b612e3a33614253565b807f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff1663dd62ed3e33306040518363ffffffff1660e01b8152600401612e96929190614ae6565b602060405180830381865afa158015612eb1573d5f5f3e3d5ffd5b505050506040513d601f19601f82011682018060405250810190612ed59190614b21565b1015612f0d576040517f13be252b00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b7f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff166323b872dd3330846040518463ffffffff1660e01b8152600401612f6a93929190614b4c565b6020604051808303815f875af1158015612f86573d5f5f3e3d5ffd5b505050506040513d601f19601f82011682018060405250810190612faa9190614bab565b612fe0576040517f90b8ec1800000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b8060025f3373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f015f82825461302e9190614c03565b92505081905550670de0b6b3a764000060045460025f3373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f015461308b9190614cc7565b6130959190614d35565b60025f3373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f20600101819055508060035f8282546130ea9190614c03565b925050819055503373ffffffffffffffffffffffffffffffffffffffff167fe9780a8d2084b8f3e9e1bd2cf042b6f32653d2cc0723f3d3c6662868b89b98fe826040516131379190614772565b60405180910390a261314761424a565b50565b7f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16146131cf576040517f47bc7cc800000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b8060065f8281526020019081526020015f20600401601d9054906101000a900460ff16613228576040517f8d639beb00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b6132306141c5565b613238614209565b5f73ffffffffffffffffffffffffffffffffffffffff1660065f8481526020019081526020015f206004015f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16146132d0576040517f347a9a3b00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b600160065f8481526020019081526020015f20600401601e6101000a81548160ff0219169083151502179055505f7f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff166370a08231306040518263ffffffff1660e01b815260040161335791906149e6565b602060405180830381865afa158015613372573d5f5f3e3d5ffd5b505050506040513d601f19601f820116820180604052508101906133969190614b21565b90505f811115613492577f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff1663a9059cbb7f0000000000000000000000000000000000000000000000000000000000000000836040518363ffffffff1660e01b815260040161341b929190614c6d565b6020604051808303815f875af1158015613437573d5f5f3e3d5ffd5b505050506040513d601f19601f8201168201806040525081019061345b9190614bab565b613491576040517f90b8ec1800000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b5b827f1dc2ed50c72c8c4b871866f02d2016c65e074027f28262223e03b08ca66f10a560405160405180910390a2506134c861424a565b5050565b5f5f5f600354600454600554925092509250909192565b6007602052825f5260405f20602052815f5260405f20602052805f5260405f205f9250925050505481565b6135166141c5565b61351e614209565b60095f8281526020019081526020015f2060030160149054906101000a900460ff1615613577576040517ff4dbea5d00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b3373ffffffffffffffffffffffffffffffffffffffff1660095f8381526020019081526020015f206003015f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff161461360f576040517f618c724200000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b600160095f8381526020019081526020015f2060030160146101000a81548160ff0219169083151502179055505f60095f8381526020019081526020015f205f015490505f81111561372d577f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff1663a9059cbb33836040518363ffffffff1660e01b81526004016136b6929190614c6d565b6020604051808303815f875af11580156136d2573d5f5f3e3d5ffd5b505050506040513d601f19601f820116820180604052508101906136f69190614bab565b61372c576040517f90b8ec1800000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b5b3373ffffffffffffffffffffffffffffffffffffffff16827fcafa13b27c093d2b4251103f8c37f48ab8c8746a1e317de49156178c2ae50e84836040516137749190614772565b60405180910390a35061378561424a565b50565b5f5f60025f8473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f015460025f8573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f206001015491509150915091565b6009602052805f5260405f205f91509050805f015490806001015490806002015490806003015f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff16908060030160149054906101000a900460ff16908060030160159054906101000a900463ffffffff16908060030160199054906101000a900463ffffffff16905087565b7f000000000000000000000000000000000000000000000000000000000000000081565b6006602052805f5260405f205f91509050805f015490806001015490806002015490806003015490806004015f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff16908060040160149054906101000a900463ffffffff16908060040160189054906101000a900463ffffffff169080600401601c9054906101000a900460ff169080600401601d9054906101000a900460ff169080600401601e9054906101000a900460ff1690508a565b6008602052825f5260405f20602052815f5260405f20602052805f5260405f205f92509250509054906101000a900460ff1681565b5f5f60025f8473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f0154036139fc575f9050613aaf565b5f670de0b6b3a764000060045460025f8673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f0154613a539190614cc7565b613a5d9190614d35565b905060025f8473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f206001015481613aab9190614c94565b9150505b919050565b8160065f8281526020019081526020015f20600401601d9054906101000a900460ff16613b0d576040517f8d639beb00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b613b156141c5565b613b1d614209565b5f60075f8581526020019081526020015f205f8481526020019081526020015f205f3373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205490505f8103613bb5576040517fcacf989a00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b60065f8581526020019081526020015f20600401601e9054906101000a900460ff16613f585760085f8581526020019081526020015f205f8481526020019081526020015f205f3373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f9054906101000a900460ff1615613c7a576040517f434d4aea00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b600160085f8681526020019081526020015f205f8581526020019081526020015f205f3373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f6101000a81548160ff021916908315150217905550600160065f8681526020019081526020015f2060040160188282829054906101000a900463ffffffff16613d219190614c36565b92506101000a81548163ffffffff021916908363ffffffff1602179055505f8360065f8781526020019081526020015f206003015403613dac5760065f8681526020019081526020015f206002015460065f8781526020019081526020015f206001015483613d909190614cc7565b613d9a9190614d35565b82613da59190614c03565b9050613e28565b5f5f1b60065f8781526020019081526020015f206003015403613e2357600160065f8781526020019081526020015f2060040160148282829054906101000a900463ffffffff16613dfd9190614d65565b92506101000a81548163ffffffff021916908363ffffffff160217905550819050613e27565b8190505b5b5f811115613f02577f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff1663a9059cbb33836040518363ffffffff1660e01b8152600401613e8b929190614c6d565b6020604051808303815f875af1158015613ea7573d5f5f3e3d5ffd5b505050506040513d601f19601f82011682018060405250810190613ecb9190614bab565b613f01576040517f90b8ec1800000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b5b3373ffffffffffffffffffffffffffffffffffffffff1684867f2078794f8e13514e2437dbe442ed9ed30d2842211dbbede849ae7207c10fabc884604051613f4a9190614772565b60405180910390a450614169565b600160085f8681526020019081526020015f205f8581526020019081526020015f205f3373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f6101000a81548160ff021916908315150217905550600160065f8681526020019081526020015f2060040160188282829054906101000a900463ffffffff16613fff9190614c36565b92506101000a81548163ffffffff021916908363ffffffff1602179055508060065f8681526020019081526020015f206002015f8282546140409190614c94565b925050819055507f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff1663a9059cbb33836040518363ffffffff1660e01b81526004016140a2929190614c6d565b6020604051808303815f875af11580156140be573d5f5f3e3d5ffd5b505050506040513d601f19601f820116820180604052508101906140e29190614bab565b614118576040517f90b8ec1800000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b3373ffffffffffffffffffffffffffffffffffffffff1683857f2078794f8e13514e2437dbe442ed9ed30d2842211dbbede849ae7207c10fabc8846040516141609190614772565b60405180910390a45b5061417261424a565b505050565b600b602052815f5260405f20602052805f5260405f205f915091509054906101000a900460ff1681565b7f000000000000000000000000000000000000000000000000000000000000000081565b60025f5403614200576040517f3ee5aeb500000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b60025f81905550565b6142116125d8565b15614248576040517fd93c066500000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b565b60015f81905550565b5f60025f8373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f0154036142df575f60025f8373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f20600101819055505b50565b5f5f60025f8473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f015403614331575f90506143e4565b5f670de0b6b3a764000060045460025f8673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f01546143889190614cc7565b6143929190614d35565b905060025f8473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f2060010154816143e09190614c94565b9150505b919050565b6143f16144ab565b5f60015f6101000a81548160ff0219169083151502179055507f5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa6144336144eb565b60405161444091906149e6565b60405180910390a1565b614452614209565b6001805f6101000a81548160ff0219169083151502179055507f62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a2586144946144eb565b6040516144a191906149e6565b60405180910390a1565b6144b36125d8565b6144e9576040517f8dfc202b00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b565b5f33905090565b5f5ffd5b5f819050919050565b614508816144f6565b8114614512575f5ffd5b50565b5f81359050614523816144ff565b92915050565b5f819050919050565b61453b81614529565b8114614545575f5ffd5b50565b5f8135905061455681614532565b92915050565b5f5f60408385031215614572576145716144f2565b5b5f61457f85828601614515565b925050602061459085828601614548565b9150509250929050565b5f5f5f606084860312156145b1576145b06144f2565b5b5f6145be86828701614515565b93505060206145cf86828701614548565b92505060406145e086828701614548565b9150509250925092565b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f614613826145ea565b9050919050565b61462381614609565b811461462d575f5ffd5b50565b5f8135905061463e8161461a565b92915050565b5f5f5f5f6080858703121561465c5761465b6144f2565b5b5f61466987828801614515565b945050602061467a87828801614630565b935050604061468b87828801614548565b925050606061469c87828801614548565b91505092959194509250565b5f602082840312156146bd576146bc6144f2565b5b5f6146ca84828501614630565b91505092915050565b6146dc81614529565b82525050565b5f6040820190506146f55f8301856146d3565b61470260208301846146d3565b9392505050565b5f6020828403121561471e5761471d6144f2565b5b5f61472b84828501614515565b91505092915050565b5f5f6040838503121561474a576147496144f2565b5b5f61475785828601614515565b925050602061476885828601614630565b9150509250929050565b5f6020820190506147855f8301846146d3565b92915050565b5f602082840312156147a05761479f6144f2565b5b5f6147ad84828501614548565b91505092915050565b5f5f5f606084860312156147cd576147cc6144f2565b5b5f6147da86828701614515565b93505060206147eb86828701614515565b92505060406147fc86828701614548565b9150509250925092565b5f8115159050919050565b61481a81614806565b82525050565b5f6020820190506148335f830184614811565b92915050565b5f5f6040838503121561484f5761484e6144f2565b5b5f61485c85828601614630565b925050602061486d85828601614548565b9150509250929050565b5f5f5f6060848603121561488e5761488d6144f2565b5b5f61489b86828701614515565b93505060206148ac86828701614630565b92505060406148bd86828701614515565b9150509250925092565b5f6060820190506148da5f8301866146d3565b6148e760208301856146d3565b6148f460408301846146d3565b949350505050565b5f5f5f60608486031215614913576149126144f2565b5b5f61492086828701614515565b935050602061493186828701614515565b925050604061494286828701614630565b9150509250925092565b61495581614609565b82525050565b5f63ffffffff82169050919050565b6149738161495b565b82525050565b5f60e08201905061498c5f83018a6146d3565b61499960208301896146d3565b6149a660408301886146d3565b6149b3606083018761494c565b6149c06080830186614811565b6149cd60a083018561496a565b6149da60c083018461496a565b98975050505050505050565b5f6020820190506149f95f83018461494c565b92915050565b614a08816144f6565b82525050565b5f61014082019050614a225f83018d6146d3565b614a2f602083018c6146d3565b614a3c604083018b6146d3565b614a49606083018a6149ff565b614a56608083018961494c565b614a6360a083018861496a565b614a7060c083018761496a565b614a7d60e0830186614811565b614a8b610100830185614811565b614a99610120830184614811565b9b9a5050505050505050505050565b5f5f60408385031215614abe57614abd6144f2565b5b5f614acb85828601614515565b9250506020614adc85828601614515565b9150509250929050565b5f604082019050614af95f83018561494c565b614b06602083018461494c565b9392505050565b5f81519050614b1b81614532565b92915050565b5f60208284031215614b3657614b356144f2565b5b5f614b4384828501614b0d565b91505092915050565b5f606082019050614b5f5f83018661494c565b614b6c602083018561494c565b614b7960408301846146d3565b949350505050565b614b8a81614806565b8114614b94575f5ffd5b50565b5f81519050614ba581614b81565b92915050565b5f60208284031215614bc057614bbf6144f2565b5b5f614bcd84828501614b97565b91505092915050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52601160045260245ffd5b5f614c0d82614529565b9150614c1883614529565b9250828201905080821115614c3057614c2f614bd6565b5b92915050565b5f614c408261495b565b9150614c4b8361495b565b9250828201905063ffffffff811115614c6757614c66614bd6565b5b92915050565b5f604082019050614c805f83018561494c565b614c8d60208301846146d3565b9392505050565b5f614c9e82614529565b9150614ca983614529565b9250828203905081811115614cc157614cc0614bd6565b5b92915050565b5f614cd182614529565b9150614cdc83614529565b9250828202614cea81614529565b91508282048414831517614d0157614d00614bd6565b5b5092915050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52601260045260245ffd5b5f614d3f82614529565b9150614d4a83614529565b925082614d5a57614d59614d08565b5b828204905092915050565b5f614d6f8261495b565b9150614d7a8361495b565b9250828203905063ffffffff811115614d9657614d95614bd6565b5b9291505056fea2646970667358221220bc6d9649fda12a9512de1b3b46d9f60d28a7ffa84a47f002f713d6903eecd19564736f6c634300081e0033';
