import { useQuery } from '@tanstack/react-query';
import { specialisationsApi } from '../api/specialisations.js';

export function useSpecialisations() {
  return useQuery({
    queryKey: ['specialisations'],
    queryFn: specialisationsApi.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
