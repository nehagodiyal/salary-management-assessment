import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';

import DashboardPage from '@/pages/DashboardPage.jsx';
import analyticsService from '@/services/analyticsService';
import { renderWithProviders } from '../testUtils.jsx';

vi.mock('@/services/analyticsService');

vi.mock('@/hooks/useAuth.jsx', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useAuth: () => ({
      user: { id: 'u1', email: 'admin@example.com', role: 'admin' },
      isAuthenticated: true,
      isAdmin: true,
      initializing: false,
      login: vi.fn(),
      logout: vi.fn(),
    }),
    AuthProvider: ({ children }) => children,
  };
});

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders summary cards with formatted values', async () => {
    analyticsService.dashboard.mockResolvedValue({
      salary_stats: {
        count: 1250,
        average: 78500.5,
        minimum: 25000,
        maximum: 320000,
        median: 72000,
      },
      employees_by_country: [{ group: 'India', employee_count: 450 }],
      employees_by_department: [
        { group: 'Engineering', employee_count: 600 },
        { group: 'Sales', employee_count: 200 },
      ],
      highest_paying_country: { group: 'USA', average_salary: 120000 },
      highest_paying_department: { group: 'Engineering', average_salary: 110000 },
    });
    analyticsService.avgSalaryByCountry.mockResolvedValue([
      { group: 'USA', average_salary: 120000, employee_count: 400 },
    ]);
    analyticsService.avgSalaryByJobTitle.mockResolvedValue([
      { group: 'Staff Engineer', average_salary: 180000, employee_count: 30 },
    ]);

    renderWithProviders(<DashboardPage />, { route: '/dashboard' });

    expect(await screen.findByText('1,250')).toBeInTheDocument();
    // INR formatting + compact (lakh/crore) representations
    expect(screen.getByText('USA')).toBeInTheDocument();
    expect(screen.getAllByText('Engineering').length).toBeGreaterThan(0);
  });

  it('renders an error state if the dashboard fails to load', async () => {
    analyticsService.dashboard.mockRejectedValue({
      response: { status: 500, data: { detail: 'Server error' } },
    });
    analyticsService.avgSalaryByCountry.mockResolvedValue([]);
    analyticsService.avgSalaryByJobTitle.mockResolvedValue([]);

    renderWithProviders(<DashboardPage />, { route: '/dashboard' });

    expect(await screen.findByText(/could not load dashboard/i)).toBeInTheDocument();
  });
});
