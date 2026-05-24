export const queryKeys = {
  auth: {
    me: ['auth', 'me'],
  },
  employees: {
    all: ['employees'],
    list: (params) => ['employees', 'list', params],
    detail: (id) => ['employees', 'detail', id],
    facets: ['employees', 'facets'],
  },
  analytics: {
    dashboard: ['analytics', 'dashboard'],
    salaryStats: ['analytics', 'salary-stats'],
    avgByCountry: ['analytics', 'avg-salary', 'country'],
    avgByJobTitle: ['analytics', 'avg-salary', 'job-title'],
    avgByDepartment: ['analytics', 'avg-salary', 'department'],
    countByCountry: ['analytics', 'count', 'country'],
    countByDepartment: ['analytics', 'count', 'department'],
    topCountry: ['analytics', 'top', 'country'],
    topDepartment: ['analytics', 'top', 'department'],
  },
};

export default queryKeys;
