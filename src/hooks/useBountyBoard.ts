"use client";

import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "@/contexts/Web3Context";
import { BOUNTY_BOARD_ABI, BountyStatus } from "@/lib/contracts";

interface BountyData {
  id: bigint;
  creator: string;
  title: string;
  description: string;
  category: string;
  difficulty: number;
  reward: bigint;
  deadline: bigint;
  status: BountyStatus;
  submissionCount: bigint;
  createdAt: bigint;
}

interface SubmissionData {
  id: bigint;
  bountyId: bigint;
  submitter: string;
  content: string;
  status: number;
  submittedAt: bigint;
  reviewComment: string;
}

interface UseBountyBoardReturn {
  // State
  loading: boolean;
  error: string | null;
  
  // Read functions
  getBounty: (id: number) => Promise<BountyData | null>;
  getSubmission: (id: number) => Promise<SubmissionData | null>;
  getBountySubmissions: (bountyId: number) => Promise<number[]>;
  getUserBounties: (address: string) => Promise<number[]>;
  getUserSubmissions: (address: string) => Promise<number[]>;
  getBountyCount: () => Promise<number>;
  
  // Write functions
  createBounty: (
    title: string,
    description: string,
    category: string,
    difficulty: number,
    deadline: number,
    reward: string
  ) => Promise<string | null>;
  cancelBounty: (id: number) => Promise<string | null>;
  reclaimExpiredBounty: (id: number) => Promise<string | null>;
  submitSolution: (bountyId: number, content: string) => Promise<string | null>;
  approveSubmission: (submissionId: number, comment: string) => Promise<string | null>;
  rejectSubmission: (submissionId: number, comment: string) => Promise<string | null>;
}

export function useBountyBoard(contractAddress: string): UseBountyBoardReturn {
  const { wallet, provider, signer } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getContract = useCallback(
    (needsSigner = false) => {
      if (!provider) {
        throw new Error("Provider not available");
      }
      
      if (needsSigner) {
        if (!signer) {
          throw new Error("Signer not available");
        }
        return new ethers.Contract(contractAddress, BOUNTY_BOARD_ABI, signer);
      }
      
      return new ethers.Contract(
        contractAddress,
        BOUNTY_BOARD_ABI,
        provider
      );
    },
    [contractAddress, provider, signer]
  );

  // Read functions
  const getBounty = useCallback(
    async (id: number): Promise<BountyData | null> => {
      try {
        setError(null);
        const contract = getContract();
        const bounty = await contract.getBounty(id);
        return bounty;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to get bounty";
        setError(message);
        return null;
      }
    },
    [getContract]
  );

  const getSubmission = useCallback(
    async (id: number): Promise<SubmissionData | null> => {
      try {
        setError(null);
        const contract = getContract();
        const submission = await contract.getSubmission(id);
        return submission;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to get submission";
        setError(message);
        return null;
      }
    },
    [getContract]
  );

  const getBountySubmissions = useCallback(
    async (bountyId: number): Promise<number[]> => {
      try {
        setError(null);
        const contract = getContract();
        const ids = await contract.getBountySubmissions(bountyId);
        return ids.map((id: bigint) => Number(id));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to get submissions";
        setError(message);
        return [];
      }
    },
    [getContract]
  );

  const getUserBounties = useCallback(
    async (address: string): Promise<number[]> => {
      try {
        setError(null);
        const contract = getContract();
        const ids = await contract.getUserBounties(address);
        return ids.map((id: bigint) => Number(id));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to get user bounties";
        setError(message);
        return [];
      }
    },
    [getContract]
  );

  const getUserSubmissions = useCallback(
    async (address: string): Promise<number[]> => {
      try {
        setError(null);
        const contract = getContract();
        const ids = await contract.getUserSubmissions(address);
        return ids.map((id: bigint) => Number(id));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to get user submissions";
        setError(message);
        return [];
      }
    },
    [getContract]
  );

  const getBountyCount = useCallback(async (): Promise<number> => {
    try {
      setError(null);
      const contract = getContract();
      const count = await contract.getBountyCount();
      return Number(count);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to get bounty count";
      setError(message);
      return 0;
    }
  }, [getContract]);

  // Write functions
  const createBounty = useCallback(
    async (
      title: string,
      description: string,
      category: string,
      difficulty: number,
      deadline: number,
      reward: string
    ): Promise<string | null> => {
      try {
        setLoading(true);
        setError(null);
        
        const contract = getContract(true);
        const tx = await contract.createBounty(
          title,
          description,
          category,
          difficulty,
          deadline,
          { value: ethers.parseEther(reward) }
        );
        
        const receipt = await tx.wait();
        return receipt.hash;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create bounty";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [getContract]
  );

  const cancelBounty = useCallback(
    async (id: number): Promise<string | null> => {
      try {
        setLoading(true);
        setError(null);
        
        const contract = getContract(true);
        const tx = await contract.cancelBounty(id);
        const receipt = await tx.wait();
        return receipt.hash;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to cancel bounty";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [getContract]
  );

  const reclaimExpiredBounty = useCallback(
    async (id: number): Promise<string | null> => {
      try {
        setLoading(true);
        setError(null);
        
        const contract = getContract(true);
        const tx = await contract.reclaimExpiredBounty(id);
        const receipt = await tx.wait();
        return receipt.hash;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to reclaim bounty";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [getContract]
  );

  const submitSolution = useCallback(
    async (bountyId: number, content: string): Promise<string | null> => {
      try {
        setLoading(true);
        setError(null);
        
        const contract = getContract(true);
        const tx = await contract.submitSolution(bountyId, content);
        const receipt = await tx.wait();
        return receipt.hash;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to submit solution";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [getContract]
  );

  const approveSubmission = useCallback(
    async (submissionId: number, comment: string): Promise<string | null> => {
      try {
        setLoading(true);
        setError(null);
        
        const contract = getContract(true);
        const tx = await contract.approveSubmission(submissionId, comment);
        const receipt = await tx.wait();
        return receipt.hash;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to approve submission";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [getContract]
  );

  const rejectSubmission = useCallback(
    async (submissionId: number, comment: string): Promise<string | null> => {
      try {
        setLoading(true);
        setError(null);
        
        const contract = getContract(true);
        const tx = await contract.rejectSubmission(submissionId, comment);
        const receipt = await tx.wait();
        return receipt.hash;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to reject submission";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [getContract]
  );

  return {
    loading,
    error,
    getBounty,
    getSubmission,
    getBountySubmissions,
    getUserBounties,
    getUserSubmissions,
    getBountyCount,
    createBounty,
    cancelBounty,
    reclaimExpiredBounty,
    submitSolution,
    approveSubmission,
    rejectSubmission,
  };
}
