import { Card, CardContent, Stack, Typography, Box, Skeleton } from '@mui/material';

import { formatNumber, titleCase } from '@/utils/formatters';

const STATUS_ACCENT = {
  active: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.10)' },
  on_leave: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.10)' },
  terminated: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.10)' },
};

const STATUS_ORDER = ['active', 'on_leave', 'terminated'];

export default function StatusBreakdown({ data, total, loading, onSelect }) {
  // Build a stable, ordered view even when the API omits a status.
  const byStatus = Object.fromEntries((data || []).map((d) => [d.group, d.employee_count]));
  const rows = STATUS_ORDER.map((status) => ({
    status,
    count: byStatus[status] ?? 0,
    pct: total ? Math.round(((byStatus[status] ?? 0) / total) * 100) : 0,
  }));

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Workforce status
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Click a band to filter the employee list
          </Typography>
        </Stack>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          divider={null}
        >
          {rows.map((row) => {
            const accent = STATUS_ACCENT[row.status];
            return (
              <Box
                key={row.status}
                onClick={() => onSelect?.(row.status)}
                sx={{
                  flex: 1,
                  p: 1.75,
                  borderRadius: 2,
                  bgcolor: accent.bg,
                  border: `1px solid ${accent.color}22`,
                  cursor: onSelect ? 'pointer' : 'default',
                  transition: 'transform 120ms ease, box-shadow 120ms ease',
                  '&:hover': onSelect
                    ? { transform: 'translateY(-1px)', boxShadow: 2 }
                    : {},
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="caption" sx={{ color: accent.color, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      {titleCase(row.status)}
                    </Typography>
                    {loading ? (
                      <Skeleton width={80} height={28} />
                    ) : (
                      <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1, mt: 0.25 }}>
                        {formatNumber(row.count)}
                      </Typography>
                    )}
                    {!loading && (
                      <Typography variant="caption" color="text.secondary">
                        {row.pct}% of workforce
                      </Typography>
                    )}
                  </Box>
                  <Box
                    sx={{
                      width: 36,
                      height: 6,
                      mt: 1,
                      borderRadius: 999,
                      background: accent.color,
                      opacity: 0.6,
                    }}
                  />
                </Stack>
              </Box>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}
