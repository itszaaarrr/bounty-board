# Step 8: Submission System

## Overview

This step connects the frontend UI to the smart contracts, enabling real bounty creation, viewing, and submission functionality through the ContractContext.

## Components Created

### ContractContext

Location: `src/contexts/ContractContext.tsx`

The ContractContext provides a centralized interface for all smart contract interactions:

#### Types

```typescript
interface Bounty {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: number;
  reward: string;
  deadline: number;
  status: number;
  submissionCount: number;
  creator: string;
  createdAt: number;
}

interface Submission {
  id: number;
  bountyId: number;
  submitter: string;
  content: string;
  status: number;
  submittedAt: number;
  reviewComment: string;
}

interface ResearcherProfile {
  address: string;
  bountiesCreated: number;
  bountiesCompleted: number;
  submissionsTotal: number;
  submissionsApproved: number;
  totalEarned: string;
  reputation: number;
  level: number;
  lastActive: number;
}
```

#### Available Functions

**Bounty Operations:**
- `getBounties()` - Fetch all bounties from the contract
- `getBounty(id)` - Get a specific bounty by ID
- `createBounty(title, description, category, difficulty, deadline, reward)` - Create a new bounty
- `cancelBounty(bountyId)` - Cancel a bounty (creator only)
- `getUserBounties(address)` - Get bounties created by a user

**Submission Operations:**
- `getSubmissions(bountyId)` - Get all submissions for a bounty
- `submitSolution(bountyId, content)` - Submit a solution to a bounty
- `approveSubmission(submissionId, comment)` - Approve a submission (bounty creator only)
- `rejectSubmission(submissionId, comment)` - Reject a submission (bounty creator only)
- `getUserSubmissions(address)` - Get submissions by a user

**Reputation Operations:**
- `getProfile(address)` - Get researcher profile
- `getLevel(address)` - Get researcher level
- `getTopResearchers(limit)` - Get leaderboard

**Statistics:**
- `getStats()` - Get overall platform statistics

## Updated Pages

### Bounties List Page

Location: `src/app/bounties/page.tsx`

Changes:
- Fetches bounties from smart contract when wallet is connected
- Falls back to mock data when not connected
- Loading state during contract queries
- Real-time filtering on contract data

### Bounty Detail Page

Location: `src/app/bounties/[id]/page.tsx`

Changes:
- Fetches bounty and submissions from contract
- Submit solution functionality connected to contract
- Review modal for bounty creators to approve/reject submissions
- Error handling and loading states
- "Your Bounty" badge for creator

### Create Bounty Page

Location: `src/app/bounties/create/page.tsx`

Changes:
- Connected to `createBounty()` contract function
- Contract deployment check with helpful message
- Error state for failed transactions
- Disabled state when contract not available

## UI Enhancements

### Button Component

Added `destructive` variant for rejection actions:
- Red background color
- Used in review modal for reject button

### Error Handling

All pages now include:
- Error state display
- Contract availability checks
- Wallet connection status checks
- Transaction failure handling

## Contract Integration Flow

### Creating a Bounty

1. User fills out form
2. Validation runs on frontend
3. `createBounty()` is called with form data
4. Transaction is sent to BountyBoard contract
5. On success, user is redirected to bounties list
6. On failure, error message is displayed

### Submitting a Solution

1. User clicks "Submit Solution" on bounty detail page
2. Modal opens with textarea
3. User enters solution content (text, IPFS hash, or link)
4. `submitSolution()` is called
5. Transaction is sent to contract
6. Page refreshes to show new submission

### Reviewing Submissions

1. Bounty creator sees "Review Submission" button on pending submissions
2. Clicking opens review modal
3. Creator can add optional comment
4. Creator clicks "Approve" or "Reject"
5. Contract is called with appropriate function
6. On approval, funds are transferred to submitter
7. Page refreshes to show updated status

## Network Configuration

Contract addresses are loaded based on chain ID:
- Hardhat (31337): Local development addresses
- Armchain Local (888): Local testnet addresses
- Armchain Testnet (889): Testnet deployment addresses
- Armchain Mainnet (1339): Mainnet deployment addresses

Deployment addresses are stored in `deployments/<network>/` directories.

## Testing the Integration

### Prerequisites

1. Start local Hardhat node:
   ```bash
   npx hardhat node
   ```

2. Deploy contracts:
   ```bash
   npx hardhat run scripts/deploy-local.js --network localhost
   ```

3. Start frontend:
   ```bash
   npm run dev
   ```

### Test Flow

1. Connect wallet (MetaMask or similar)
2. Navigate to Create Bounty page
3. Fill form and submit
4. Verify bounty appears in list
5. View bounty details
6. From another account, submit a solution
7. From creator account, approve/reject submission
8. Verify reputation updates

## Mock Data Fallback

When wallet is not connected or contract is unavailable, pages display mock data:
- Allows users to preview functionality
- Clear indication that wallet connection is needed
- Seamless transition to real data when connected

## Files Changed

- `src/contexts/ContractContext.tsx` (new)
- `src/contexts/index.ts` (updated exports)
- `src/components/Providers.tsx` (added ContractProvider)
- `src/components/ui/Button.tsx` (added destructive variant)
- `src/app/bounties/page.tsx` (contract integration)
- `src/app/bounties/[id]/page.tsx` (contract integration)
- `src/app/bounties/create/page.tsx` (contract integration)

## Next Steps

- Step 9: Dashboard and Reputation (user profile, my bounties, my submissions)
- Step 10: Polish and Production (error handling, loading states, final testing)
