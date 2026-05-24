import { Card, CardContent, Typography, Box, Skeleton, Stack } from '@mui/material';

import ErrorState from '@/components/feedback/ErrorState';
import EmptyState from '@/components/feedback/EmptyState';

export default function ChartCard({
  title,
  subtitle,
  action,
  height = 320,
  loading,
  error,
  isEmpty,
  emptyDescription = 'No data available yet.',
  children,
  onRetry,
}) {
  return (
    <Card sx={{ height: '100%', overflow: 'hidden' }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          spacing={1}
          sx={{ mb: 2 }}
        >
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
          {action}
        </Stack>
        <Box sx={{ height, width: '100%' }}>
          {loading && <Skeleton variant="rounded" width="100%" height="100%" />}
          {!loading && error && <ErrorState error={error} onRetry={onRetry} />}
          {!loading && !error && isEmpty && (
            <EmptyState title="Nothing to chart" description={emptyDescription} />
          )}
          {!loading && !error && !isEmpty && children}
        </Box>
      </CardContent>
    </Card>
  );
}
