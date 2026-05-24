import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import DataTable from '@/components/common/DataTable.jsx';
import { renderWithProviders } from '../testUtils.jsx';

const columns = [
  { id: 'name', label: 'Name', sortable: true, accessor: (r) => r.name },
  { id: 'age', label: 'Age', accessor: (r) => r.age },
];

describe('DataTable', () => {
  it('renders rows', () => {
    renderWithProviders(
      <DataTable
        columns={columns}
        rows={[
          { id: 1, name: 'Ada', age: 36 },
          { id: 2, name: 'Alan', age: 41 },
        ]}
      />,
    );
    expect(screen.getByText('Ada')).toBeInTheDocument();
    expect(screen.getByText('Alan')).toBeInTheDocument();
  });

  it('shows the empty state when there are no rows', () => {
    renderWithProviders(<DataTable columns={columns} rows={[]} emptyTitle="Nada" />);
    expect(screen.getByText('Nada')).toBeInTheDocument();
  });

  it('toggles sort direction on header click', async () => {
    const onSortChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <DataTable
        columns={columns}
        rows={[{ id: 1, name: 'Ada', age: 36 }]}
        sort={{ sortBy: 'name', sortDir: 'asc' }}
        onSortChange={onSortChange}
      />,
    );

    await user.click(screen.getByText('Name'));
    expect(onSortChange).toHaveBeenCalledWith({ sortBy: 'name', sortDir: 'desc' });
  });
});
