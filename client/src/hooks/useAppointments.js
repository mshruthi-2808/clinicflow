import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi } from '../api/appointments.js';

export function useAppointments(params = {}, options = {}) {
  return useQuery({
    queryKey: ['appointments', params],
    queryFn: () => appointmentsApi.getAppointments(params),
    placeholderData: (previousData) => previousData,
    ...options,
  });
}

export function useAppointment(id) {
  return useQuery({
    queryKey: ['appointment', id],
    queryFn: () => appointmentsApi.getAppointmentById(id),
    enabled: Boolean(id),
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => appointmentsApi.createAppointment(payload),
    onSuccess: () => {
      // Invalidate slots for this doctor so grid reflects the newly taken slot
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      // Invalidate appointment list
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => appointmentsApi.cancelAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
  });
}
