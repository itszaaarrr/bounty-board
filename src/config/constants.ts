/**
 * Application-wide constants
 */

// ============================================
// Bounty Configuration
// ============================================

export const BOUNTY_CATEGORIES = [
  { value: 'pqc-signatures', label: 'PQC Signatures', description: 'ML-DSA, SLH-DSA, FALCON' },
  { value: 'pqc-kem', label: 'PQC Key Encapsulation', description: 'ML-KEM, CRYSTALS-Kyber' },
  { value: 'hash-functions', label: 'Hash Functions', description: 'SHA-3, SHAKE, Custom constructions' },
  { value: 'zero-knowledge', label: 'Zero Knowledge', description: 'ZK-SNARKs, ZK-STARKs, Bulletproofs' },
  { value: 'cryptanalysis', label: 'Cryptanalysis', description: 'Attack research, Security analysis' },
  { value: 'implementation', label: 'Implementation', description: 'Optimized implementations, Ports' },
  { value: 'formal-verification', label: 'Formal Verification', description: 'Proofs, Security reductions' },
  { value: 'other', label: 'Other', description: 'Miscellaneous challenges' },
] as const;

export const DIFFICULTY_LEVELS = [
  { value: 'beginner', label: 'Beginner', color: 'green', points: 1 },
  { value: 'intermediate', label: 'Intermediate', color: 'yellow', points: 2 },
  { value: 'advanced', label: 'Advanced', color: 'orange', points: 4 },
  { value: 'expert', label: 'Expert', color: 'red', points: 8 },
] as const;

export const BOUNTY_STATUSES = [
  { value: 'open', label: 'Open', color: 'green' },
  { value: 'in-progress', label: 'In Progress', color: 'blue' },
  { value: 'under-review', label: 'Under Review', color: 'yellow' },
  { value: 'completed', label: 'Completed', color: 'gray' },
  { value: 'cancelled', label: 'Cancelled', color: 'red' },
] as const;

// ============================================
// Pagination
// ============================================

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 50;

// ============================================
// Reputation System
// ============================================

export const REPUTATION_LEVELS = [
  { minPoints: 0, name: 'Novice', level: 1 },
  { minPoints: 10, name: 'Researcher', level: 2 },
  { minPoints: 50, name: 'Cryptographer', level: 3 },
  { minPoints: 150, name: 'Expert', level: 4 },
  { minPoints: 500, name: 'Master', level: 5 },
  { minPoints: 1000, name: 'Legend', level: 6 },
] as const;

// ============================================
// UI Configuration
// ============================================

export const TOAST_DURATION = 5000;
export const DEBOUNCE_DELAY = 300;

// ============================================
// Contract Constants
// ============================================

export const MIN_BOUNTY_REWARD = BigInt('1000000000000000000'); // 1 ARM
export const MAX_BOUNTY_DURATION = 365 * 24 * 60 * 60; // 1 year in seconds
export const MIN_BOUNTY_DURATION = 24 * 60 * 60; // 1 day in seconds
