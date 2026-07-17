"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { useWeb3 } from "@/contexts/Web3Context";
import { useContracts, Bounty, Submission, ResearcherProfile } from "@/contexts/ContractContext";
import { DIFFICULTY_LABELS } from "@/lib/contracts";
import { formatAddress, formatDate } from "@/lib/utils";

function getStatusLabel(status: number) {
  switch (status) {
    case 0: return "Open";
    case 1: return "In Progress";
    case 2: return "Under Review";
    case 3: return "Completed";
    case 4: return "Cancelled";
    default: return "Unknown";
  }
}

function getStatusVariant(status: number): BadgeVariant {
  switch (status) {
    case 0: return "success";
    case 1: return "warning";
    case 2: return "secondary";
    case 3: return "default";
    case 4: return "destructive";
    default: return "default";
  }
}

function getSubmissionStatusLabel(status: number) {
  switch (status) {
    case 0: return "Pending";
    case 1: return "Under Review";
    case 2: return "Approved";
    case 3: return "Rejected";
    default: return "Unknown";
  }
}

function getSubmissionStatusVariant(status: number): BadgeVariant {
  switch (status) {
    case 0: return "secondary";
    case 1: return "warning";
    case 2: return "success";
    case 3: return "destructive";
    default: return "default";
  }
}

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

export default function DashboardPage() {
  const { wallet } = useWeb3();
  const { 
    getUserBounties, 
    getUserSubmissions, 
    getProfile, 
    bountyBoardAddress,
    loading: contractLoading 
  } = useContracts();

  const [profile, setProfile] = useState<ResearcherProfile | null>(null);
  const [myBounties, setMyBounties] = useState<Bounty[]>([]);
  const [mySubmissions, setMySubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchData = useCallback(async () => {
    if (!wallet.isConnected || !wallet.address || !bountyBoardAddress) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    const [profileData, bountiesData, submissionsData] = await Promise.all([
      getProfile(wallet.address),
      getUserBounties(wallet.address),
      getUserSubmissions(wallet.address)
    ]);

    setProfile(profileData);
    setMyBounties(bountiesData);
    setMySubmissions(submissionsData);
    setIsLoading(false);
  }, [wallet.isConnected, wallet.address, bountyBoardAddress, getProfile, getUserBounties, getUserSubmissions]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!wallet.isConnected) {
    return (
      <PageContainer
        title="Dashboard"
        description="View your bounties, submissions, and reputation"
      >
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-medium mb-2">Connect Your Wallet</h3>
            <p className="text-neutral-500 mb-4">
              Connect your wallet to view your dashboard
            </p>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  if (isLoading) {
    return (
      <PageContainer
        title="Dashboard"
        description="View your bounties, submissions, and reputation"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Dashboard"
      description="View your bounties, submissions, and reputation"
    >
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-neutral-500">Bounties Created</p>
            <p className="text-2xl font-bold">{profile?.bountiesCreated ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-neutral-500">Submissions</p>
            <p className="text-2xl font-bold">{profile?.submissionsTotal ?? 0}</p>
            <p className="text-xs text-neutral-400">
              {profile?.submissionsApproved ?? 0} approved
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-neutral-500">Total Earned</p>
            <p className="text-2xl font-bold text-blue-600">
              {profile?.totalEarned ?? "0"} ARM
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-neutral-500">Reputation</p>
            <p className="text-2xl font-bold">{profile?.reputation ?? 0}</p>
            <p className="text-xs text-neutral-400">
              Level: {getLevelLabel(profile?.level ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="my-bounties">My Bounties ({myBounties.length})</TabsTrigger>
          <TabsTrigger value="my-submissions">My Submissions ({mySubmissions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Bounties */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Bounties</CardTitle>
              </CardHeader>
              <CardContent>
                {myBounties.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-neutral-500 text-sm mb-4">
                      You haven&apos;t created any bounties yet
                    </p>
                    <Link href="/bounties/create">
                      <Button size="sm">Create Bounty</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myBounties.slice(0, 5).map((bounty) => (
                      <Link 
                        key={bounty.id} 
                        href={`/bounties/${bounty.id}`}
                        className="block p-4 border border-neutral-100 rounded-lg hover:bg-neutral-50 hover:border-neutral-200 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{bounty.title}</p>
                            <p className="text-xs text-neutral-500 mt-1">
                              {bounty.submissionCount} submission{bounty.submissionCount !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <Badge variant={getStatusVariant(bounty.status)} size="sm">
                            {getStatusLabel(bounty.status)}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Submissions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                {mySubmissions.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-neutral-500 text-sm mb-4">
                      You haven&apos;t submitted any solutions yet
                    </p>
                    <Link href="/bounties">
                      <Button size="sm">Browse Bounties</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mySubmissions.slice(0, 5).map((submission) => (
                      <Link 
                        key={submission.id} 
                        href={`/bounties/${submission.bountyId}`}
                        className="block p-4 border border-neutral-100 rounded-lg hover:bg-neutral-50 hover:border-neutral-200 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-neutral-600 truncate">
                              {submission.content.substring(0, 60)}...
                            </p>
                            <p className="text-xs text-neutral-400 mt-1">
                              {formatDate(submission.submittedAt)}
                            </p>
                          </div>
                          <Badge variant={getSubmissionStatusVariant(submission.status)} size="sm">
                            {getSubmissionStatusLabel(submission.status)}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="my-bounties">
          <Card>
            <CardContent className="py-4">
              {myBounties.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-neutral-500 mb-4">
                    You haven&apos;t created any bounties yet
                  </p>
                  <Link href="/bounties/create">
                    <Button>Create Your First Bounty</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {myBounties.map((bounty) => (
                    <div 
                      key={bounty.id}
                      className="border border-neutral-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <Link 
                            href={`/bounties/${bounty.id}`}
                            className="font-medium hover:text-blue-600"
                          >
                            {bounty.title}
                          </Link>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant={getStatusVariant(bounty.status)} size="sm">
                              {getStatusLabel(bounty.status)}
                            </Badge>
                            <Badge variant="outline" size="sm">
                              {bounty.category}
                            </Badge>
                            <span className="text-xs text-neutral-500">
                              {bounty.submissionCount} submission{bounty.submissionCount !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600">{bounty.reward} ARM</p>
                          <p className="text-xs text-neutral-500 mt-1">
                            {formatDate(bounty.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-submissions">
          <Card>
            <CardContent className="py-4">
              {mySubmissions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-neutral-500 mb-4">
                    You haven&apos;t submitted any solutions yet
                  </p>
                  <Link href="/bounties">
                    <Button>Browse Bounties</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {mySubmissions.map((submission) => (
                    <div 
                      key={submission.id}
                      className="border border-neutral-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <Link 
                            href={`/bounties/${submission.bountyId}`}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            View Bounty #{submission.bountyId}
                          </Link>
                          <p className="text-sm text-neutral-600 mt-2 break-all">
                            {submission.content.length > 200 
                              ? submission.content.substring(0, 200) + "..." 
                              : submission.content}
                          </p>
                          {submission.reviewComment && (
                            <div className="mt-2 p-2 bg-neutral-50 rounded text-sm">
                              <span className="font-medium">Review: </span>
                              {submission.reviewComment}
                            </div>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <Badge variant={getSubmissionStatusVariant(submission.status)}>
                            {getSubmissionStatusLabel(submission.status)}
                          </Badge>
                          <p className="text-xs text-neutral-500 mt-2">
                            {formatDate(submission.submittedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
