import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";

/**
 * Hook to check if a specific feature flag is enabled
 */
export function useFeatureFlag(key: string) {
  const { data, isLoading, error } = useQuery({
    ...trpc.featureFlags.isEnabled.queryOptions({ key }),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    enabled: data?.enabled ?? false,
    isLoading,
    error,
  };
}

/**
 * Hook to get all feature flags at once
 */
export function useAllFeatureFlags() {
  const { data, isLoading, error, refetch } = useQuery({
    ...trpc.featureFlags.getAll.queryOptions(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    flags: data ?? {},
    isLoading,
    error,
    refetch,
  };
}

/**
 * Higher-order component to conditionally render based on feature flag
 */
export function FeatureFlag({
  flag,
  children,
  fallback = null,
}: {
  flag: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { enabled, isLoading } = useFeatureFlag(flag);

  if (isLoading) {
    return fallback;
  }

  return enabled ? children : fallback;
}
