import { vi } from 'vitest';

export const mockAuthService = () => ({
  login: vi.fn(),
  refresh: vi.fn(),
  me: vi.fn(),
  register: vi.fn(),
});

export const mockEmployeeService = () => ({
  list: vi.fn(),
  get: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
});

export const mockAnalyticsService = () => ({
  dashboard: vi.fn(),
  salaryStats: vi.fn(),
  avgSalaryByCountry: vi.fn(),
  avgSalaryByJobTitle: vi.fn(),
  avgSalaryByDepartment: vi.fn(),
  countByCountry: vi.fn(),
  countByDepartment: vi.fn(),
  topCountry: vi.fn(),
  topDepartment: vi.fn(),
});
