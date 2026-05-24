import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import LoginPage from '@/pages/auth/LoginPage.jsx';
import authService from '@/services/authService';
import { renderWithProviders } from '../testUtils.jsx';

vi.mock('@/services/authService');

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows validation errors for empty submit', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { route: '/login' });
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  it('signs in an admin and stores the access token', async () => {
    authService.login.mockResolvedValue({
      access_token: 'abc.def.ghi',
      refresh_token: 'refresh.token',
      token_type: 'bearer',
    });
    authService.me.mockResolvedValue({
      id: 'u1',
      email: 'admin@example.com',
      role: 'admin',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    });

    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { route: '/login' });

    await user.type(screen.getByLabelText(/email/i), 'admin@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(authService.login).toHaveBeenCalledTimes(1));
    expect(localStorage.getItem('sm.accessToken')).toBe('abc.def.ghi');
  });

  it('shows an error when credentials are invalid', async () => {
    authService.login.mockRejectedValue({
      response: { status: 401, data: { detail: 'Invalid credentials' } },
    });

    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { route: '/login' });

    await user.type(screen.getByLabelText(/email/i), 'admin@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
  });

  it('rejects non-admin users post-login', async () => {
    authService.login.mockResolvedValue({
      access_token: 'tok',
      refresh_token: 'r',
      token_type: 'bearer',
    });
    authService.me.mockResolvedValue({
      id: 'u2',
      email: 'plain@example.com',
      role: 'user',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    });

    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { route: '/login' });

    await user.type(screen.getByLabelText(/email/i), 'plain@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/only administrators/i)).toBeInTheDocument();
    expect(localStorage.getItem('sm.accessToken')).toBeNull();
  });
});
