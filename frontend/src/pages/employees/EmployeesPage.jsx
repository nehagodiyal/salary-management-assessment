import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FilterAltIcon from '@mui/icons-material/FilterAlt';

import PageHeader from '@/components/feedback/PageHeader';
import DataTable from '@/components/common/DataTable';
import PaginationBar from '@/components/common/PaginationBar';
import SearchInput from '@/components/common/SearchInput';
import ConfirmDialog from '@/components/feedback/ConfirmDialog';
import ErrorState from '@/components/feedback/ErrorState';
import { useEmployeesQuery, useDeleteEmployee } from '@/hooks/useEmployees';
import { useAuth } from '@/hooks/useAuth.jsx';
import { useSnackbar } from '@/hooks/useSnackbar.jsx';
import { extractApiError } from '@/api/errors';
import {
  DEFAULT_PAGE_SIZE,
  EMPLOYMENT_STATUS_OPTIONS,
  SORT_FIELDS,
} from '@/config/constants';
import { formatCurrency, formatDate, titleCase } from '@/utils/formatters';

const STATUS_COLOR = {
  active: 'success',
  on_leave: 'warning',
  terminated: 'default',
};

const SORT_LABELS = {
  full_name: 'Name',
  salary: 'Salary',
  hire_date: 'Hire date',
  country: 'Country',
  department: 'Department',
  created_at: 'Created at',
};

