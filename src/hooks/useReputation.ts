"use client";

import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "@/contexts/Web3Context";
import { REPUTATION_SYSTEM_ABI } from "@/lib/contracts";

interface ResearcherProfile {
  totalSubmissions: bigint;
  approvedSubmissions: bigint;
  rejectedSubmissions: bigint;
  totalEarnings: bigint;
  reputationPoints: bigint;
  firstActivityAt: bigint;
  lastActivityAt: bigint;
}

interface LevelInfo {
  level: number;
  name: string;
}

interface UseReputationReturn {
  loading: boolean;
  error: string | null;
  
  getProfile: (address: string) => Promise<ResearcherProfile | null>;
  getLevel: (address: string) => Promise<LevelInfo | null>;
  getResearcherCount: () => Promise<number>;
  getTopResearchers: (limit: number) => Promise<{ addresses: string[]; points: bigint[] } | null>;
}

export function useReputation(contractAddress: string): UseReputationReturn {
  const { provider } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getContract = useCallback(() => {
    if (!provider) {
      throw new Error("Provider not available");
    }
    return new ethers.Contract(
      contractAddress,
      REPUTATION_SYSTEM_ABI,
      provider
    );
  }, [contractAddress, provider]);

  const getProfile = useCallback(
    async (address: string): Promise<ResearcherProfile | null> => {
      try {
        setLoading(true);
        setError(null);
        const contract = getContract();
        const profile = await contract.getProfile(address);
        return profile;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to get profile";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [getContract]
  );

  const getLevel = useCallback(
    async (address: string): Promise<LevelInfo | null> => {
      try {
        setLoading(true);
        setError(null);
        const contract = getContract();
        const [level, name] = await contract.getLevel(address);
        return { level: Number(level), name };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to get level";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [getContract]
  );

  const getResearcherCount = useCallback(async (): Promise<number> => {
    try {
      setLoading(true);
      setError(null);
      const contract = getContract();
      const count = await contract.getResearcherCount();
      return Number(count);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to get researcher count";
      setError(message);
      return 0;
    } finally {
      setLoading(false);
    }
  }, [getContract]);

  const getTopResearchers = useCallback(
    async (limit: number): Promise<{ addresses: string[]; points: bigint[] } | null> => {
      try {
        setLoading(true);
        setError(null);
        const contract = getContract();
        const [addresses, points] = await contract.getTopResearchers(limit);
        return { addresses, points };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to get top researchers";
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
    getProfile,
    getLevel,
    getResearcherCount,
    getTopResearchers,
  };
}
