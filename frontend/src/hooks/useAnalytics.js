import { useQuery } from '@tanstack/react-query';

import analyticsService from '@/services/analyticsService';
import queryKeys from '@/utils/queryKeys';

const ONE_MINUTE = 60_000;

export const useDashboardSummary = () =>
  useQuery({
    queryKey: queryKeys.analytics.dashboard,
    queryFn: analyticsService.dashboard,
    staleTime: ONE_MINUTE,
  });

export const useAvgSalaryByCountry = () =>
  useQuery({
    queryKey: queryKeys.analytics.avgByCountry,
    queryFn: analyticsService.avgSalaryByCountry,
    staleTime: ONE_MINUTE,
  });

export const useAvgSalaryByJobTitle = () =>
  useQuery({
    queryKey: queryKeys.analytics.avgByJobTitle,
    queryFn: analyticsService.avgSalaryByJobTitle,
    staleTime: ONE_MINUTE,
  });

export const useAvgSalaryByDepartment = () =>
  useQuery({
    queryKey: queryKeys.analytics.avgByDepartment,
    queryFn: analyticsService.avgSalaryByDepartment,
    staleTime: ONE_MINUTE,
  });
