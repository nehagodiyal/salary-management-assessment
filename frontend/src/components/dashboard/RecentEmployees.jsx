import {
  Card,
  CardContent,
  Stack,
  Typography,
  Button,
  Box,
  Skeleton,
  Avatar,
  Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PersonAddIcon from '@mui/icons-material/PersonAddAlt';

import { useEmployeesQuery } from '@/hooks/useEmployees';
import { formatCurrency, formatDate, titleCase } from '@/utils/formatters';
import EmptyState from '@/components/feedback/EmptyState';

const STATUS_COLOR = {
  active: 'success',
  on_leave: 'warning',
  terminated: 'default',
};

const initialsOf = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

export default function RecentEmployees({ limit = 5 }) {
  const navigate = useNavigate();
  const { data, isLoading } = useEmployeesQuery({
    page: 1,
    page_size: limit,
    sort_by: 'created_at',
    sort_dir: 'desc',
  });

  const employees = data?.items || [];

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Recently added
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Latest hires in your workforce
            </Typography>
          </Box>
          <Button
            size="small"
            endIcon={<ChevronRightIcon />}
            onClick={() =>
              navigate('/employees?sort_by=created_at&sort_dir=desc')
            }
          >
            View all
          </Button>
        </Stack>

        {isLoading ? (
          <Stack spacing={1.5} sx={{ mt: 2 }}>
            {Array.from({ length: limit }).map((_, i) => (
              <Skeleton key={i} variant="rounded" height={56} />
            ))}
          </Stack>
        ) : employees.length === 0 ? (
          <EmptyState
            title="No employees yet"
            description="Add your first employee to get started."
            icon={PersonAddIcon}
            action={
              <Button
                variant="contained"
                onClick={() => navigate('/employees/new')}
                sx={{ mt: 2 }}
              >
                Add employee
              </Button>
            }
          />
        ) : (
          <Stack divider={null} spacing={0.5}>
            {employees.map((e) => (
              <Stack
                key={e.id}
                direction="row"
                alignItems="center"
                spacing={1.5}
                onClick={() => navigate(`/employees/${e.id}`)}
                sx={{
                  p: 1.25,
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'background-color 120ms ease',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Avatar
                  sx={{
                    width: 38,
                    height: 38,
                    background:
                      'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {initialsOf(e.full_name) || '?'}
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                  >
                    {e.full_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {e.job_title} · {e.department}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {formatCurrency(e.salary)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Hired {formatDate(e.hire_date)}
                  </Typography>
                </Box>
                <Chip
                  label={titleCase(e.status)}
                  size="small"
                  color={STATUS_COLOR[e.status] || 'default'}
                  variant="outlined"
                  sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                />
              </Stack>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
