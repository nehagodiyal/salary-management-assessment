import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PublicIcon from '@mui/icons-material/Public';
import BusinessIcon from '@mui/icons-material/Business';
import InsightsIcon from '@mui/icons-material/Insights';
import TimelineIcon from '@mui/icons-material/Timeline';

import StatCard from '@/components/dashboard/StatCard';
import ChartCard from '@/components/dashboard/ChartCard';
import QuickActions from '@/components/dashboard/QuickActions';
import StatusBreakdown from '@/components/dashboard/StatusBreakdown';
import RecentEmployees from '@/components/dashboard/RecentEmployees';
import ErrorState from '@/components/feedback/ErrorState';
import AvgSalaryByCountryChart from '@/components/charts/AvgSalaryByCountryChart';
import DepartmentDistributionChart from '@/components/charts/DepartmentDistributionChart';
import {
  useDashboardSummary,
  useAvgSalaryByCountry,
} from '@/hooks/useAnalytics';
import {
  formatCurrency,
  formatCurrencyCompact,
  formatNumber,
} from '@/utils/formatters';
import { useAuth } from '@/hooks/useAuth.jsx';
import { SORT_FIELDS } from '@/config/constants';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const buildQuery = (params) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
};

function HeroBanner({ user }) {
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const name = user?.email ? user.email.split('@')[0] : 'admin';
  return (
    <Card
      sx={{
        mb: 3,
        position: 'relative',
        overflow: 'hidden',
        border: 'none',
        background:
          'linear-gradient(135deg, #4f46e5 0%, #6366f1 45%, #8b5cf6 100%)',
        color: '#fff',
        boxShadow: '0 12px 24px -8px rgba(99, 102, 241, 0.4)',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -60,
          right: -60,
          width: 220,
          height: 220,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -80,
          left: -40,
          width: 240,
          height: 240,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none',
        }}
      />
      <CardContent sx={{ p: { xs: 3, sm: 4 }, position: 'relative' }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ md: 'center' }}
          spacing={2}
        >
          <Box>
            <Chip
              icon={<InsightsIcon sx={{ color: '#fff !important' }} />}
              label="HR Admin Console"
              size="small"
              sx={{
                bgcolor: 'rgba(255,255,255,0.18)',
                color: '#fff',
                fontWeight: 600,
                mb: 1.5,
                '& .MuiChip-icon': { color: '#fff' },
              }}
            />
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                letterSpacing: '-0.02em',
                textTransform: 'capitalize',
              }}
            >
              {greeting()}, {name}
            </Typography>
            <Typography sx={{ opacity: 0.85, mt: 0.5 }}>
              Here's a snapshot of your workforce as of {todayLabel}.
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, isAdmin } = useAuth();
  const summary = useDashboardSummary();
  const countryData = useAvgSalaryByCountry();

  const stats = summary.data?.salary_stats;
  const topCountry = summary.data?.highest_paying_country;
  const topDepartment = summary.data?.highest_paying_department;
  const departmentDist = useMemo(
    () => summary.data?.employees_by_department || [],
    [summary.data],
  );
  const statusBreakdown = summary.data?.employees_by_status || [];

  const goEmployees = (params = {}) => navigate(`/employees${buildQuery(params)}`);

  const cards = [
    {
      label: 'Total employees',
      value: formatNumber(stats?.count),
      helper: 'All active records in the system',
      icon: PeopleIcon,
      accent: 'primary',
      cta: 'View all employees',
      onClick: () => goEmployees(),
    },
    {
      label: 'Average salary',
      value:
        stats?.average != null
          ? isMobile
            ? formatCurrencyCompact(Math.round(stats.average))
            : formatCurrency(Math.round(stats.average))
          : '—',
      helper: 'Mean across the workforce',
      icon: CurrencyRupeeIcon,
      accent: 'emerald',
      cta: 'View ranked list',
      onClick: () =>
        goEmployees({ sort_by: SORT_FIELDS.SALARY, sort_dir: 'desc' }),
    },
    {
      label: 'Median salary',
      value:
        stats?.median != null
          ? isMobile
            ? formatCurrencyCompact(Math.round(stats.median))
            : formatCurrency(Math.round(stats.median))
          : '—',
      helper: '50th percentile of pay',
      icon: TimelineIcon,
      accent: 'info',
      cta: 'Open analytics',
      onClick: () => navigate('/analytics'),
    },
    {
      label: 'Minimum salary',
      value: stats?.minimum != null ? formatCurrencyCompact(stats.minimum) : '—',
      helper: 'Lowest paid employees first',
      icon: TrendingDownIcon,
      accent: 'warning',
      cta: 'View lowest earners',
      onClick: () =>
        goEmployees({ sort_by: SORT_FIELDS.SALARY, sort_dir: 'asc' }),
    },
    {
      label: 'Maximum salary',
      value: stats?.maximum != null ? formatCurrencyCompact(stats.maximum) : '—',
      helper: 'Highest paid employees first',
      icon: TrendingUpIcon,
      accent: 'success',
      cta: 'View top earners',
      onClick: () =>
        goEmployees({ sort_by: SORT_FIELDS.SALARY, sort_dir: 'desc' }),
    },
    {
      label: 'Highest paying country',
      value: topCountry?.group || '—',
      helper:
        topCountry?.average_salary
          ? `Avg ${formatCurrencyCompact(Math.round(topCountry.average_salary))}`
          : 'No data yet',
      icon: PublicIcon,
      accent: 'rose',
      cta: topCountry?.group ? `View ${topCountry.group} employees` : undefined,
      onClick: topCountry?.group
        ? () => goEmployees({ country: topCountry.group })
        : undefined,
    },
    {
      label: 'Highest paying department',
      value: topDepartment?.group || '—',
      helper:
        topDepartment?.average_salary
          ? `Avg ${formatCurrencyCompact(Math.round(topDepartment.average_salary))}`
          : 'No data yet',
      icon: BusinessIcon,
      accent: 'secondary',
      cta: topDepartment?.group
        ? `View ${topDepartment.group} team`
        : undefined,
      onClick: topDepartment?.group
        ? () => goEmployees({ department: topDepartment.group })
        : undefined,
    },
  ];

  return (
    <Box sx={{ pt: 3 }}>
      <HeroBanner user={user} />

      <QuickActions canCreate={isAdmin} />

      <StatusBreakdown
        data={statusBreakdown}
        total={stats?.count || 0}
        loading={summary.isLoading}
        onSelect={(status) => goEmployees({ status })}
      />

      {summary.isError && (
        <Box sx={{ mb: 2 }}>
          <ErrorState
            error={summary.error}
            onRetry={summary.refetch}
            label="Could not load dashboard"
          />
        </Box>
      )}

      <Grid container spacing={2.5}>
        {cards.map((card, idx) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={idx}>
            <StatCard {...card} loading={summary.isLoading} />
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Activity & insights
        </Typography>
        <Typography variant="body2" color="text.secondary">
          The latest hires and a high-level view of where money goes.
        </Typography>
      </Box>

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={7}>
          <RecentEmployees limit={5} />
        </Grid>
        <Grid item xs={12} lg={5}>
          <ChartCard
            title="Employees by department"
            subtitle="Click a slice to drill into that team"
            height={340}
            loading={summary.isLoading}
            error={summary.error}
            onRetry={summary.refetch}
            isEmpty={!summary.isLoading && departmentDist.length === 0}
          >
            <DepartmentDistributionChart
              data={departmentDist}
              onSliceClick={(name) => goEmployees({ department: name })}
            />
          </ChartCard>
        </Grid>
        <Grid item xs={12}>
          <ChartCard
            title="Average salary by country"
            subtitle="Top 10 markets — head to Analytics for the full breakdown"
            height={340}
            loading={countryData.isLoading}
            error={countryData.error}
            onRetry={countryData.refetch}
            isEmpty={!countryData.isLoading && !(countryData.data?.length > 0)}
            action={
              <Chip
                label="View detailed analytics"
                size="small"
                onClick={() => navigate('/analytics')}
                clickable
                color="primary"
                variant="outlined"
              />
            }
          >
            <AvgSalaryByCountryChart data={countryData.data} />
          </ChartCard>
        </Grid>
      </Grid>
    </Box>
  );
}
