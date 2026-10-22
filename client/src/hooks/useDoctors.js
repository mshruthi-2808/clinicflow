import { useQuery } from '@tanstack/react-query';
import { doctorsApi } from '../api/doctors.js';

export function useDoctors(params = {}) {
  return useQuery({
    queryKey: ['doctors', params],
    queryFn: () => doctorsApi.getDoctors(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useDoctor(id) {
  return useQuery({
    queryKey: ['doctor', id],
    queryFn: () => doctorsApi.getDoctorById(id),
    enabled: Boolean(id),
  });
}
