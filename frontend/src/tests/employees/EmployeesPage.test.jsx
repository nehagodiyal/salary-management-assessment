import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import EmployeesPage from '@/pages/employees/EmployeesPage.jsx';
import employeeService from '@/services/employeeService';
import { renderWithProviders, mockEmployee, mockPaginated } from '../testUtils.jsx';

vi.mock('@/services/employeeService');

// Stub the admin user so action buttons render.
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

describe('EmployeesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders employee rows from the API', async () => {
    employeeService.list.mockResolvedValue(
      mockPaginated([
        mockEmployee({ id: '1', full_name: 'Ada Lovelace', salary: 180000 }),
        mockEmployee({ id: '2', full_name: 'Alan Turing', salary: 210000, email: 'alan@example.com' }),
      ]),
    );

    renderWithProviders(<EmployeesPage />, { route: '/employees' });

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('Alan Turing')).toBeInTheDocument();
    expect(screen.getByText('$210,000')).toBeInTheDocument();
  });

  it('opens delete confirmation and calls remove on confirm', async () => {
    employeeService.list.mockResolvedValue(
      mockPaginated([mockEmployee({ id: '1', full_name: 'Ada Lovelace' })]),
    );
    employeeService.remove.mockResolvedValue('1');

    const user = userEvent.setup();
    renderWithProviders(<EmployeesPage />, { route: '/employees' });

    await screen.findByText('Ada Lovelace');
    await user.click(screen.getByLabelText(/delete/i));

    expect(await screen.findByText(/this will permanently remove ada lovelace/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => expect(employeeService.remove).toHaveBeenCalledWith('1'));
  });

  it('shows the empty state when no results', async () => {
    employeeService.list.mockResolvedValue(mockPaginated([]));
    renderWithProviders(<EmployeesPage />, { route: '/employees' });
    expect(await screen.findByText(/no employees found/i)).toBeInTheDocument();
  });
});
