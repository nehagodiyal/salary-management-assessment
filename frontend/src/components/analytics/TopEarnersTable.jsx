import {
  Card,
  CardContent,
  Stack,
  Typography,
  Box,
  Skeleton,
  Avatar,
  Chip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

import { useEmployeesQuery } from '@/hooks/useEmployees';
import { formatCurrency, titleCase } from '@/utils/formatters';
import { SORT_FIELDS } from '@/config/constants';
import EmptyState from '@/components/feedback/EmptyState';

const STATUS_COLOR = {
  active: 'success',
  on_leave: 'warning',
  terminated: 'default',
};

const RANK_COLOURS = ['#f59e0b', '#94a3b8', '#a16207'];

const initialsOf = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

/**
 * Top N highest-paid employees in the current scope.
 * Reuses the existing `/employees` list endpoint with sort_by=salary desc.
 */
export default function TopEarnersTable({
  country,
  department,
  limit = 10,
  scopeLabel,
}) {
  const navigate = useNavigate();
  const { data, isLoading } = useEmployeesQuery({
    page: 1,
    page_size: limit,
    sort_by: SORT_FIELDS.SALARY,
    sort_dir: 'desc',
    country: country || '',
    department: department || '',
  });

  const employees = data?.items || [];

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          sx={{ mb: 1.5 }}
        >
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <EmojiEventsIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Top earners
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Highest paid in {scopeLabel || 'the company'} — click to view profile
              </Typography>
            </Box>
          </Stack>
          <Chip
            size="small"
            label={`Top ${limit}`}
            color="warning"
            variant="outlined"
            sx={{ fontWeight: 700 }}
          />
        </Stack>

        {isLoading && (
          <Stack spacing={1}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} variant="rounded" height={48} />
            ))}
          </Stack>
        )}

        {!isLoading && employees.length === 0 && (
          <EmptyState
            title="No employees"
            description="Nothing matches the current scope."
          />
        )}

        {!isLoading && employees.length > 0 && (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 40 }}>#</TableCell>
                <TableCell>Employee</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                  Role
                </TableCell>
                <TableCell align="right">Salary</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.map((e, idx) => (
                <TableRow
                  key={e.id}
                  hover
                  onClick={() => navigate(`/employees/${e.id}`)}
                  sx={{ cursor: 'pointer', '&:last-child td': { borderBottom: 0 } }}
                >
                  <TableCell>
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: RANK_COLOURS[idx] || '#e2e8f0',
                        color: idx < 3 ? '#fff' : '#475569',
                        fontWeight: 700,
                        fontSize: 11,
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      {idx + 1}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <Avatar
                        sx={{
                          width: 30,
                          height: 30,
                          background:
                            'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {initialsOf(e.full_name) || '?'}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            lineHeight: 1.2,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: { xs: 120, sm: 220 },
                          }}
                        >
                          {e.full_name}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: { xs: 'block', sm: 'block' },
                          }}
                        >
                          {e.country}
                          <Box
                            component="span"
                            sx={{ display: { xs: 'inline', sm: 'none' } }}
                          >
                            {' '}
                            · {e.department}
                          </Box>
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {e.job_title}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.25 }}>
                      <Typography variant="caption" color="text.secondary">
                        {e.department}
                      </Typography>
                      <Chip
                        label={titleCase(e.status)}
                        size="small"
                        color={STATUS_COLOR[e.status] || 'default'}
                        variant="outlined"
                        sx={{ height: 18, fontSize: 10 }}
                      />
                    </Stack>
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
                  >
                    {formatCurrency(e.salary)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
