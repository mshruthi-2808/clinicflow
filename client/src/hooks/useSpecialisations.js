import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { specialisationsApi } from '../api/specialisations.js';
import { useToast } from '../context/ToastContext.jsx';

export function useSpecialisations() {
  return useQuery({
    queryKey: ['specialisations'],
    queryFn: specialisationsApi.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateSpecialisation() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (name) => specialisationsApi.create(name),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['specialisations'] });
      success(`Specialisation "${data.name}" added successfully`);
    },
    onError: (err) => {
      error(err.message || 'Failed to add specialisation');
    },
  });
}
