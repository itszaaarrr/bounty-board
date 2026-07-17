/**
 * Core type definitions for the Armchain Bounty Board
 */

// ============================================
// Bounty Types
// ============================================

export type BountyCategory =
  | 'pqc-signatures'
  | 'pqc-kem'
  | 'hash-functions'
  | 'zero-knowledge'
  | 'cryptanalysis'
  | 'implementation'
  | 'formal-verification'
  | 'other';

export type BountyDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type BountyStatus = 'open' | 'in-progress' | 'under-review' | 'completed' | 'cancelled';

export interface Bounty {
  id: string;
  title: string;
  description: string;
  category: BountyCategory;
  difficulty: BountyDifficulty;
  status: BountyStatus;
  reward: bigint;
  creator: string;
  createdAt: number;
  deadline: number;
  submissionCount: number;
  tags: string[];
}

// ============================================
// Submission Types
// ============================================

export type SubmissionStatus = 'pending' | 'under-review' | 'approved' | 'rejected';

export interface Submission {
  id: string;
  bountyId: string;
  submitter: string;
  content: string;
  attachmentHash?: string; // IPFS hash for files
  status: SubmissionStatus;
  submittedAt: number;
  reviewedAt?: number;
  reviewComment?: string;
}

// ============================================
// User/Researcher Types
// ============================================

export interface Researcher {
  address: string;
  reputation: number;
  submissionCount: number;
  approvedCount: number;
  totalEarnings: bigint;
  joinedAt: number;
}

// ============================================
// Web3 Types
// ============================================

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  balance: bigint;
}

// ============================================
// UI Types
// ============================================

export interface PaginationParams {
  page: number;
  limit: number;
  total: number;
}

export interface FilterParams {
  category?: BountyCategory;
  difficulty?: BountyDifficulty;
  status?: BountyStatus;
  minReward?: bigint;
  maxReward?: bigint;
  search?: string;
}
