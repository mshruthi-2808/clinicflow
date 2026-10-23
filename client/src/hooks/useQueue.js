import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queueApi } from '../api/queue.js';
import { useToast } from '../context/ToastContext.jsx';

// 1. Patient Queue Tracking Hook (polls every 10s and on window focus, backs off on error)
export function useQueueTracking(appointmentId) {
  return useQuery({
    queryKey: ['queueTracking', appointmentId],
    queryFn: () => queueApi.getAppointmentQueueView(appointmentId),
    enabled: Boolean(appointmentId),
    refetchInterval: (query) => (query.state.status === 'error' ? 30000 : 10000),
    refetchOnWindowFocus: true,
  });
}

// 2. Staff Live Doctor Queue Hook (polls every 5s, backs off on error)
export function useDoctorQueue(doctorId, date, options = {}) {
  return useQuery({
    queryKey: ['doctorQueue', doctorId, date],
    queryFn: () => queueApi.getDoctorQueue(doctorId, date),
    enabled: Boolean(doctorId),
    refetchInterval: (query) => (query.state.status === 'error' ? 30000 : 5000),
    refetchOnWindowFocus: true,
    ...options,
  });
}

// 3. Staff Check-In Mutation
export function useCheckIn() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (appointmentId) => queueApi.checkIn(appointmentId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['doctorQueue'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      const tokenNum = data.queueEntry?.tokenNumber ?? data.tokenNumber;
      success(`Patient checked in successfully! Token #${tokenNum}`);
    },
    onError: (err) => {
      error(err.message || 'Check-in failed');
    },
  });
}

// 4. Staff Call Next Patient Mutation
export function useCallNext() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (doctorId) => queueApi.callNext(doctorId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['doctorQueue'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      const tokenNum = data.queueEntry?.tokenNumber;
      const patientName = data.appointment?.patientName;
      success(`Called next: Token #${tokenNum} (${patientName || 'Patient'})`);
    },
    onError: (err) => {
      error(err.message || 'Could not call next patient');
    },
  });
}

// 5. Staff Complete Consultation Mutation
export function useCompleteQueueEntry() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (entryId) => queueApi.complete(entryId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['doctorQueue'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      const tokenNum = data.queueEntry?.tokenNumber;
      success(`Consultation completed for Token #${tokenNum}`);
    },
    onError: (err) => {
      error(err.message || 'Failed to complete consultation');
    },
  });
}

// 6. Staff Skip Patient Mutation with Optimistic Update
export function useSkipQueueEntry(doctorId, date) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (entryId) => queueApi.skip(entryId),
    onMutate: async (entryId) => {
      const queryKey = ['doctorQueue', doctorId, date];
      await queryClient.cancelQueries({ queryKey });

      const previousQueue = queryClient.getQueryData(queryKey);

      if (previousQueue && previousQueue.entries) {
        queryClient.setQueryData(queryKey, {
          ...previousQueue,
          entries: previousQueue.entries.map((entry) =>
            entry.id === entryId || entry.queueEntryId === entryId
              ? { ...entry, status: 'SKIPPED' }
              : entry
          ),
        });
      }

      return { previousQueue, queryKey };
    },
    onError: (err, _entryId, context) => {
      if (context?.previousQueue && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousQueue);
      }
      error(err.message || 'Failed to skip patient');
    },
    onSuccess: (data) => {
      const tokenNum = data.queueEntry?.tokenNumber;
      success(`Token #${tokenNum} skipped (marked as No-Show)`);
    },
    onSettled: (_data, _error, _variables, context) => {
      if (context?.queryKey) {
        queryClient.invalidateQueries({ queryKey: context.queryKey });
      }
      queryClient.invalidateQueries({ queryKey: ['doctorQueue'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}
