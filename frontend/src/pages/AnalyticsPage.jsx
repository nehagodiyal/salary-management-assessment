import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Autocomplete,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  TextField,
  Typography,
  Button,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import PublicIcon from '@mui/icons-material/Public';
import BusinessIcon from '@mui/icons-material/Business';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

import LeaderboardTable from '@/components/analytics/LeaderboardTable';
import SalaryStatsGrid from '@/components/analytics/SalaryStatsGrid';
import PercentileLadder from '@/components/analytics/PercentileLadder';
import TopEarnersTable from '@/components/analytics/TopEarnersTable';
import ChartCard from '@/components/dashboard/ChartCard';
import AvgSalaryByCountryChart from '@/components/charts/AvgSalaryByCountryChart';
import HighestPayingJobsChart from '@/components/charts/HighestPayingJobsChart';
import SalaryDistributionChart from '@/components/charts/SalaryDistributionChart';
import TenureBandsChart from '@/components/charts/TenureBandsChart';
import HiringTrendsChart from '@/components/charts/HiringTrendsChart';
import {
  useAvgSalaryByCountry,
  useAvgSalaryByDepartment,
  useAvgSalaryByJobTitle,
  useDashboardSummary,
  useSalaryStatsForCountry,
  useSalaryDistribution,
  usePercentiles,
  useTenureBands,
  useHiringTrends,
} from '@/hooks/useAnalytics';

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [trendGranularity, setTrendGranularity] = useState('year');

  const summary = useDashboardSummary();
  const country = useAvgSalaryByCountry();
  const department = useAvgSalaryByDepartment();
  const jobTitle = useAvgSalaryByJobTitle(
    selectedCountry || undefined,
    selectedDepartment || undefined,
  );
  const countryStats = useSalaryStatsForCountry(selectedCountry || undefined);
  const distribution = useSalaryDistribution(
    selectedCountry || undefined,
    selectedDepartment || undefined,
    25000,
  );
  const percentiles = usePercentiles(
    selectedCountry || undefined,
    selectedDepartment || undefined,
  );
  const tenure = useTenureBands(
    selectedCountry || undefined,
    selectedDepartment || undefined,
  );
  const hiringTrends = useHiringTrends(
    trendGranularity,
    selectedCountry || undefined,
    selectedDepartment || undefined,
  );

  const countryOptions = useMemo(
    () => (country.data || []).map((d) => d.group).sort(),
    [country.data],
  );
  const departmentOptions = useMemo(
    () => (department.data || []).map((d) => d.group).sort(),
    [department.data],
  );

  const isFiltered = !!selectedCountry || !!selectedDepartment;
  const scopeLabel = (() => {
    if (selectedCountry && selectedDepartment) return `${selectedDepartment} · ${selectedCountry}`;
    if (selectedCountry) return selectedCountry;
    if (selectedDepartment) return selectedDepartment;
    return 'Global';
  })();

  const globalStats = summary.data?.salary_stats;
  // Note: when filtering by department (with or without country) the granular
  // stats grid still shows global numbers — the percentile ladder + histogram
  // are the filtered views. Country-only filter swaps the stats grid to that
  // country's stats via the dedicated endpoint.
  const statsToShow =
    selectedCountry && !selectedDepartment
      ? countryStats.data
      : globalStats;

  const resetFilters = () => {
    setSelectedCountry(null);
    setSelectedDepartment(null);
  };

  const goEmployees = (params = {}) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) sp.set(k, String(v));
    });
    navigate(`/employees?${sp.toString()}`);
  };

  return (
    <Box sx={{ pt: 2 }}>
      {/* Slim analytical header — deliberately different from the dashboard hero */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ md: 'flex-end' }}
        justifyContent="space-between"
        sx={{ py: 3, borderBottom: '1px solid', borderColor: 'divider', mb: 3 }}
      >
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                bgcolor: 'rgba(15, 23, 42, 0.06)',
                color: 'text.primary',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <QueryStatsIcon fontSize="small" />
            </Box>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ fontWeight: 700, letterSpacing: '0.1em' }}
            >
              Workforce intelligence
            </Typography>
          </Stack>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Salary distribution, percentiles and ranked leaderboards across
            markets, teams and roles.
          </Typography>
        </Box>
      </Stack>

      {/* Filter card */}
      <Card sx={{ mb: 2.5 }}>
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ md: 'center' }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 220 }}>
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
                <QueryStatsIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Scope this view
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Country and department compose.
                </Typography>
              </Box>
            </Stack>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              sx={{ flex: 1, width: '100%' }}
            >
              <Autocomplete
                options={countryOptions}
                value={selectedCountry}
                onChange={(_, v) => setSelectedCountry(v)}
                sx={{ flex: 1 }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    label="Country"
                    placeholder="All countries"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5, color: 'text.secondary' }}>
                          <PublicIcon fontSize="small" />
                        </Box>
                      ),
                    }}
                  />
                )}
              />
              <Autocomplete
                options={departmentOptions}
                value={selectedDepartment}
                onChange={(_, v) => setSelectedDepartment(v)}
                sx={{ flex: 1 }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    label="Department"
                    placeholder="All departments"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5, color: 'text.secondary' }}>
                          <BusinessIcon fontSize="small" />
                        </Box>
                      ),
                    }}
                  />
                )}
              />
              {isFiltered && (
                <Button
                  size="small"
                  startIcon={<RestartAltIcon />}
                  onClick={resetFilters}
                  color="inherit"
                >
                  Reset
                </Button>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Top stats strip */}
      <SalaryStatsGrid
        stats={statsToShow}
        scopeLabel={scopeLabel}
        isFiltered={isFiltered}
        loading={
          (selectedCountry && !selectedDepartment)
            ? countryStats.isLoading
            : summary.isLoading
        }
      />

      {/* Distribution + Percentiles */}
      <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
        <Grid item xs={12} lg={8}>
          <ChartCard
            title="Salary distribution"
            subtitle={
              isFiltered
                ? `Histogram of salaries · ${scopeLabel}`
                : 'Histogram of salaries · ₹25,000 buckets'
            }
            height={340}
            loading={distribution.isLoading}
            error={distribution.error}
            onRetry={distribution.refetch}
            isEmpty={!distribution.isLoading && !(distribution.data?.length > 0)}
            emptyDescription="No employees match the current filters."
          >
            <SalaryDistributionChart data={distribution.data} />
          </ChartCard>
        </Grid>
        <Grid item xs={12} lg={4}>
          <PercentileLadder
            data={percentiles.data}
            loading={percentiles.isLoading}
            error={percentiles.error}
            scopeLabel={scopeLabel}
          />
        </Grid>

        {/* Side-by-side: ranked countries table + bar chart */}
        <Grid item xs={12} lg={6}>
          <LeaderboardTable
            title="Top markets by pay"
            subtitle="Countries ranked by average salary"
            rows={country.data}
            loading={country.isLoading}
            error={country.error}
            onRetry={country.refetch}
            limit={10}
            groupLabel="Country"
            onSelect={(g) => goEmployees({ country: g })}
          />
        </Grid>
        <Grid item xs={12} lg={6}>
          <ChartCard
            title="Average salary by country"
            subtitle="Visual ranking — top 12"
            height={420}
            loading={country.isLoading}
            error={country.error}
            onRetry={country.refetch}
            isEmpty={!country.isLoading && !(country.data?.length > 0)}
          >
            <AvgSalaryByCountryChart data={country.data} limit={12} />
          </ChartCard>
        </Grid>

        {/* Side-by-side: ranked departments + count breakdown */}
        <Grid item xs={12} lg={6}>
          <LeaderboardTable
            title="Highest paying departments"
            subtitle="Where compensation concentrates"
            rows={department.data}
            loading={department.isLoading}
            error={department.error}
            onRetry={department.refetch}
            limit={10}
            groupLabel="Department"
            onSelect={(g) => goEmployees({ department: g })}
          />
        </Grid>
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                Department head-count
              </Typography>
              <Stack divider={null} spacing={0.75}>
                {(summary.data?.employees_by_department || [])
                  .slice(0, 10)
                  .map((row) => {
                    const total = summary.data?.salary_stats?.count || 1;
                    const pct = Math.round((row.employee_count / total) * 100);
                    return (
                      <Box
                        key={row.group}
                        onClick={() => goEmployees({ department: row.group })}
                        sx={{ cursor: 'pointer', py: 0.5 }}
                      >
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          sx={{ mb: 0.5 }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {row.group}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontVariantNumeric: 'tabular-nums' }}
                          >
                            {row.employee_count.toLocaleString()} · {pct}%
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
                              background:
                                'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
                              transition: 'width 400ms ease',
                            }}
                          />
                        </Box>
                      </Box>
                    );
                  })}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Top paying job titles — respects both filters */}
        <Grid item xs={12} lg={6}>
          <LeaderboardTable
            title={`Top paying roles${isFiltered ? ` · ${scopeLabel}` : ''}`}
            subtitle={
              isFiltered
                ? `Ranked by average salary in ${scopeLabel}`
                : 'Ranked by average salary (global)'
            }
            rows={jobTitle.data}
            loading={jobTitle.isLoading}
            error={jobTitle.error}
            onRetry={jobTitle.refetch}
            limit={10}
            groupLabel="Job title"
          />
        </Grid>
        <Grid item xs={12} lg={6}>
          <ChartCard
            title="Highest paying roles"
            subtitle="Top 10 — visual ranking"
            height={420}
            loading={jobTitle.isLoading}
            error={jobTitle.error}
            onRetry={jobTitle.refetch}
            isEmpty={!jobTitle.isLoading && !(jobTitle.data?.length > 0)}
            emptyDescription={
              isFiltered
                ? `No employees recorded in ${scopeLabel} yet.`
                : 'No data available yet.'
            }
          >
            <HighestPayingJobsChart data={jobTitle.data} limit={10} />
          </ChartCard>
        </Grid>

        {/* Section: Individual top earners */}
        <Grid item xs={12}>
          <Box sx={{ mt: 1, mb: 1 }}>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.1em' }}>
              Individuals
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Top earners
            </Typography>
          </Box>
          <TopEarnersTable
            country={selectedCountry}
            department={selectedDepartment}
            limit={10}
            scopeLabel={isFiltered ? scopeLabel : null}
          />
        </Grid>

        {/* Section: Workforce composition */}
        <Grid item xs={12}>
          <Box sx={{ mt: 2, mb: 1 }}>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.1em' }}>
              Workforce composition
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Tenure & hiring activity
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12} lg={6}>
          <ChartCard
            title="Pay by tenure band"
            subtitle="Average salary at each career stage"
            height={340}
            loading={tenure.isLoading}
            error={tenure.error}
            onRetry={tenure.refetch}
            isEmpty={!tenure.isLoading && !(tenure.data?.length > 0)}
          >
            <TenureBandsChart data={tenure.data} />
          </ChartCard>
        </Grid>

        <Grid item xs={12} lg={6}>
          <ChartCard
            title="Hiring trend"
            subtitle={`New hires per ${trendGranularity}`}
            height={340}
            loading={hiringTrends.isLoading}
            error={hiringTrends.error}
            onRetry={hiringTrends.refetch}
            isEmpty={!hiringTrends.isLoading && !(hiringTrends.data?.length > 0)}
            action={
              <ToggleButtonGroup
                size="small"
                value={trendGranularity}
                exclusive
                onChange={(_, v) => v && setTrendGranularity(v)}
              >
                <ToggleButton value="year" sx={{ px: 1.5, py: 0.25, fontSize: 11 }}>
                  Year
                </ToggleButton>
                <ToggleButton value="month" sx={{ px: 1.5, py: 0.25, fontSize: 11 }}>
                  Month
                </ToggleButton>
              </ToggleButtonGroup>
            }
          >
            <HiringTrendsChart
              data={hiringTrends.data}
              granularity={trendGranularity}
            />
          </ChartCard>
        </Grid>

        {/* Tenure headcount summary — small data card alongside the chart */}
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 1.5 }}
              >
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Tenure breakdown
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Head-count and average pay at each band
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
                  gridTemplateColumns: {
                    xs: 'repeat(2, 1fr)',
                    sm: 'repeat(3, 1fr)',
                    md: 'repeat(5, 1fr)',
                  },
                  gap: 1.5,
                }}
              >
                {(tenure.data || []).map((band) => (
                  <Box
                    key={band.band}
                    sx={{
                      p: 1.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      bgcolor:
                        band.employee_count === 0 ? 'rgba(15, 23, 42, 0.02)' : '#fffaf0',
                      opacity: band.employee_count === 0 ? 0.7 : 1,
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}
                    >
                      {band.band}
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums', mt: 0.25 }}
                    >
                      {band.employee_count.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {band.average_salary == null
                        ? 'no data'
                        : `Avg ${Math.round(band.average_salary).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}`}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
