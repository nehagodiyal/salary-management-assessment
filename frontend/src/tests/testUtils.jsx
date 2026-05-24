import { render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import theme from '@/styles/theme';
import { SnackbarProvider } from '@/hooks/useSnackbar.jsx';
import { AuthProvider } from '@/hooks/useAuth.jsx';

export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
    logger: { log: () => {}, warn: () => {}, error: () => {} },
  });

export function renderWithProviders(ui, options = {}) {
  const {
    route = '/',
    queryClient = createTestQueryClient(),
    withAuth = true,
    ...rest
  } = options;

  const Wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={[route]}>
          <SnackbarProvider>
            {withAuth ? <AuthProvider>{children}</AuthProvider> : children}
          </SnackbarProvider>
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );

  return { queryClient, ...render(ui, { wrapper: Wrapper, ...rest }) };
}

export const mockEmployee = (overrides = {}) => ({
  id: 'emp-1',
  full_name: 'Ada Lovelace',
  email: 'ada@example.com',
  phone: '+15551234',
  country: 'UK',
  department: 'Engineering',
  job_title: 'Staff Engineer',
  salary: 180000,
  hire_date: '2022-01-15',
  status: 'active',
  created_at: '2022-01-15T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
  ...overrides,
});

export const mockPaginated = (items = [], total = null, page = 1, pageSize = 20) => ({
  items,
  total: total ?? items.length,
  page,
  page_size: pageSize,
  pages: Math.max(1, Math.ceil((total ?? items.length) / pageSize)),
});
