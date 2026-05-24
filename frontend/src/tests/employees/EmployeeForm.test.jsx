import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import EmployeeForm from '@/components/employees/EmployeeForm.jsx';
import { renderWithProviders, mockEmployee } from '../testUtils.jsx';

describe('EmployeeForm', () => {
  it('validates required fields', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<EmployeeForm onSubmit={onSubmit} submitLabel="Create" />);

    await user.click(screen.getByRole('button', { name: /create/i }));

    expect(await screen.findByText(/full name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a valid payload with numeric salary', async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    const user = userEvent.setup();
    renderWithProviders(
      <EmployeeForm
        initialEmployee={mockEmployee()}
        onSubmit={onSubmit}
        submitLabel="Save"
      />,
    );

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.full_name).toBe('Ada Lovelace');
    expect(typeof payload.salary).toBe('number');
    expect(payload.salary).toBe(180000);
  });

  it('rejects invalid email', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<EmployeeForm onSubmit={onSubmit} submitLabel="Save" />);

    await user.type(screen.getByLabelText(/full name/i), 'Test User');
    await user.type(screen.getByLabelText(/email/i), 'not-an-email');
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(await screen.findByText(/enter a valid email/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
