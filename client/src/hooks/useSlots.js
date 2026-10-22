import { useQuery } from '@tanstack/react-query';
import { doctorsApi } from '../api/doctors.js';

export function useSlots(doctorId, date, options = {}) {
  return useQuery({
    queryKey: ['slots', doctorId, date],
    queryFn: () => doctorsApi.getAvailableSlots(doctorId, date),
    enabled: Boolean(doctorId && date),
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
}
