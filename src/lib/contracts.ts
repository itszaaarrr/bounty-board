// Contract ABIs for frontend usage
// Auto-generated from compiled contracts

export const BOUNTY_BOARD_ABI = [
  // Events
  "event BountyCreated(uint256 indexed bountyId, address indexed creator, string title, uint256 reward, uint256 deadline)",
  "event BountyUpdated(uint256 indexed bountyId, uint8 status)",
  "event BountyCancelled(uint256 indexed bountyId, address indexed creator)",
  "event SubmissionCreated(uint256 indexed submissionId, uint256 indexed bountyId, address indexed submitter)",
  "event SubmissionReviewed(uint256 indexed submissionId, uint256 indexed bountyId, uint8 status, address indexed reviewer)",
  "event RewardPaid(uint256 indexed bountyId, uint256 indexed submissionId, address indexed recipient, uint256 amount)",
  "event PlatformFeeUpdated(uint256 oldFee, uint256 newFee)",
  "event MinBountyRewardUpdated(uint256 oldMin, uint256 newMin)",
  "event FeesWithdrawn(address indexed recipient, uint256 amount)",
  "event ReputationSystemUpdated(address indexed oldAddress, address indexed newAddress)",
  "event ExpiredBountyReclaimed(uint256 indexed bountyId, address indexed creator, uint256 amount)",

  // Read functions
  "function getBounty(uint256 bountyId) view returns (tuple(uint256 id, address creator, string title, string description, string category, uint8 difficulty, uint256 reward, uint256 deadline, uint8 status, uint256 submissionCount, uint256 createdAt))",
  "function getSubmission(uint256 submissionId) view returns (tuple(uint256 id, uint256 bountyId, address submitter, string content, uint8 status, uint256 submittedAt, string reviewComment))",
  "function getBountySubmissions(uint256 bountyId) view returns (uint256[])",
  "function getUserBounties(address user) view returns (uint256[])",
  "function getUserSubmissions(address user) view returns (uint256[])",
  "function getBountyCount() view returns (uint256)",
  "function getSubmissionCount() view returns (uint256)",
  "function platformFeePercent() view returns (uint256)",
  "function minBountyReward() view returns (uint256)",
  "function accumulatedFees() view returns (uint256)",
  "function reputationSystem() view returns (address)",
  "function owner() view returns (address)",

  // Write functions
  "function createBounty(string title, string description, string category, uint8 difficulty, uint256 deadline) payable",
  "function cancelBounty(uint256 bountyId)",
  "function reclaimExpiredBounty(uint256 bountyId)",
  "function submitSolution(uint256 bountyId, string content)",
  "function approveSubmission(uint256 submissionId, string comment)",
  "function rejectSubmission(uint256 submissionId, string comment)",

  // Admin functions
  "function setReputationSystem(address _reputationSystem)",
  "function setPlatformFee(uint256 feePercent)",
  "function setMinBountyReward(uint256 minReward)",
  "function withdrawFees()",
] as const;

export const REPUTATION_SYSTEM_ABI = [
  // Events
  "event ResearcherRegistered(address indexed researcher)",
  "event ReputationUpdated(address indexed researcher, uint256 newPoints, uint256 totalPoints)",
  "event SubmissionRecorded(address indexed researcher, bool approved, uint256 earnings)",
  "event BountyBoardUpdated(address indexed oldAddress, address indexed newAddress)",

  // Read functions
  "function getProfile(address researcher) view returns (tuple(uint256 totalSubmissions, uint256 approvedSubmissions, uint256 rejectedSubmissions, uint256 totalEarnings, uint256 reputationPoints, uint256 firstActivityAt, uint256 lastActivityAt))",
  "function getLevel(address researcher) view returns (uint256 level, string name)",
  "function getResearcherCount() view returns (uint256)",
  "function getTopResearchers(uint256 limit) view returns (address[], uint256[])",
  "function bountyBoard() view returns (address)",
  "function owner() view returns (address)",

  // Constants
  "function LEVEL_NOVICE() view returns (uint256)",
  "function LEVEL_RESEARCHER() view returns (uint256)",
  "function LEVEL_CRYPTOGRAPHER() view returns (uint256)",
  "function LEVEL_EXPERT() view returns (uint256)",
  "function LEVEL_MASTER() view returns (uint256)",
  "function LEVEL_LEGEND() view returns (uint256)",
  "function MAX_LEADERBOARD_LIMIT() view returns (uint256)",

  // Write functions
  "function recordApprovedSubmission(address researcher, uint8 difficulty, uint256 earnings)",
  "function recordRejectedSubmission(address researcher)",
  "function setBountyBoard(address _bountyBoard)",
] as const;

// Contract addresses (update after deployment)
export const CONTRACT_ADDRESSES = {
  // Hardhat local
  31337: {
    bountyBoard: "",
    reputationSystem: "",
  },
  // Armchain local
  888: {
    bountyBoard: "",
    reputationSystem: "",
  },
  // Armchain testnet
  889: {
    bountyBoard: "",
    reputationSystem: "",
  },
  // Armchain mainnet
  1339: {
    bountyBoard: "",
    reputationSystem: "",
  },
} as const;

// Bounty status enum matching contract
export enum BountyStatus {
  Open = 0,
  InProgress = 1,
  UnderReview = 2,
  Completed = 3,
  Cancelled = 4,
}

// Submission status enum matching contract
export enum SubmissionStatus {
  Pending = 0,
  UnderReview = 1,
  Approved = 2,
  Rejected = 3,
}

// Difficulty levels
export const DIFFICULTY_LABELS = {
  1: "Beginner",
  2: "Intermediate",
  3: "Advanced",
  4: "Expert",
} as const;

// Reputation levels
export const REPUTATION_LEVELS = {
  0: "Novice",
  1: "Researcher",
  2: "Cryptographer",
  3: "Expert",
  4: "Master",
  5: "Legend",
} as const;
