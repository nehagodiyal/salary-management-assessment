import {
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Box,
  Skeleton,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import { formatCurrency, formatNumber } from '@/utils/formatters';
import EmptyState from '@/components/feedback/EmptyState';
import ErrorState from '@/components/feedback/ErrorState';

const RANK_COLORS = ['#f59e0b', '#94a3b8', '#a16207', '#cbd5e1', '#cbd5e1'];

function Rank({ index }) {
  const color = RANK_COLORS[index] || '#e2e8f0';
  return (
    <Box
      sx={{
        width: 26,
        height: 26,
        borderRadius: '50%',
        background: color,
        color: index < 3 ? '#fff' : '#475569',
        fontWeight: 700,
        fontSize: 12,
        display: 'grid',
        placeItems: 'center',
      }}
    >
      {index + 1}
    </Box>
  );
}

/**
 * Ranked table of (group, average_salary, employee_count).
 * `onSelect(group)` is wired to a drill-down link in each row.
 */
export default function LeaderboardTable({
  title,
  subtitle,
  rows = [],
  loading,
  error,
  onRetry,
  limit = 10,
  groupLabel = 'Group',
  onSelect,
  showCount = true,
}) {
  const items = [...(rows || [])]
    .sort((a, b) => b.average_salary - a.average_salary)
    .slice(0, limit);

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>

        {loading && (
          <Stack spacing={1}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} variant="rounded" height={40} />
            ))}
          </Stack>
        )}

        {!loading && error && <ErrorState error={error} onRetry={onRetry} />}

        {!loading && !error && items.length === 0 && (
          <EmptyState title="No data" description="Nothing to rank yet." />
        )}

        {!loading && !error && items.length > 0 && (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 48 }}>#</TableCell>
                <TableCell>{groupLabel}</TableCell>
                <TableCell align="right">Avg salary</TableCell>
                {showCount && <TableCell align="right">Headcount</TableCell>}
                {onSelect && <TableCell sx={{ width: 36 }} />}
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((row, i) => (
                <TableRow
                  key={row.group}
                  hover
                  onClick={onSelect ? () => onSelect(row.group) : undefined}
                  sx={{ cursor: onSelect ? 'pointer' : 'default', '&:last-child td': { borderBottom: 0 } }}
                >
                  <TableCell>
                    <Rank index={i} />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{row.group}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    {formatCurrency(Math.round(row.average_salary))}
                  </TableCell>
                  {showCount && (
                    <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums', color: 'text.secondary' }}>
                      {formatNumber(row.employee_count)}
                    </TableCell>
                  )}
                  {onSelect && (
                    <TableCell align="right" sx={{ p: 0 }}>
                      <Tooltip title="Drill into this group">
                        <IconButton size="small">
                          <OpenInNewIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
