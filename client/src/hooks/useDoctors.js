import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doctorsApi } from '../api/doctors.js';
import { useToast } from '../context/ToastContext.jsx';

export function useDoctors(params = {}, options = {}) {
  return useQuery({
    queryKey: ['doctors', params],
    queryFn: () => doctorsApi.getDoctors(params),
    placeholderData: (previousData) => previousData,
    ...options,
  });
}

export function useDoctor(id) {
  return useQuery({
    queryKey: ['doctor', id],
    queryFn: () => doctorsApi.getDoctorById(id),
    enabled: Boolean(id),
  });
}

export function useCreateDoctor() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload) => doctorsApi.createDoctor(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      success(`Doctor ${data.name} added successfully`);
    },
    onError: (err) => {
      error(err.message || 'Failed to add doctor');
    },
  });
}

export function useUpdateDoctor() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => doctorsApi.updateDoctor(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      queryClient.invalidateQueries({ queryKey: ['doctor', data.id] });
      success(`Doctor ${data.name} updated successfully`);
    },
    onError: (err) => {
      error(err.message || 'Failed to update doctor');
    },
  });
}

export function useDeactivateDoctor() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id) => doctorsApi.deactivateDoctor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      success('Doctor deactivated successfully');
    },
    onError: (err) => {
      error(err.message || 'Failed to deactivate doctor');
    },
  });
}
