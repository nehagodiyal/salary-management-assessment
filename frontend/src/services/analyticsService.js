import httpClient from '@/api/httpClient';
import endpoints from '@/api/endpoints';

const get = async (url) => {
  const { data } = await httpClient.get(url);
  return data;
};

export const analyticsService = {
  dashboard: () => get(endpoints.analytics.dashboard),
  salaryStats: () => get(endpoints.analytics.salaryStats),
  avgSalaryByCountry: () => get(endpoints.analytics.avgSalaryByCountry),
  avgSalaryByJobTitle: () => get(endpoints.analytics.avgSalaryByJobTitle),
  avgSalaryByDepartment: () => get(endpoints.analytics.avgSalaryByDepartment),
  countByCountry: () => get(endpoints.analytics.countByCountry),
  countByDepartment: () => get(endpoints.analytics.countByDepartment),
  topCountry: () => get(endpoints.analytics.topCountry),
  topDepartment: () => get(endpoints.analytics.topDepartment),
};

export default analyticsService;
