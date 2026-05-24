export const endpoints = {
  auth: {
    login: '/auth/login',
    refresh: '/auth/refresh',
    me: '/auth/me',
    register: '/auth/register',
  },
  employees: {
    list: '/employees',
    detail: (id) => `/employees/${id}`,
  },
  analytics: {
    dashboard: '/analytics/dashboard',
    salaryStats: '/analytics/salary-stats',
    avgSalaryByCountry: '/analytics/avg-salary/country',
    avgSalaryByJobTitle: '/analytics/avg-salary/job-title',
    avgSalaryByDepartment: '/analytics/avg-salary/department',
    countByCountry: '/analytics/count/country',
    countByDepartment: '/analytics/count/department',
    topCountry: '/analytics/top/country',
    topDepartment: '/analytics/top/department',
  },
};

export default endpoints;
