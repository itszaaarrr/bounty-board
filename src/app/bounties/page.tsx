"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { DIFFICULTY_LABELS } from "@/lib/contracts";
import { formatAddress } from "@/lib/utils";
import { useContracts, Bounty } from "@/contexts/ContractContext";
import { useWeb3 } from "@/contexts/Web3Context";

// Mock data for development (used when not connected)
const MOCK_BOUNTIES: Bounty[] = [
  {
    id: 1,
    title: "Implement CRYSTALS-Dilithium Signature Verification",
    description: "Create a reference implementation of CRYSTALS-Dilithium (ML-DSA) signature verification algorithm following NIST FIPS 204 specification. The implementation should be optimized for embedded systems.",
    category: "implementation",
    difficulty: 3,
    reward: "2.5",
    deadline: Date.now() + 7 * 24 * 60 * 60 * 1000,
    status: 1,
    submissionCount: 3,
    creator: "0x1234567890abcdef1234567890abcdef12345678",
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
  },
  {
    id: 2,
    title: "Cryptanalysis of Proposed Lattice-Based Scheme",
    description: "Analyze the security of a newly proposed lattice-based encryption scheme. Look for potential vulnerabilities in the parameter selection and provide a detailed security assessment.",
    category: "cryptanalysis",
    difficulty: 4,
    reward: "5.0",
    deadline: Date.now() + 14 * 24 * 60 * 60 * 1000,
    status: 0,
    submissionCount: 0,
    creator: "0xabcdef1234567890abcdef1234567890abcdef12",
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
  },
  {
    id: 3,
    title: "Write Technical Documentation for SPHINCS+ Integration",
    description: "Create comprehensive technical documentation for integrating SPHINCS+ signatures into existing PKI infrastructure. Include migration guides and best practices.",
    category: "documentation",
    difficulty: 2,
    reward: "1.0",
    deadline: Date.now() + 21 * 24 * 60 * 60 * 1000,
    status: 0,
    submissionCount: 1,
    creator: "0x9876543210fedcba9876543210fedcba98765432",
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
  },
  {
    id: 4,
    title: "Benchmark PQC Algorithms on ARM Processors",
    description: "Conduct performance benchmarks of NIST-approved PQC algorithms (ML-KEM, ML-DSA, SLH-DSA) on various ARM processor architectures. Provide detailed timing analysis.",
    category: "research",
    difficulty: 3,
    reward: "3.0",
    deadline: Date.now() + 10 * 24 * 60 * 60 * 1000,
    status: 0,
    submissionCount: 2,
    creator: "0x1234567890abcdef1234567890abcdef12345678",
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
  },
];

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "implementation", label: "Implementation" },
  { value: "cryptanalysis", label: "Cryptanalysis" },
  { value: "research", label: "Research" },
  { value: "documentation", label: "Documentation" },
  { value: "audit", label: "Audit" },
];

const DIFFICULTIES = [
  { value: "", label: "All Difficulties" },
  { value: "1", label: "Beginner" },
  { value: "2", label: "Intermediate" },
  { value: "3", label: "Advanced" },
  { value: "4", label: "Expert" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "0", label: "Open" },
  { value: "1", label: "In Progress" },
  { value: "3", label: "Completed" },
];

function getDifficultyVariant(difficulty: number): BadgeVariant {
  switch (difficulty) {
    case 1: return "default";
    case 2: return "secondary";
    case 3: return "warning";
    case 4: return "destructive";
    default: return "default";
  }
}

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

interface BountyCardProps {
  bounty: typeof MOCK_BOUNTIES[0];
}

function BountyCard({ bounty }: BountyCardProps) {
  const isExpired = bounty.deadline < Date.now();
  const daysLeft = Math.ceil((bounty.deadline - Date.now()) / (24 * 60 * 60 * 1000));

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-all">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="line-clamp-2 flex-1">{bounty.title}</CardTitle>
          <Badge variant={getStatusVariant(bounty.status)}>
            {getStatusLabel(bounty.status)}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant={getDifficultyVariant(bounty.difficulty)}>
            {DIFFICULTY_LABELS[bounty.difficulty as keyof typeof DIFFICULTY_LABELS]}
          </Badge>
          <Badge variant="outline">{bounty.category}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-neutral-600 line-clamp-3">{bounty.description}</p>
        <div className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-neutral-600 font-medium">Reward</span>
            <span className="font-semibold text-blue-600">{bounty.reward} ARM</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-600 font-medium">Deadline</span>
            <span className={isExpired ? "text-red-600 font-medium" : "font-medium"}>
              {isExpired ? "Expired" : `${daysLeft} days left`}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-600 font-medium">Submissions</span>
            <span className="font-medium">{bounty.submissionCount}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t border-neutral-100 pt-4 mt-4">
        <div className="w-full flex items-center justify-between">
          <span className="text-xs text-neutral-500">
            by {formatAddress(bounty.creator)}
          </span>
          <Link href={`/bounties/${bounty.id}`}>
            <Button size="sm">View Details</Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}

function BountyCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <div className="flex gap-2 mt-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-24" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6 mb-2" />
        <Skeleton className="h-4 w-4/6" />
        <div className="mt-4 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <div className="w-full flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </CardFooter>
    </Card>
  );
}

export default function BountiesPage() {
  const { wallet } = useWeb3();
  const { getBounties, loading: contractLoading, bountyBoardAddress } = useContracts();
  
  const [bounties, setBounties] = useState<Bounty[]>(MOCK_BOUNTIES);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch bounties from contract when connected
  useEffect(() => {
    async function fetchBounties() {
      if (wallet.isConnected && bountyBoardAddress) {
        setIsLoading(true);
        const contractBounties = await getBounties();
        if (contractBounties.length > 0) {
          setBounties(contractBounties);
        }
        setIsLoading(false);
      } else {
        // Use mock data when not connected
        setBounties(MOCK_BOUNTIES);
      }
    }
    fetchBounties();
  }, [wallet.isConnected, bountyBoardAddress, getBounties]);

  // Filter bounties based on search and filters
  const filteredBounties = bounties.filter((bounty) => {
    const matchesSearch = 
      bounty.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bounty.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !categoryFilter || bounty.category === categoryFilter;
    const matchesDifficulty = !difficultyFilter || bounty.difficulty === parseInt(difficultyFilter);
    const matchesStatus = !statusFilter || bounty.status === parseInt(statusFilter);

    return matchesSearch && matchesCategory && matchesDifficulty && matchesStatus;
  });

  return (
    <PageContainer
      title="Browse Bounties"
      description="Find cryptographic challenges and research tasks to work on"
    >
      {/* Filters */}
      <div className="bg-white border border-neutral-100 rounded-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <Input
              placeholder="Search bounties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={CATEGORIES}
          />
          <Select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            options={DIFFICULTIES}
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={STATUS_OPTIONS}
          />
        </div>
      </div>

      {/* Results count */}
      <div className="mb-6 text-sm font-medium text-neutral-600">
        {filteredBounties.length} {filteredBounties.length === 1 ? 'bounty' : 'bounties'} found
      </div>

      {/* Bounty Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <BountyCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredBounties.length === 0 ? (
        <EmptyState
          title="No bounties found"
          description="Try adjusting your search or filter criteria"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBounties.map((bounty) => (
            <BountyCard key={bounty.id} bounty={bounty} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
