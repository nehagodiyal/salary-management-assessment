import { Box, Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import StackedLineChartIcon from '@mui/icons-material/StackedLineChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import VerticalAlignTopIcon from '@mui/icons-material/VerticalAlignTop';

import PageHeader from '@/components/feedback/PageHeader';
import ChartCard from '@/components/dashboard/ChartCard';
import AvgSalaryByCountryChart from '@/components/charts/AvgSalaryByCountryChart';
import DepartmentDistributionChart from '@/components/charts/DepartmentDistributionChart';
import HighestPayingJobsChart from '@/components/charts/HighestPayingJobsChart';
import {
  useAvgSalaryByCountry,
  useAvgSalaryByDepartment,
  useAvgSalaryByJobTitle,
  useDashboardSummary,
} from '@/hooks/useAnalytics';
import { formatCurrency, formatCurrencyCompact, formatNumber } from '@/utils/formatters';

const METRIC_ROWS = [
  { key: 'count', label: 'Employees', icon: GroupsIcon, fmt: 'number' },
  { key: 'average', label: 'Average', icon: StackedLineChartIcon, fmt: 'currency' },
  { key: 'median', label: 'Median', icon: TimelineIcon, fmt: 'currency' },
  { key: 'minimum', label: 'Minimum', icon: EqualizerIcon, fmt: 'currency-compact' },
  { key: 'maximum', label: 'Maximum', icon: VerticalAlignTopIcon, fmt: 'currency-compact' },
];

function MetricRow({ icon: Icon, label, value }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{
        py: 1.25,
        borderBottom: '1px dashed',
        borderColor: 'divider',
        '&:last-of-type': { borderBottom: 'none' },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1.5,
            bgcolor: 'rgba(99,102,241,0.08)',
            color: 'primary.main',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Icon fontSize="small" />
        </Box>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          {label}
        </Typography>
      </Stack>
      <Typography variant="body2" fontWeight={700}>
        {value}
      </Typography>
    </Stack>
  );
}

export default function AnalyticsPage() {
  const summary = useDashboardSummary();
  const country = useAvgSalaryByCountry();
  const department = useAvgSalaryByDepartment();
  const jobTitle = useAvgSalaryByJobTitle();

  const stats = summary.data?.salary_stats;

  const formatStat = (fmt, raw) => {
    if (raw == null) return '—';
    if (fmt === 'number') return formatNumber(raw);
    if (fmt === 'currency') return formatCurrency(Math.round(raw));
    if (fmt === 'currency-compact') return formatCurrencyCompact(raw);
    return String(raw);
  };

  return (
    <Box sx={{ pt: 2 }}>
      <PageHeader
        title="Analytics"
        subtitle="Deep dive into salary distribution across the organisation."
      />

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                Salary statistics
              </Typography>
              {METRIC_ROWS.map((row) => (
                <MetricRow
                  key={row.key}
                  icon={row.icon}
                  label={row.label}
                  value={formatStat(row.fmt, stats?.[row.key])}
                />
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <ChartCard
            title="Average salary by country"
            subtitle="Top 12 countries"
            height={360}
            loading={country.isLoading}
            error={country.error}
            onRetry={country.refetch}
            isEmpty={!country.isLoading && !(country.data?.length > 0)}
          >
            <AvgSalaryByCountryChart data={country.data} limit={12} />
          </ChartCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <ChartCard
            title="Average salary by department"
            subtitle="Pay distribution across teams"
            height={360}
            loading={department.isLoading}
            error={department.error}
            onRetry={department.refetch}
            isEmpty={!department.isLoading && !(department.data?.length > 0)}
          >
            <AvgSalaryByCountryChart data={department.data} limit={10} />
          </ChartCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <ChartCard
            title="Employees by department"
            subtitle="Head-count share"
            height={360}
            loading={summary.isLoading}
            error={summary.error}
            onRetry={summary.refetch}
            isEmpty={
              !summary.isLoading && !(summary.data?.employees_by_department?.length > 0)
            }
          >
            <DepartmentDistributionChart
              data={summary.data?.employees_by_department}
            />
          </ChartCard>
        </Grid>

        <Grid item xs={12}>
          <ChartCard
            title="Highest paying job titles"
            subtitle="Top 10 roles ranked by average salary"
            height={420}
            loading={jobTitle.isLoading}
            error={jobTitle.error}
            onRetry={jobTitle.refetch}
            isEmpty={!jobTitle.isLoading && !(jobTitle.data?.length > 0)}
          >
            <HighestPayingJobsChart data={jobTitle.data} limit={10} />
          </ChartCard>
        </Grid>
      </Grid>
    </Box>
  );
}
