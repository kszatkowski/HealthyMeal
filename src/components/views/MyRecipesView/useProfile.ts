import { useCallback, useEffect, useState } from "react";
import type { ProfileResponseDto } from "@/types";

interface UseProfileResult {
  profile: ProfileResponseDto | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching user profile data.
 * Retrieves profile information including AI requests count on component mount.
 */
export function useProfile(): UseProfileResult {
  const [profile, setProfile] = useState<ProfileResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetches profile from API
   */
  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/profile", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const data = (await response.json()) as ProfileResponseDto;
      setProfile(data);
    } catch (fetchError) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : "Failed to load profile";
      setError(new Error(errorMessage));
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch profile on mount
   */
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    isLoading,
    error,
    refetch: fetchProfile,
  };
}
