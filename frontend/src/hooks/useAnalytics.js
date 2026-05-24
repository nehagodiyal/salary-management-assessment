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

export const useAvgSalaryByJobTitle = (country, department) =>
  useQuery({
    queryKey: [...queryKeys.analytics.avgByJobTitle, { country, department }],
    queryFn: () => analyticsService.avgSalaryByJobTitle(country, department),
    staleTime: ONE_MINUTE,
  });

export const useAvgSalaryByDepartment = () =>
  useQuery({
    queryKey: queryKeys.analytics.avgByDepartment,
    queryFn: analyticsService.avgSalaryByDepartment,
    staleTime: ONE_MINUTE,
  });

export const useSalaryStatsForCountry = (country) =>
  useQuery({
    queryKey: ['analytics', 'salary-stats', 'country', country],
    queryFn: () => analyticsService.salaryStatsForCountry(country),
    enabled: !!country,
    staleTime: ONE_MINUTE,
  });

export const useSalaryDistribution = (country, department, bucketSize = 25000) =>
  useQuery({
    queryKey: ['analytics', 'salary-distribution', { country, department, bucketSize }],
    queryFn: () => analyticsService.salaryDistribution(country, department, bucketSize),
    staleTime: ONE_MINUTE,
  });

export const usePercentiles = (country, department) =>
  useQuery({
    queryKey: ['analytics', 'percentiles', { country, department }],
    queryFn: () => analyticsService.percentiles(country, department),
    staleTime: ONE_MINUTE,
  });

export const useTenureBands = (country, department) =>
  useQuery({
    queryKey: ['analytics', 'tenure-bands', { country, department }],
    queryFn: () => analyticsService.tenureBands(country, department),
    staleTime: ONE_MINUTE,
  });

export const useHiringTrends = (granularity = 'year', country, department) =>
  useQuery({
    queryKey: ['analytics', 'hiring-trends', { granularity, country, department }],
    queryFn: () => analyticsService.hiringTrends(granularity, country, department),
    staleTime: ONE_MINUTE,
  });
