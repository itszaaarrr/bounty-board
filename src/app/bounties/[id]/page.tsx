"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { DIFFICULTY_LABELS } from "@/lib/contracts";
import { formatAddress, formatDate } from "@/lib/utils";
import { useContracts, Bounty, Submission } from "@/contexts";
import { useWeb3 } from "@/contexts";

// Mock bounty data (fallback when not connected)
const MOCK_BOUNTY: Bounty = {
  id: 1,
  title: "Implement CRYSTALS-Dilithium Signature Verification",
  description: `Create a reference implementation of CRYSTALS-Dilithium (ML-DSA) signature verification algorithm following NIST FIPS 204 specification.

## Requirements

1. Implement the signature verification algorithm in C or Rust
2. Follow the NIST FIPS 204 specification exactly
3. Optimize for embedded systems with limited memory
4. Include comprehensive test vectors from the NIST submission
5. Provide documentation and usage examples

## Deliverables

- Source code with build instructions
- Test suite with NIST test vectors
- Performance benchmarks
- Technical documentation

## Evaluation Criteria

- Correctness against test vectors
- Code quality and readability
- Performance on target platforms
- Documentation completeness`,
  category: "implementation",
  difficulty: 3,
  reward: "2.5",
  deadline: Date.now() + 7 * 24 * 60 * 60 * 1000,
  status: 1,
  submissionCount: 3,
  creator: "0x1234567890abcdef1234567890abcdef12345678",
  createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
};

