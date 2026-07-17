"use client";

import { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useWeb3 } from "@/contexts/Web3Context";
import { useContracts, ResearcherProfile } from "@/contexts/ContractContext";
import { formatAddress } from "@/lib/utils";

function getLevelLabel(level: number) {
  switch (level) {
    case 0: return "Novice";
    case 1: return "Researcher";
    case 2: return "Cryptographer";
    case 3: return "Expert";
    case 4: return "Master";
    case 5: return "Legend";
    default: return "Unknown";
  }
}

function getLevelColor(level: number) {
  switch (level) {
    case 0: return "text-neutral-500";
    case 1: return "text-green-600";
    case 2: return "text-blue-600";
    case 3: return "text-purple-600";
    case 4: return "text-orange-600";
    case 5: return "text-red-600";
    default: return "text-neutral-500";
  }
}

// Mock leaderboard data (used when not connected)
const MOCK_LEADERBOARD: ResearcherProfile[] = [
  {
    address: "0x1234567890abcdef1234567890abcdef12345678",
    bountiesCreated: 5,
    bountiesCompleted: 12,
    submissionsTotal: 25,
    submissionsApproved: 18,
    totalEarned: "45.5",
    reputation: 2850,
    level: 4,
    lastActive: Date.now() - 2 * 60 * 60 * 1000,
  },
  {
    address: "0xabcdef1234567890abcdef1234567890abcdef12",
    bountiesCreated: 8,
    bountiesCompleted: 8,
    submissionsTotal: 15,
    submissionsApproved: 12,
    totalEarned: "32.0",
    reputation: 1920,
    level: 3,
    lastActive: Date.now() - 5 * 60 * 60 * 1000,
  },
  {
    address: "0x7890abcdef1234567890abcdef1234567890abcd",
    bountiesCreated: 2,
    bountiesCompleted: 15,
    submissionsTotal: 30,
    submissionsApproved: 22,
    totalEarned: "28.75",
    reputation: 1650,
    level: 3,
    lastActive: Date.now() - 1 * 24 * 60 * 60 * 1000,
  },
  {
    address: "0xdef1234567890abcdef1234567890abcdef123456",
    bountiesCreated: 0,
    bountiesCompleted: 10,
    submissionsTotal: 18,
    submissionsApproved: 14,
    totalEarned: "18.2",
    reputation: 980,
    level: 2,
    lastActive: Date.now() - 3 * 24 * 60 * 60 * 1000,
  },
  {
    address: "0x4567890abcdef1234567890abcdef1234567890ab",
    bountiesCreated: 3,
    bountiesCompleted: 5,
    submissionsTotal: 8,
    submissionsApproved: 6,
    totalEarned: "12.0",
    reputation: 720,
    level: 2,
    lastActive: Date.now() - 7 * 24 * 60 * 60 * 1000,
  },
];

export default function LeaderboardPage() {
  const { wallet } = useWeb3();
  const { getTopResearchers, bountyBoardAddress } = useContracts();
  
  const [researchers, setResearchers] = useState<ResearcherProfile[]>(MOCK_LEADERBOARD);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      if (wallet.isConnected && bountyBoardAddress) {
        setIsLoading(true);
        const topResearchers = await getTopResearchers(20);
        if (topResearchers.length > 0) {
          setResearchers(topResearchers);
        }
        setIsLoading(false);
      } else {
        setResearchers(MOCK_LEADERBOARD);
        setIsLoading(false);
      }
    }
    
    fetchLeaderboard();
  }, [wallet.isConnected, bountyBoardAddress, getTopResearchers]);

  return (
    <PageContainer
      title="Leaderboard"
      description="Top researchers by reputation"
    >
      {!wallet.isConnected && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 mb-6 font-medium">
          Connect your wallet to see live leaderboard data
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Top Researchers</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : researchers.length === 0 ? (
            <p className="text-neutral-500 text-center py-12 text-base">
              No researchers found. Be the first to earn reputation.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50">
                    <th className="text-left py-4 px-4 text-sm font-semibold text-neutral-600">Rank</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-neutral-600">Researcher</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-neutral-600">Level</th>
                    <th className="text-right py-4 px-4 text-sm font-semibold text-neutral-600">Reputation</th>
                    <th className="text-right py-4 px-4 text-sm font-semibold text-neutral-600">Completed</th>
                    <th className="text-right py-4 px-4 text-sm font-semibold text-neutral-600">Earned</th>
                  </tr>
                </thead>
                <tbody>
                  {researchers.map((researcher, index) => {
                    const isCurrentUser = wallet.address?.toLowerCase() === researcher.address.toLowerCase();
                    return (
                      <tr 
                        key={researcher.address}
                        className={`border-b border-neutral-100 transition-colors ${isCurrentUser ? "bg-blue-50" : "hover:bg-neutral-50"}`}
                      >
                        <td className="py-4 px-4">
                          <span className={`font-bold text-lg ${index < 3 ? "text-blue-600" : "text-neutral-400"}`}>
                            #{index + 1}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-neutral-700">
                              {formatAddress(researcher.address)}
                            </span>
                            {isCurrentUser && (
                              <Badge variant="secondary" size="sm">You</Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`font-semibold ${getLevelColor(researcher.level)}`}>
                            {getLevelLabel(researcher.level)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right font-bold text-neutral-900">
                          {researcher.reputation.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-right font-medium text-neutral-700">
                          {researcher.bountiesCompleted}
                        </td>
                        <td className="py-4 px-4 text-right text-blue-600 font-semibold">
                          {researcher.totalEarned} ARM
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-5xl font-bold text-blue-600">
              {researchers.reduce((sum, r) => sum + r.bountiesCompleted, 0)}
            </p>
            <p className="text-base text-neutral-600 mt-3 font-medium">Total Bounties Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-5xl font-bold text-blue-600">
              {researchers.reduce((sum, r) => sum + parseFloat(r.totalEarned), 0).toFixed(1)} <span className="text-3xl">ARM</span>
            </p>
            <p className="text-base text-neutral-600 mt-3 font-medium">Total Rewards Distributed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-5xl font-bold text-blue-600">
              {researchers.length}
            </p>
            <p className="text-base text-neutral-600 mt-3 font-medium">Active Researchers</p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
