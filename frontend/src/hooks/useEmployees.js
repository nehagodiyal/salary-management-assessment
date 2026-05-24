import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import employeeService from '@/services/employeeService';
import queryKeys from '@/utils/queryKeys';

export const useEmployeesQuery = (params) =>
  useQuery({
    queryKey: queryKeys.employees.list(params),
    queryFn: () => employeeService.list(params),
    keepPreviousData: true,
  });

export const useEmployeeQuery = (id) =>
  useQuery({
    queryKey: queryKeys.employees.detail(id),
    queryFn: () => employeeService.get(id),
    enabled: !!id,
  });

export const useEmployeeFacets = () =>
  useQuery({
    queryKey: queryKeys.employees.facets,
    queryFn: () => employeeService.facets(),
    // Facets only change when someone adds a brand-new value — cache aggressively.
    staleTime: 5 * 60_000,
  });

export const useCreateEmployee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => employeeService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.employees.all });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};

export const useUpdateEmployee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => employeeService.update(id, payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.employees.all });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      if (data?.id) {
        qc.setQueryData(queryKeys.employees.detail(data.id), data);
      }
    },
  });
};

export const useDeleteEmployee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => employeeService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.employees.all });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};