const MOCK_SUBMISSIONS: Submission[] = [
  {
    id: 1,
    bountyId: 1,
    submitter: "0xabc123def456abc123def456abc123def456abc1",
    content: "ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
    status: 0,
    submittedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    reviewComment: "",
  },
  {
    id: 2,
    bountyId: 1,
    submitter: "0xdef789abc012def789abc012def789abc012def7",
    content: "Implementation using Rust with no_std support. Full test coverage included.",
    status: 2,
    submittedAt: Date.now() - 12 * 60 * 60 * 1000,
    reviewComment: "Excellent work! All test vectors pass.",
  },
  {
    id: 3,
    bountyId: 1,
    submitter: "0x789012abc345789012abc345789012abc3457890",
    content: "C implementation optimized for ARM Cortex-M4",
    status: 3,
    submittedAt: Date.now() - 6 * 60 * 60 * 1000,
    reviewComment: "Does not pass NIST test vector #42",
  },
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

export default function BountyDetailPage() {
  const params = useParams();
  const bountyId = Number(params.id);
  
  const { wallet } = useWeb3();
  const { 
    getBounty, 
    getSubmissions, 
    submitSolution, 
    approveSubmission, 
    rejectSubmission,
    cancelBounty,
    reclaimExpiredBounty,
    bountyBoardAddress,
    isAdmin,
    loading: contractLoading 
  } = useContracts();
  
  const [bounty, setBounty] = useState<Bounty>(MOCK_BOUNTY);
  const [submissions, setSubmissions] = useState<Submission[]>(MOCK_SUBMISSIONS);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submissionContent, setSubmissionContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isReclaiming, setIsReclaiming] = useState(false);

  // Fetch bounty and submissions from contract
  const fetchData = useCallback(async () => {
    if (wallet.isConnected && bountyBoardAddress && bountyId) {
      setIsLoading(true);
      setError(null);
      
      const [bountyData, submissionsData] = await Promise.all([
        getBounty(bountyId),
        getSubmissions(bountyId)
      ]);
      
      if (bountyData) {
        setBounty(bountyData);
        setSubmissions(submissionsData);
      } else {
        setError("Bounty not found");
      }
      
      setIsLoading(false);
    }
  }, [wallet.isConnected, bountyBoardAddress, bountyId, getBounty, getSubmissions]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isExpired = bounty.deadline < Date.now();
  const daysLeft = Math.ceil((bounty.deadline - Date.now()) / (24 * 60 * 60 * 1000));
  const canSubmit = (bounty.status === 0 || bounty.status === 1) && !isExpired;
  const isCreator = wallet.address?.toLowerCase() === bounty.creator.toLowerCase();
  const canReview = isCreator || isAdmin;
  const canCancel = isCreator && bounty.status === 0 && bounty.submissionCount === 0;
  const canReclaim = isCreator && isExpired && bounty.status !== 3 && bounty.status !== 4;

  const handleSubmit = async () => {
    if (!submissionContent.trim()) return;
    
    setIsSubmitting(true);
    setError(null);
    
    const success = await submitSolution(bountyId, submissionContent);
    
    if (success) {
      setIsSubmitModalOpen(false);
      setSubmissionContent("");
      await fetchData(); // Refresh data
    } else {
      setError("Failed to submit solution. Please try again.");
    }
    
    setIsSubmitting(false);
  };

  const handleApprove = async () => {
    if (!selectedSubmission) return;
    
    setIsReviewing(true);
    const txHash = await approveSubmission(selectedSubmission.id, reviewComment);
    
    if (txHash) {
      setReviewModalOpen(false);
      setSelectedSubmission(null);
      setReviewComment("");
      await fetchData();
    }
    setIsReviewing(false);
  };

  const handleReject = async () => {
    if (!selectedSubmission) return;
    
    setIsReviewing(true);
    const txHash = await rejectSubmission(selectedSubmission.id, reviewComment);
    
    if (txHash) {
      setReviewModalOpen(false);
      setSelectedSubmission(null);
      setReviewComment("");
      await fetchData();
    }
    setIsReviewing(false);
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    setError(null);
    const txHash = await cancelBounty(bountyId);
    if (txHash) {
      await fetchData();
    } else {
      setError("Failed to cancel bounty.");
    }
    setIsCancelling(false);
  };

  const handleReclaim = async () => {
    setIsReclaiming(true);
    setError(null);
    const txHash = await reclaimExpiredBounty(bountyId);
    if (txHash) {
      await fetchData();
    } else {
      setError("Failed to reclaim bounty funds.");
    }
    setIsReclaiming(false);
  };

  const openReviewModal = (submission: Submission) => {
    setSelectedSubmission(submission);
    setReviewComment("");
    setReviewModalOpen(true);
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Back link */}
      <Link 
        href="/bounties" 
        className="text-sm text-blue-600 hover:underline mb-4 inline-block"
      >
        Back to Bounties
      </Link>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bounty header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="text-2xl">{bounty.title}</CardTitle>
                <Badge variant={getStatusVariant(bounty.status)}>
                  {getStatusLabel(bounty.status)}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant={getDifficultyVariant(bounty.difficulty)}>
                  {DIFFICULTY_LABELS[bounty.difficulty as keyof typeof DIFFICULTY_LABELS]}
                </Badge>
                <Badge variant="outline">{bounty.category}</Badge>
                {isCreator && (
                  <Badge variant="secondary">Your Bounty</Badge>
                )}
                {isAdmin && !isCreator && (
                  <Badge variant="warning">Admin</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-neutral-700">
                  {bounty.description}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submissions */}
          <Card>
            <CardHeader>
              <CardTitle>Submissions ({submissions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <p className="text-neutral-500 text-sm">No submissions yet. Be the first to submit a solution.</p>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <div 
                      key={submission.id}
                      className="border border-neutral-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <span className="text-sm font-medium">
                            {formatAddress(submission.submitter)}
                          </span>
                          <span className="text-xs text-neutral-500 ml-2">
                            {formatDate(submission.submittedAt)}
                          </span>
                        </div>
                        <Badge variant={getSubmissionStatusVariant(submission.status)}>
                          {getSubmissionStatusLabel(submission.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-neutral-600 break-all">
                        {submission.content}
                      </p>
                      {submission.reviewComment && (
                        <div className="mt-2 p-2 bg-neutral-50 rounded text-sm">
                          <span className="font-medium">Review: </span>
                          {submission.reviewComment}
                        </div>
                      )}
                      {canReview && submission.status === 0 && (
                        <div className="mt-3 pt-3 border-t border-neutral-100">
                          <Button 
                            size="sm" 
                            onClick={() => openReviewModal(submission)}
                          >
                            Review Submission
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Bounty details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm text-neutral-500">Reward</span>
                <p className="text-2xl font-bold text-blue-600">{bounty.reward} ARM</p>
              </div>
              <div>
                <span className="text-sm text-neutral-500">Deadline</span>
                <p className={`font-medium ${isExpired ? "text-red-600" : ""}`}>
                  {isExpired ? "Expired" : `${daysLeft} days left`}
                </p>
                <p className="text-xs text-neutral-400">
                  {formatDate(bounty.deadline)}
                </p>
              </div>
              <div>
                <span className="text-sm text-neutral-500">Created by</span>
                <p className="font-mono text-sm">{formatAddress(bounty.creator)}</p>
              </div>
              <div>
                <span className="text-sm text-neutral-500">Posted</span>
                <p className="text-sm">{formatDate(bounty.createdAt)}</p>
              </div>
              <div>
                <span className="text-sm text-neutral-500">Submissions</span>
                <p className="font-medium">{bounty.submissionCount}</p>
              </div>

              {canSubmit && !isCreator && (
                <Button 
                  className="w-full mt-4" 
                  onClick={() => setIsSubmitModalOpen(true)}
                >
                  Submit Solution
                </Button>
              )}

              {canCancel && (
                <Button
                  className="w-full mt-4"
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={isCancelling}
                >
                  {isCancelling ? "Cancelling..." : "Cancel Bounty"}
                </Button>
              )}

              {canReclaim && (
                <Button
                  className="w-full mt-4"
                  variant="outline"
                  onClick={handleReclaim}
                  disabled={isReclaiming}
                >
                  {isReclaiming ? "Reclaiming..." : "Reclaim Expired Funds"}
                </Button>
              )}

              {isExpired && !canReclaim && (
                <p className="text-sm text-red-600 text-center mt-4">
                  This bounty has expired
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick stats */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{submissions.filter(s => s.status === 0).length}</p>
                  <p className="text-xs text-neutral-500">Pending</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{submissions.filter(s => s.status === 2).length}</p>
                  <p className="text-xs text-neutral-500">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Submit Modal */}
      <Modal
        open={isSubmitModalOpen}
        onOpenChange={setIsSubmitModalOpen}
        title="Submit Solution"
        description="Provide your solution to this bounty. You can include text, code, or IPFS links."
      >
        <div className="space-y-4">
          <Textarea
            label="Your Solution"
            placeholder="Enter your solution, IPFS hash, or GitHub repository link..."
            value={submissionContent}
            onChange={(e) => setSubmissionContent(e.target.value)}
            rows={8}
          />
          {!wallet.isConnected && (
            <p className="text-sm text-amber-600">
              Please connect your wallet to submit a solution.
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsSubmitModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!submissionContent.trim() || isSubmitting || !wallet.isConnected}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal
        open={reviewModalOpen}
        onOpenChange={setReviewModalOpen}
        title="Review Submission"
        description={`Review the submission from ${selectedSubmission ? formatAddress(selectedSubmission.submitter) : ''}`}
      >
        <div className="space-y-4">
          {selectedSubmission && (
            <div className="p-3 bg-neutral-50 rounded-lg">
              <p className="text-sm text-neutral-600 break-all">
                {selectedSubmission.content}
              </p>
            </div>
          )}
          <Textarea
            label="Review Comment (optional)"
            placeholder="Provide feedback for the submitter..."
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            rows={4}
          />
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setReviewModalOpen(false)}
              disabled={isReviewing}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleReject}
              disabled={isReviewing}
            >
              {isReviewing ? "Processing..." : "Reject"}
            </Button>
            <Button 
              onClick={handleApprove}
              disabled={isReviewing}
            >
              {isReviewing ? "Processing..." : "Approve"}
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
