import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Skeleton,
  Chip,
  Tooltip,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import { formatCurrency } from '@/utils/formatters';
import EmptyState from '@/components/feedback/EmptyState';

const PERCENTILES = [
  { key: 'p10', label: 'P10', hint: '10% of employees earn at or below this' },
  { key: 'p25', label: 'P25', hint: 'First quartile — bottom 25%' },
  { key: 'p50', label: 'P50', hint: 'Median — half earn less, half more', highlight: true },
  { key: 'p75', label: 'P75', hint: 'Third quartile — top 25% start here' },
  { key: 'p90', label: 'P90', hint: 'Top 10% earn at or above this' },
  { key: 'p99', label: 'P99', hint: 'Top 1% — exceptional earners' },
];

/**
 * Visual ladder showing salary percentiles. Each rung is a bar whose width
 * is proportional to its value vs P99 (the top of the scale), so the user
 * can eyeball the spread of pay across the workforce.
 */
export default function PercentileLadder({ data, loading, error, scopeLabel }) {
  const max = data?.p99 ?? data?.p90 ?? 1;
  const widthFor = (v) => (v == null ? 0 : Math.max(2, Math.round((v / max) * 100)));
  const isEmpty = !loading && !error && (!data || data.count === 0);

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          sx={{ mb: 2 }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Salary percentiles
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Where each percentile of the workforce sits
            </Typography>
          </Box>
          <Chip
            size="small"
            label={scopeLabel || 'Global'}
            color={scopeLabel && scopeLabel !== 'Global' ? 'primary' : 'default'}
            variant={scopeLabel && scopeLabel !== 'Global' ? 'filled' : 'outlined'}
          />
        </Stack>

        {loading && (
          <Stack spacing={1}>
            {PERCENTILES.map((p) => (
              <Skeleton key={p.key} variant="rounded" height={28} />
            ))}
          </Stack>
        )}

        {isEmpty && (
          <EmptyState
            title="No data in this slice"
            description="No employees match the current filters."
          />
        )}

        {!loading && !isEmpty && (
          <Stack spacing={1.5}>
            {PERCENTILES.map((p) => {
              const value = data?.[p.key];
              const pct = widthFor(value);
              return (
                <Box key={p.key}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 0.5 }}
                  >
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 700,
                          letterSpacing: '0.05em',
                          color: p.highlight ? 'primary.main' : 'text.secondary',
                          minWidth: 32,
                        }}
                      >
                        {p.label}
                      </Typography>
                      <Tooltip title={p.hint} placement="top">
                        <InfoOutlinedIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                      </Tooltip>
                      {p.highlight && (
                        <Chip
                          label="median"
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ height: 18, fontSize: 10 }}
                        />
                      )}
                    </Stack>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        fontVariantNumeric: 'tabular-nums',
                        color: p.highlight ? 'primary.dark' : 'text.primary',
                      }}
                    >
                      {value == null ? '—' : formatCurrency(value)}
                    </Typography>
                  </Stack>
                  <Box
                    sx={{
                      height: 6,
                      borderRadius: 999,
                      bgcolor: 'rgba(99, 102, 241, 0.10)',
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        height: '100%',
                        width: `${pct}%`,
                        background: p.highlight
                          ? 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)'
                          : 'linear-gradient(90deg, #06b6d4 0%, #0ea5e9 100%)',
                        transition: 'width 400ms ease',
                      }}
                    />
                  </Box>
                </Box>
              );
            })}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
