import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import EmployeeForm from '@/components/employees/EmployeeForm.jsx';
import { renderWithProviders, mockEmployee } from '../testUtils.jsx';

// Stub the facets hook so the form never fires real network requests in tests
// and we have a known catalogue to assert against.
vi.mock('@/hooks/useEmployees', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useEmployeeFacets: () => ({
      data: {
        countries: ['India', 'UK', 'United States'],
        departments: ['Engineering', 'HR', 'Sales'],
        job_titles: ['Software Engineer', 'Staff Engineer', 'Recruiter'],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    }),
  };
});

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

  it('renders Country and Department as dropdowns sourced from facets', async () => {
    renderWithProviders(<EmployeeForm onSubmit={vi.fn()} submitLabel="Save" />);

    expect(await screen.findByRole('combobox', { name: /country/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /department/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /job title/i })).toBeInTheDocument();
  });

  it('marks the required fields with an asterisk', async () => {
    renderWithProviders(<EmployeeForm onSubmit={vi.fn()} submitLabel="Save" />);

    // MUI suffixes the visible label with " *" when `required` is set.
    expect(await screen.findByLabelText(/full name \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/salary \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hire date \*/i)).toBeInTheDocument();
    // Phone is the only optional input — no asterisk.
    expect(screen.getByLabelText(/^phone$/i)).toBeInTheDocument();
  });

  it('Job title "Other" reveals a custom text input and submits the custom value', async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    const user = userEvent.setup();
    renderWithProviders(<EmployeeForm onSubmit={onSubmit} submitLabel="Save" />);

    const jobTitleDropdown = await screen.findByRole('combobox', { name: /job title/i });
    await user.click(jobTitleDropdown);

    const otherOption = await screen.findByRole('option', {
      name: /other \(specify below\)/i,
    });
    await user.click(otherOption);

    const customInput = await screen.findByLabelText(/custom job title/i);
    await user.type(customInput, 'Data Platform Architect');

    await user.type(screen.getByLabelText(/full name/i), 'Grace Hopper');
    await user.type(screen.getByLabelText(/email/i), 'grace@example.com');

    const countryDropdown = screen.getByRole('combobox', { name: /country/i });
    await user.click(countryDropdown);
    await user.click(await screen.findByRole('option', { name: 'India' }));

    const deptDropdown = screen.getByRole('combobox', { name: /department/i });
    await user.click(deptDropdown);
    await user.click(await screen.findByRole('option', { name: 'Engineering' }));

    await user.type(screen.getByLabelText(/salary/i), '250000');
    await user.type(screen.getByLabelText(/hire date/i), '2024-01-01');

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.job_title).toBe('Data Platform Architect');
  });

  it('Country "Other" reveals a custom text input and submits the custom value', async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    const user = userEvent.setup();
    renderWithProviders(<EmployeeForm onSubmit={onSubmit} submitLabel="Save" />);

    const countryDropdown = await screen.findByRole('combobox', { name: /country/i });
    await user.click(countryDropdown);
    await user.click(
      await screen.findByRole('option', { name: /other \(specify below\)/i }),
    );

    const customInput = await screen.findByLabelText(/custom country/i);
    await user.type(customInput, 'Switzerland');

    await user.type(screen.getByLabelText(/full name/i), 'Liesel Müller');
    await user.type(screen.getByLabelText(/email/i), 'liesel@example.com');

    const deptDropdown = screen.getByRole('combobox', { name: /department/i });
    await user.click(deptDropdown);
    await user.click(await screen.findByRole('option', { name: 'Engineering' }));

    const jobTitleDropdown = screen.getByRole('combobox', { name: /job title/i });
    await user.click(jobTitleDropdown);
    await user.click(await screen.findByRole('option', { name: 'Software Engineer' }));

    await user.type(screen.getByLabelText(/salary/i), '120000');
    await user.type(screen.getByLabelText(/hire date/i), '2024-01-01');

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.country).toBe('Switzerland');
  });
});
