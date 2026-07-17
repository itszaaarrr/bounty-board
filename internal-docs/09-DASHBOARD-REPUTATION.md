# Step 9: Dashboard and Reputation

## Overview

This step implements the user dashboard and leaderboard pages, providing researchers with insights into their activity, earnings, and reputation within the platform.

## Pages Implemented

### Dashboard Page

Location: `src/app/dashboard/page.tsx`

The dashboard provides a personalized view for authenticated users:

#### Stats Overview
- Bounties Created - Total bounties posted by the user
- Submissions - Total and approved submissions
- Total Earned - Cumulative ARM tokens earned
- Reputation - Points and current level

#### Tabbed Content
- Overview - Quick glance at recent bounties and submissions
- My Bounties - Full list of bounties created by the user
- My Submissions - All solutions submitted by the user

#### Features
- Loading states with skeletons
- Empty states with call-to-action buttons
- Wallet connection prompt for unauthenticated users
- Status badges for bounties and submissions
- Links to bounty detail pages

### Leaderboard Page

Location: `src/app/leaderboard/page.tsx`

Public leaderboard showcasing top researchers:

#### Leaderboard Table
- Rank with highlighted top 3
- Researcher address (formatted)
- Level with color coding
- Reputation points
- Completed bounties
- Total earnings

#### Stats Summary
- Total bounties completed (platform-wide)
- Total rewards distributed
- Active researchers count

#### Features
- Current user highlighting
- Mock data fallback when not connected
- Responsive table design
- Level color progression (Novice to Legend)

## Components Created

### Tabs Component

Location: `src/components/ui/Tabs.tsx`

A simple, accessible tabs component:

```typescript
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

Features:
- Context-based state management
- Active tab styling
- Conditional content rendering

### Badge Size Prop

Added `size` prop to Badge component:
- `sm` - Smaller badges for compact views
- `md` - Default size (existing)

## ContractContext Updates

Updated functions to return full data objects:

### getUserBounties
- Previously: returned `number[]` (IDs only)
- Now: returns `Bounty[]` (full bounty objects)

### getUserSubmissions
- Previously: returned `number[]` (IDs only)
- Now: returns `Submission[]` (full submission objects)

### getTopResearchers
- Previously: returned `{ addresses: string[]; points: number[] }`
- Now: returns `ResearcherProfile[]` (full profile objects)

### ResearcherProfile Interface

Updated to match dashboard/leaderboard needs:
```typescript
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

## Reputation Levels

The platform uses 6 levels based on reputation points:

| Level | Name | Minimum Points |
|-------|------|----------------|
| 0 | Novice | 0 |
| 1 | Apprentice | 100 |
| 2 | Journeyman | 500 |
| 3 | Expert | 2000 |
| 4 | Master | 5000 |
| 5 | Legend | 10000 |

Level colors in UI:
- Novice: Gray
- Apprentice: Green
- Journeyman: Blue
- Expert: Purple
- Master: Orange
- Legend: Red

## Data Flow

### Dashboard
1. User navigates to /dashboard
2. Check wallet connection status
3. If not connected, show connection prompt
4. If connected, fetch user data in parallel:
   - Profile from ReputationSystem
   - Bounties from BountyBoard (by user address)
   - Submissions from BountyBoard (by user address)
5. Display data in stats cards and tabs

### Leaderboard
1. User navigates to /leaderboard
2. Fetch top researchers from ReputationSystem
3. For each researcher, fetch full profile data
4. Display in sortable table
5. Highlight current user if present

## Mock Data

Both pages include mock data for:
- Development without blockchain connection
- Preview functionality for non-connected users
- Graceful degradation

## Files Changed

- `src/app/dashboard/page.tsx` (rewritten)
- `src/app/leaderboard/page.tsx` (rewritten)
- `src/components/ui/Tabs.tsx` (new)
- `src/components/ui/Badge.tsx` (added size prop)
- `src/contexts/ContractContext.tsx` (updated interfaces and functions)

## Testing

### Manual Testing

1. Dashboard without wallet:
   - Should show connection prompt
   
2. Dashboard with wallet:
   - Should fetch and display user data
   - Tabs should switch content
   - Links should navigate to bounty details

3. Leaderboard:
   - Should display researcher rankings
   - Current user should be highlighted
   - Stats should calculate correctly

### Contract Integration

Verify these contract calls work:
- `ReputationSystem.getProfile(address)`
- `ReputationSystem.getLevel(address)`
- `ReputationSystem.getTopResearchers(limit)`
- `BountyBoard.getUserBounties(address)`
- `BountyBoard.getUserSubmissions(address)`

## Next Steps

- Step 10: Polish and Production
  - Comprehensive error handling
  - Loading state improvements
  - Mobile responsiveness audit
  - Performance optimization
  - Final testing and cleanup
