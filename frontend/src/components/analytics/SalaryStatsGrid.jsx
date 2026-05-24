import { Box, Card, CardContent, Typography, Chip, Stack, Skeleton, Tooltip } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import {
  formatCurrency,
  formatCurrencyCompact,
  formatNumber,
} from '@/utils/formatters';

const METRICS = [
  { key: 'count', label: 'Employees', fmt: 'number', hint: 'Total records in scope' },
  { key: 'average', label: 'Mean (avg)', fmt: 'currency', hint: 'Arithmetic mean of all salaries' },
  { key: 'median', label: 'Median', fmt: 'currency', hint: '50th percentile — half earn less, half more' },
  { key: 'minimum', label: 'Min', fmt: 'currency-compact', hint: 'Lowest paid in scope' },
  { key: 'maximum', label: 'Max', fmt: 'currency-compact', hint: 'Highest paid in scope' },
];

const fmt = (kind, v) => {
  if (v == null) return '—';
  if (kind === 'number') return formatNumber(v);
  if (kind === 'currency') return formatCurrency(Math.round(v));
  if (kind === 'currency-compact') return formatCurrencyCompact(v);
  return String(v);
};

export default function SalaryStatsGrid({
  stats,
  scopeLabel = 'Global',
  isFiltered = false,
  loading = false,
}) {
  const spread =
    stats?.minimum != null && stats?.maximum != null
      ? stats.maximum - stats.minimum
      : null;

  return (
    <Card>
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              Salary statistics
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isFiltered ? `Filtered to ${scopeLabel}` : 'Across the entire workforce'}
            </Typography>
          </Box>
          <Chip
            size="small"
            label={scopeLabel}
            color={isFiltered ? 'primary' : 'default'}
            variant={isFiltered ? 'filled' : 'outlined'}
          />
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' },
            gap: 1.5,
          }}
        >
          {METRICS.map((m) => (
            <Box
              key={m.key}
              sx={{
                p: 1.5,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                bgcolor: '#fafbff',
              }}
            >
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.5 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}
                >
                  {m.label}
                </Typography>
                <Tooltip title={m.hint} placement="top">
                  <InfoOutlinedIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                </Tooltip>
              </Stack>
              {loading ? (
                <Skeleton width={80} height={28} />
              ) : (
                <Typography variant="h6" sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(m.fmt, stats?.[m.key])}
                </Typography>
              )}
            </Box>
          ))}
        </Box>

        {!loading && spread != null && (
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: 2,
              bgcolor: 'rgba(99, 102, 241, 0.05)',
              border: '1px solid rgba(99, 102, 241, 0.15)',
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              SPREAD (MAX − MIN)
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.25 }}>
              {formatCurrency(spread)}{' '}
              {stats?.average && (
                <Typography component="span" variant="caption" color="text.secondary">
                  ({Math.round((spread / stats.average) * 100)}% of mean)
                </Typography>
              )}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
