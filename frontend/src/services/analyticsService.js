import httpClient from '@/api/httpClient';
import endpoints from '@/api/endpoints';

const stripEmpty = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  );

const get = async (url, params) => {
  const cleaned = params && Object.keys(params).length > 0 ? stripEmpty(params) : null;
  const config = cleaned && Object.keys(cleaned).length > 0 ? { params: cleaned } : undefined;
  const { data } = await httpClient.get(url, config);
  return data;
};

export const analyticsService = {
  dashboard: () => get(endpoints.analytics.dashboard),
  salaryStats: () => get(endpoints.analytics.salaryStats),
  salaryStatsForCountry: (country) =>
    get(endpoints.analytics.salaryStatsForCountry(country)),
  avgSalaryByCountry: () => get(endpoints.analytics.avgSalaryByCountry),
  avgSalaryByJobTitle: (country, department) =>
    get(endpoints.analytics.avgSalaryByJobTitle, { country, department }),
  avgSalaryByDepartment: () => get(endpoints.analytics.avgSalaryByDepartment),
  countByCountry: () => get(endpoints.analytics.countByCountry),
  countByDepartment: () => get(endpoints.analytics.countByDepartment),
  topCountry: () => get(endpoints.analytics.topCountry),
  topDepartment: () => get(endpoints.analytics.topDepartment),
  salaryDistribution: (country, department, bucketSize) =>
    get(endpoints.analytics.salaryDistribution, {
      country,
      department,
      bucket_size: bucketSize,
    }),
  percentiles: (country, department) =>
    get(endpoints.analytics.percentiles, { country, department }),
  tenureBands: (country, department) =>
    get(endpoints.analytics.tenureBands, { country, department }),
  hiringTrends: (granularity, country, department) =>
    get(endpoints.analytics.hiringTrends, { granularity, country, department }),
};

export default analyticsService;
