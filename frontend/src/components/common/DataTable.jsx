import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Box,
  Skeleton,
} from '@mui/material';

import EmptyState from '@/components/feedback/EmptyState';

/**
 * Reusable data table.
 *
 * columns: [{ id, label, accessor: row => node, sortable: boolean, align, width }]
 * rows: array of records
 * sort: { sortBy, sortDir }
 * onSortChange: ({ sortBy, sortDir }) => void
 */
export default function DataTable({
  columns,
  rows,
  rowKey = (r) => r.id,
  onRowClick,
  loading = false,
  sort,
  onSortChange,
  emptyTitle = 'No results',
  emptyDescription = 'Try changing your filters.',
  rowHeight = 56,
  skeletonRows = 8,
}) {
  const handleSort = (columnId) => {
    if (!onSortChange) return;
    const isCurrent = sort?.sortBy === columnId;
    const nextDir = isCurrent && sort.sortDir === 'asc' ? 'desc' : 'asc';
    onSortChange({ sortBy: columnId, sortDir: nextDir });
  };

  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{ borderRadius: 3, overflow: 'hidden' }}
    >
      <Table size="medium" stickyHeader>
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell
                key={col.id}
                align={col.align || 'left'}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.sortable ? (
                  <TableSortLabel
                    active={sort?.sortBy === col.id}
                    direction={sort?.sortBy === col.id ? sort.sortDir : 'asc'}
                    onClick={() => handleSort(col.id)}
                  >
                    {col.label}
                  </TableSortLabel>
                ) : (
                  col.label
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading &&
            Array.from({ length: skeletonRows }).map((_, idx) => (
              <TableRow key={`s-${idx}`} style={{ height: rowHeight }}>
                {columns.map((col) => (
                  <TableCell key={col.id}>
                    <Skeleton variant="text" width="80%" />
                  </TableCell>
                ))}
              </TableRow>
            ))}

          {!loading && rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns.length} sx={{ border: 0 }}>
                <EmptyState title={emptyTitle} description={emptyDescription} />
              </TableCell>
            </TableRow>
          )}

          {!loading &&
            rows.map((row) => (
              <TableRow
                key={rowKey(row)}
                hover={!!onRowClick}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                sx={{
                  cursor: onRowClick ? 'pointer' : 'default',
                  '&:last-child td': { borderBottom: 0 },
                }}
              >
                {columns.map((col) => (
                  <TableCell key={col.id} align={col.align || 'left'}>
                    <Box>{col.accessor(row)}</Box>
                  </TableCell>
                ))}
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