export default function EmployeesPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));
  const isXSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const { isAdmin } = useAuth();
  const snackbar = useSnackbar();

  const [searchParams, setSearchParams] = useSearchParams();

  // ---- URL-driven filter/sort/pagination state ----
  const page = parseInt(searchParams.get('page') || '1', 10) || 1;
  const pageSize =
    parseInt(searchParams.get('page_size') || String(DEFAULT_PAGE_SIZE), 10) ||
    DEFAULT_PAGE_SIZE;
  const country = searchParams.get('country') || '';
  const department = searchParams.get('department') || '';
  const status = searchParams.get('status') || '';
  const sortBy = searchParams.get('sort_by') || SORT_FIELDS.CREATED_AT;
  const sortDir = searchParams.get('sort_dir') || 'desc';

  // Search is debounced — keep it as local state so the input doesn't churn
  // the URL on every keystroke.
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const updateParams = useCallback(
    (updates, { resetPage = true } = {}) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(updates).forEach(([k, v]) => {
            if (v === '' || v === null || v === undefined) next.delete(k);
            else next.set(k, String(v));
          });
          if (resetPage) next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const clearAllFilters = () => {
    setSearchParams({}, { replace: true });
    setSearch('');
  };

  const activeFilters = useMemo(
    () =>
      [
        country && { key: 'country', label: `Country: ${country}` },
        department && { key: 'department', label: `Department: ${department}` },
        status && { key: 'status', label: `Status: ${titleCase(status)}` },
      ].filter(Boolean),
    [country, department, status],
  );

  const [toDelete, setToDelete] = useState(null);
  const deleteMutation = useDeleteEmployee();

  const queryParams = useMemo(
    () => ({
      page,
      page_size: pageSize,
      search,
      country,
      department,
      status,
      sort_by: sortBy,
      sort_dir: sortDir,
    }),
    [page, pageSize, search, country, department, status, sortBy, sortDir],
  );

  const { data, isLoading, isError, error, refetch, isFetching } =
    useEmployeesQuery(queryParams);

  const handleSearch = useCallback((val) => {
    setSearch(val);
  }, []);

  const handleSortChange = (next) => {
    updateParams({ sort_by: next.sortBy, sort_dir: next.sortDir });
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteMutation.mutateAsync(toDelete.id);
      snackbar.success(`Removed ${toDelete.full_name}`);
      setToDelete(null);
    } catch (e) {
      snackbar.error(extractApiError(e).message);
    }
  };

  const columns = useMemo(() => {
    const all = [
      {
        id: SORT_FIELDS.FULL_NAME,
        label: 'Name',
        sortable: true,
        showAt: 'always',
        accessor: (r) => (
          <Box>
            <Box sx={{ fontWeight: 600 }}>{r.full_name}</Box>
            <Box sx={{ color: 'text.secondary', fontSize: 13 }}>{r.email}</Box>
            {isXSmall && (
              <Box sx={{ color: 'text.secondary', fontSize: 12, mt: 0.5 }}>
                {r.department} · {r.country}
              </Box>
            )}
          </Box>
        ),
      },
      {
        id: SORT_FIELDS.DEPARTMENT,
        label: 'Department',
        sortable: true,
        showAt: 'md',
        accessor: (r) => r.department,
      },
      {
        id: 'job_title',
        label: 'Job title',
        showAt: 'lg',
        accessor: (r) => r.job_title,
      },
      {
        id: SORT_FIELDS.COUNTRY,
        label: 'Country',
        sortable: true,
        showAt: 'md',
        accessor: (r) => r.country,
      },
      {
        id: SORT_FIELDS.SALARY,
        label: 'Salary',
        sortable: true,
        align: 'right',
        showAt: 'always',
        accessor: (r) => (
          <Box sx={{ fontWeight: 700, color: 'text.primary' }}>
            {formatCurrency(r.salary)}
          </Box>
        ),
      },
      {
        id: SORT_FIELDS.HIRE_DATE,
        label: 'Hired',
        sortable: true,
        showAt: 'lg',
        accessor: (r) => formatDate(r.hire_date),
      },
      {
        id: 'status',
        label: 'Status',
        showAt: 'sm',
        accessor: (r) => (
          <Chip
            label={titleCase(r.status)}
            size="small"
            color={STATUS_COLOR[r.status] || 'default'}
            variant="outlined"
          />
        ),
      },
      {
        id: 'actions',
        label: '',
        align: 'right',
        width: isXSmall ? 56 : 140,
        showAt: 'always',
        accessor: (r) => (
          <Stack direction="row" justifyContent="flex-end">
            {!isXSmall && (
              <Tooltip title="View">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/employees/${r.id}`);
                  }}
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {isAdmin && !isXSmall && (
              <>
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/employees/${r.id}/edit`);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      setToDelete(r);
                    }}
                    aria-label="delete"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
            {isXSmall && isAdmin && (
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    setToDelete(r);
                  }}
                  aria-label="delete"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        ),
      },
    ];

    const shouldShow = (showAt) => {
      if (showAt === 'always') return true;
      if (showAt === 'sm') return !isXSmall;
      if (showAt === 'md') return !isSmall;
      if (showAt === 'lg') return !isSmall;
      return true;
    };

    return all.filter((c) => shouldShow(c.showAt));
  }, [isAdmin, isSmall, isXSmall, navigate]);

  return (
    <Box sx={{ pt: 2 }}>
      <PageHeader
        title="Employees"
        subtitle={
          sortBy === SORT_FIELDS.SALARY && sortDir === 'desc'
            ? 'Ranked by salary — top earners first.'
            : sortBy === SORT_FIELDS.SALARY && sortDir === 'asc'
              ? 'Ranked by salary — lowest first.'
              : 'Search, filter and manage your workforce.'
        }
        action={
          isAdmin && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/employees/new')}
              fullWidth={isXSmall}
            >
              Add employee
            </Button>
          )
        }
      />

      {activeFilters.length > 0 && (
        <Alert
          severity="info"
          icon={<FilterAltIcon fontSize="small" />}
          sx={{ mb: 2, alignItems: 'center' }}
          action={
            <Button color="inherit" size="small" onClick={clearAllFilters}>
              Clear all
            </Button>
          }
        >
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Box sx={{ fontWeight: 600 }}>Active filters:</Box>
            {activeFilters.map((f) => (
              <Chip
                key={f.key}
                label={f.label}
                size="small"
                onDelete={() => updateParams({ [f.key]: '' })}
              />
            ))}
          </Stack>
        </Alert>
      )}

      <Card sx={{ p: { xs: 1.5, sm: 2 }, mb: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          alignItems={{ md: 'center' }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <SearchInput
              placeholder="Search by name or email"
              onChange={handleSearch}
              fullWidth
            />
          </Box>
          <TextField
            label="Country"
            size="small"
            value={country}
            onChange={(e) => updateParams({ country: e.target.value })}
            sx={{ minWidth: { md: 160 } }}
            fullWidth={isXSmall}
          />
          <TextField
            label="Department"
            size="small"
            value={department}
            onChange={(e) => updateParams({ department: e.target.value })}
            sx={{ minWidth: { md: 160 } }}
            fullWidth={isXSmall}
          />
          <TextField
            select
            label="Status"
            size="small"
            value={status}
            onChange={(e) => updateParams({ status: e.target.value })}
            sx={{ minWidth: { md: 160 } }}
            fullWidth={isXSmall}
          >
            <MenuItem value="">All</MenuItem>
            {EMPLOYMENT_STATUS_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Card>

      {isError ? (
        <ErrorState error={error} onRetry={refetch} label="Could not load employees" />
      ) : (
        <>
          <Box sx={{ overflowX: 'auto' }}>
            <DataTable
              columns={columns}
              rows={data?.items || []}
              rowKey={(r) => r.id}
              loading={isLoading || (isFetching && !data)}
              sort={{ sortBy, sortDir }}
              onSortChange={handleSortChange}
              onRowClick={(r) => navigate(`/employees/${r.id}`)}
              emptyTitle="No employees found"
            />
          </Box>
          <PaginationBar
            page={page}
            pageSize={pageSize}
            total={data?.total ?? 0}
            pages={data?.pages ?? 0}
            onPageChange={(p) =>
              updateParams({ page: p }, { resetPage: false })
            }
            onPageSizeChange={(s) =>
              updateParams({ page_size: s }, { resetPage: true })
            }
          />
        </>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Delete employee?"
        description={
          toDelete
            ? `This will permanently remove ${toDelete.full_name}. This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
      />
    </Box>
  );
}
