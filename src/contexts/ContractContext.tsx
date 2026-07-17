"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { ethers } from "ethers";
import { useWeb3 } from "@/contexts/Web3Context";
import {
  BOUNTY_BOARD_ABI,
  REPUTATION_SYSTEM_ABI,
  CONTRACT_ADDRESSES,
  BountyStatus,
  SubmissionStatus,
} from "@/lib/contracts";

// Types
export interface Bounty {
  id: number;
  creator: string;
  title: string;
  description: string;
  category: string;
  difficulty: number;
  reward: string;
  deadline: number;
  status: BountyStatus;
  submissionCount: number;
  createdAt: number;
}

export interface Submission {
  id: number;
  bountyId: number;
  submitter: string;
  content: string;
  status: SubmissionStatus;
  submittedAt: number;
  reviewComment: string;
}

export interface ResearcherProfile {
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

interface ContractContextType {
  // Contract instances
  bountyBoardAddress: string | null;
  reputationAddress: string | null;

  // Admin
  isAdmin: boolean;

  // Bounty functions
  getBounties: () => Promise<Bounty[]>;
  getBounty: (id: number) => Promise<Bounty | null>;
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

  // Submission functions
  getSubmissions: (bountyId: number) => Promise<Submission[]>;
  submitSolution: (bountyId: number, content: string) => Promise<string | null>;
  approveSubmission: (submissionId: number, comment: string) => Promise<string | null>;
  rejectSubmission: (submissionId: number, comment: string) => Promise<string | null>;

  // User data
  getUserBounties: (address: string) => Promise<Bounty[]>;
  getUserSubmissions: (address: string) => Promise<Submission[]>;

  // Reputation
  getProfile: (address: string) => Promise<ResearcherProfile | null>;
  getLevel: (address: string) => Promise<{ level: number; name: string } | null>;
  getTopResearchers: (limit: number) => Promise<ResearcherProfile[]>;

  // Stats
  getBountyCount: () => Promise<number>;
  getSubmissionCount: () => Promise<number>;
  getResearcherCount: () => Promise<number>;

