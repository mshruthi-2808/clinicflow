import { useQuery } from '@tanstack/react-query';
import { statsApi } from '../api/stats.js';

export function useStats(date) {
  return useQuery({
    queryKey: ['stats', date],
    queryFn: () => statsApi.getStats(date),
    refetchInterval: 15000, // Refresh stats every 15s
    refetchOnWindowFocus: true,
  });
}
