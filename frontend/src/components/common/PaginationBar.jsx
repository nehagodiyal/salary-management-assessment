import { Box, MenuItem, Pagination, Select, Stack, Typography } from '@mui/material';
import { PAGE_SIZE_OPTIONS } from '@/config/constants';

export default function PaginationBar({
  page,
  pageSize,
  total,
  pages,
  onPageChange,
  onPageSizeChange,
}) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      justifyContent="space-between"
      spacing={2}
      sx={{ py: 2 }}
    >
      <Typography variant="body2" color="text.secondary">
        {total === 0 ? 'No records' : `Showing ${start}–${end} of ${total}`}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="body2" color="text.secondary">
            Rows
          </Typography>
          <Select
            size="small"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {PAGE_SIZE_OPTIONS.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </Select>
        </Stack>
        <Pagination
          page={page}
          count={Math.max(pages || 1, 1)}
          onChange={(_, p) => onPageChange(p)}
          color="primary"
          shape="rounded"
          size="small"
        />
      </Box>
    </Stack>
  );
}