  // State
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

const ContractContext = createContext<ContractContextType | null>(null);

export function ContractProvider({ children }: { children: ReactNode }) {
  const { wallet, provider, signer } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Get contract addresses based on chain
  const chainId = wallet.chainId || 31337;
  const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
  const bountyBoardAddress = addresses?.bountyBoard || null;
  const reputationAddress = addresses?.reputationSystem || null;

  const clearError = useCallback(() => setError(null), []);

  // Get read-only contract instance
  const getReadContract = useCallback(
    (address: string, abi: readonly string[]) => {
      if (!provider) return null;
      return new ethers.Contract(address, abi, provider);
    },
    [provider]
  );

  // Get write contract instance
  const getWriteContract = useCallback(
    (address: string, abi: readonly string[]) => {
      if (!signer) return null;
      return new ethers.Contract(address, abi, signer);
    },
    [signer]
  );

  // Check if connected wallet is the contract owner (admin)
  useEffect(() => {
    async function checkAdmin() {
      if (!bountyBoardAddress || !provider || !wallet.address) {
        setIsAdmin(false);
        return;
      }
      try {
        const contract = new ethers.Contract(bountyBoardAddress, BOUNTY_BOARD_ABI, provider);
        const ownerAddr = await contract.owner();
        setIsAdmin(ownerAddr.toLowerCase() === wallet.address.toLowerCase());
      } catch {
        setIsAdmin(false);
      }
    }
    checkAdmin();
  }, [bountyBoardAddress, provider, wallet.address]);

  // Parse bounty from contract response
  const parseBounty = (data: any): Bounty => ({
    id: Number(data.id),
    creator: data.creator,
    title: data.title,
    description: data.description,
    category: data.category,
    difficulty: Number(data.difficulty),
    reward: ethers.formatEther(data.reward),
    deadline: Number(data.deadline) * 1000,
    status: Number(data.status) as BountyStatus,
    submissionCount: Number(data.submissionCount),
    createdAt: Number(data.createdAt) * 1000,
  });

  // Parse submission from contract response
  const parseSubmission = (data: any): Submission => ({
    id: Number(data.id),
    bountyId: Number(data.bountyId),
    submitter: data.submitter,
    content: data.content,
    status: Number(data.status) as SubmissionStatus,
    submittedAt: Number(data.submittedAt) * 1000,
    reviewComment: data.reviewComment,
  });

  // ============================================
  // Bounty Functions
  // ============================================

  const getBounties = useCallback(async (): Promise<Bounty[]> => {
    if (!bountyBoardAddress) return [];
    
    try {
      setLoading(true);
      const contract = getReadContract(bountyBoardAddress, BOUNTY_BOARD_ABI);
      if (!contract) return [];

      const count = await contract.getBountyCount();
      const bounties: Bounty[] = [];

      for (let i = 1; i <= Number(count); i++) {
        const data = await contract.getBounty(i);
        if (data.id > 0) {
          bounties.push(parseBounty(data));
        }
      }

      return bounties.reverse(); // Newest first
    } catch (err) {
      console.error("Failed to get bounties:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [bountyBoardAddress, getReadContract]);

  const getBounty = useCallback(
    async (id: number): Promise<Bounty | null> => {
      if (!bountyBoardAddress) return null;

      try {
        setLoading(true);
        const contract = getReadContract(bountyBoardAddress, BOUNTY_BOARD_ABI);
        if (!contract) return null;

        const data = await contract.getBounty(id);
        if (Number(data.id) === 0) return null;

        return parseBounty(data);
      } catch (err) {
        console.error("Failed to get bounty:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [bountyBoardAddress, getReadContract]
  );

  const createBounty = useCallback(
    async (
      title: string,
      description: string,
      category: string,
      difficulty: number,
      deadline: number,
      reward: string
    ): Promise<string | null> => {
      if (!bountyBoardAddress || !signer) {
        setError("Wallet not connected");
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        const contract = getWriteContract(bountyBoardAddress, BOUNTY_BOARD_ABI);
        if (!contract) {
          setError("Failed to get contract");
          return null;
        }

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
      } catch (err: any) {
        console.error("Failed to create bounty:", err);
        setError(err.reason || err.message || "Failed to create bounty");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [bountyBoardAddress, signer, getWriteContract]
  );

  const cancelBounty = useCallback(
    async (id: number): Promise<string | null> => {
      if (!bountyBoardAddress || !signer) {
        setError("Wallet not connected");
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        const contract = getWriteContract(bountyBoardAddress, BOUNTY_BOARD_ABI);
        if (!contract) return null;

        const tx = await contract.cancelBounty(id);
        const receipt = await tx.wait();
        return receipt.hash;
      } catch (err: any) {
        console.error("Failed to cancel bounty:", err);
        setError(err.reason || err.message || "Failed to cancel bounty");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [bountyBoardAddress, signer, getWriteContract]
  );

  const reclaimExpiredBounty = useCallback(
    async (id: number): Promise<string | null> => {
      if (!bountyBoardAddress || !signer) {
        setError("Wallet not connected");
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        const contract = getWriteContract(bountyBoardAddress, BOUNTY_BOARD_ABI);
        if (!contract) return null;

        const tx = await contract.reclaimExpiredBounty(id);
        const receipt = await tx.wait();
        return receipt.hash;
      } catch (err: any) {
        console.error("Failed to reclaim bounty:", err);
        setError(err.reason || err.message || "Failed to reclaim bounty");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [bountyBoardAddress, signer, getWriteContract]
  );

  // ============================================
  // Submission Functions
  // ============================================

  const getSubmissions = useCallback(
    async (bountyId: number): Promise<Submission[]> => {
      if (!bountyBoardAddress) return [];

      try {
        const contract = getReadContract(bountyBoardAddress, BOUNTY_BOARD_ABI);
        if (!contract) return [];

        const ids = await contract.getBountySubmissions(bountyId);
        const submissions: Submission[] = [];

        for (const id of ids) {
          const data = await contract.getSubmission(Number(id));
          submissions.push(parseSubmission(data));
        }

        return submissions;
      } catch (err) {
        console.error("Failed to get submissions:", err);
        return [];
      }
    },
    [bountyBoardAddress, getReadContract]
  );

  const submitSolution = useCallback(
    async (bountyId: number, content: string): Promise<string | null> => {
      if (!bountyBoardAddress || !signer) {
        setError("Wallet not connected");
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        const contract = getWriteContract(bountyBoardAddress, BOUNTY_BOARD_ABI);
        if (!contract) return null;

        const tx = await contract.submitSolution(bountyId, content);
        const receipt = await tx.wait();
        return receipt.hash;
      } catch (err: any) {
        console.error("Failed to submit solution:", err);
        setError(err.reason || err.message || "Failed to submit solution");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [bountyBoardAddress, signer, getWriteContract]
  );

  const approveSubmission = useCallback(
    async (submissionId: number, comment: string): Promise<string | null> => {
      if (!bountyBoardAddress || !signer) {
        setError("Wallet not connected");
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        const contract = getWriteContract(bountyBoardAddress, BOUNTY_BOARD_ABI);
        if (!contract) return null;

        const tx = await contract.approveSubmission(submissionId, comment);
        const receipt = await tx.wait();
        return receipt.hash;
      } catch (err: any) {
        console.error("Failed to approve submission:", err);
        setError(err.reason || err.message || "Failed to approve submission");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [bountyBoardAddress, signer, getWriteContract]
  );

  const rejectSubmission = useCallback(
    async (submissionId: number, comment: string): Promise<string | null> => {
      if (!bountyBoardAddress || !signer) {
        setError("Wallet not connected");
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        const contract = getWriteContract(bountyBoardAddress, BOUNTY_BOARD_ABI);
        if (!contract) return null;

        const tx = await contract.rejectSubmission(submissionId, comment);
        const receipt = await tx.wait();
        return receipt.hash;
      } catch (err: any) {
        console.error("Failed to reject submission:", err);
        setError(err.reason || err.message || "Failed to reject submission");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [bountyBoardAddress, signer, getWriteContract]
  );

  // ============================================
  // User Data
  // ============================================

  const getUserBounties = useCallback(
    async (address: string): Promise<Bounty[]> => {
      if (!bountyBoardAddress) return [];

      try {
        const contract = getReadContract(bountyBoardAddress, BOUNTY_BOARD_ABI);
        if (!contract) return [];

        const ids = await contract.getUserBounties(address);
        const bountyIds = ids.map((id: bigint) => Number(id));
        
        // Fetch full bounty data for each ID
        const bounties = await Promise.all(
          bountyIds.map(async (id: number) => {
            const data = await contract.getBounty(id);
            return parseBounty(data);
          })
        );
        
        return bounties;
      } catch (err) {
        console.error("Failed to get user bounties:", err);
        return [];
      }
    },
    [bountyBoardAddress, getReadContract]
  );

  const getUserSubmissions = useCallback(
    async (address: string): Promise<Submission[]> => {
      if (!bountyBoardAddress) return [];

      try {
        const contract = getReadContract(bountyBoardAddress, BOUNTY_BOARD_ABI);
        if (!contract) return [];

        const ids = await contract.getUserSubmissions(address);
        const submissionIds = ids.map((id: bigint) => Number(id));
        
        // Fetch full submission data for each ID
        const submissions = await Promise.all(
          submissionIds.map(async (id: number) => {
            const data = await contract.getSubmission(id);
            return parseSubmission(data);
          })
        );
        
        return submissions;
      } catch (err) {
        console.error("Failed to get user submissions:", err);
        return [];
      }
    },
    [bountyBoardAddress, getReadContract]
  );

  // ============================================
  // Reputation
  // ============================================

  const getProfile = useCallback(
    async (address: string): Promise<ResearcherProfile | null> => {
      if (!reputationAddress) return null;

      try {
        const contract = getReadContract(reputationAddress, REPUTATION_SYSTEM_ABI);
        if (!contract) return null;

        const data = await contract.getProfile(address);
        const levelData = await contract.getLevel(address);
        
        return {
          address,
          bountiesCreated: 0, // Not tracked in contract, would need BountyBoard lookup
          bountiesCompleted: Number(data.approvedSubmissions),
          submissionsTotal: Number(data.totalSubmissions),
          submissionsApproved: Number(data.approvedSubmissions),
          totalEarned: ethers.formatEther(data.totalEarnings),
          reputation: Number(data.reputationPoints),
          level: Number(levelData[0]),
          lastActive: Number(data.lastActivityAt) * 1000,
        };
      } catch (err) {
        console.error("Failed to get profile:", err);
        return null;
      }
    },
    [reputationAddress, getReadContract]
  );

  const getLevel = useCallback(
    async (address: string): Promise<{ level: number; name: string } | null> => {
      if (!reputationAddress) return null;

      try {
        const contract = getReadContract(reputationAddress, REPUTATION_SYSTEM_ABI);
        if (!contract) return null;

        const [level, name] = await contract.getLevel(address);
        return { level: Number(level), name };
      } catch (err) {
        console.error("Failed to get level:", err);
        return null;
      }
    },
    [reputationAddress, getReadContract]
  );

  const getTopResearchers = useCallback(
    async (limit: number): Promise<ResearcherProfile[]> => {
      if (!reputationAddress) return [];

      try {
        const contract = getReadContract(reputationAddress, REPUTATION_SYSTEM_ABI);
        if (!contract) return [];

        const [addresses, points] = await contract.getTopResearchers(limit);
        
        // Fetch full profile for each researcher
        const profiles = await Promise.all(
          addresses.map(async (addr: string, index: number) => {
            try {
              const data = await contract.getProfile(addr);
              const levelData = await contract.getLevel(addr);
              return {
                address: addr,
                bountiesCreated: 0,
                bountiesCompleted: Number(data.approvedSubmissions),
                submissionsTotal: Number(data.totalSubmissions),
                submissionsApproved: Number(data.approvedSubmissions),
                totalEarned: ethers.formatEther(data.totalEarnings),
                reputation: Number(points[index]),
                level: Number(levelData[0]),
                lastActive: Number(data.lastActivityAt) * 1000,
              };
            } catch {
              return {
                address: addr,
                bountiesCreated: 0,
                bountiesCompleted: 0,
                submissionsTotal: 0,
                submissionsApproved: 0,
                totalEarned: "0",
                reputation: Number(points[index]),
                level: 0,
                lastActive: 0,
              };
            }
          })
        );
        
        return profiles;
      } catch (err) {
        console.error("Failed to get top researchers:", err);
        return [];
      }
    },
    [reputationAddress, getReadContract]
  );

  // ============================================
  // Stats
  // ============================================

  const getBountyCount = useCallback(async (): Promise<number> => {
    if (!bountyBoardAddress) return 0;

    try {
      const contract = getReadContract(bountyBoardAddress, BOUNTY_BOARD_ABI);
      if (!contract) return 0;
      return Number(await contract.getBountyCount());
    } catch (err) {
      return 0;
    }
  }, [bountyBoardAddress, getReadContract]);

  const getSubmissionCount = useCallback(async (): Promise<number> => {
    if (!bountyBoardAddress) return 0;

    try {
      const contract = getReadContract(bountyBoardAddress, BOUNTY_BOARD_ABI);
      if (!contract) return 0;
      return Number(await contract.getSubmissionCount());
    } catch (err) {
      return 0;
    }
  }, [bountyBoardAddress, getReadContract]);

  const getResearcherCount = useCallback(async (): Promise<number> => {
    if (!reputationAddress) return 0;

    try {
      const contract = getReadContract(reputationAddress, REPUTATION_SYSTEM_ABI);
      if (!contract) return 0;
      return Number(await contract.getResearcherCount());
    } catch (err) {
      return 0;
    }
  }, [reputationAddress, getReadContract]);

  return (
    <ContractContext.Provider
      value={{
        bountyBoardAddress,
        reputationAddress,
        isAdmin,
        getBounties,
        getBounty,
        createBounty,
        cancelBounty,
        reclaimExpiredBounty,
        getSubmissions,
        submitSolution,
        approveSubmission,
        rejectSubmission,
        getUserBounties,
        getUserSubmissions,
        getProfile,
        getLevel,
        getTopResearchers,
        getBountyCount,
        getSubmissionCount,
        getResearcherCount,
        loading,
        error,
        clearError,
      }}
    >
      {children}
    </ContractContext.Provider>
  );
}

export function useContracts() {
  const context = useContext(ContractContext);
  if (!context) {
    throw new Error("useContracts must be used within ContractProvider");
  }
  return context;
}
