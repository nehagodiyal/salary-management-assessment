import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import PageHeader from '@/components/feedback/PageHeader';
import LoadingState from '@/components/feedback/LoadingState';
import ErrorState from '@/components/feedback/ErrorState';
import ConfirmDialog from '@/components/feedback/ConfirmDialog';
import { useEmployeeQuery, useDeleteEmployee } from '@/hooks/useEmployees';
import { useAuth } from '@/hooks/useAuth.jsx';
import { useSnackbar } from '@/hooks/useSnackbar.jsx';
import { extractApiError } from '@/api/errors';
import { formatCurrency, formatDate, titleCase } from '@/utils/formatters';

function Field({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
        {label}
      </Typography>
      <Typography variant="body1" sx={{ mt: 0.25, fontWeight: 500 }}>
        {value || '—'}
      </Typography>
    </Box>
  );
}

export default function EmployeeDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const snackbar = useSnackbar();
  const { data, isLoading, isError, error, refetch } = useEmployeeQuery(id);
  const deleteMutation = useDeleteEmployee();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      snackbar.success('Employee deleted');
      navigate('/employees', { replace: true });
    } catch (e) {
      snackbar.error(extractApiError(e).message);
      setConfirmOpen(false);
    }
  };

  if (isLoading) return <LoadingState label="Loading employee…" height={300} />;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;
  if (!data) return null;

  return (
    <Box>
      <PageHeader
        title={data.full_name}
        subtitle={data.job_title}
        action={
          <Stack direction="row" spacing={1}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/employees')}
              color="inherit"
            >
              Back
            </Button>
            {isAdmin && (
              <>
                <Button
                  startIcon={<EditIcon />}
                  variant="outlined"
                  onClick={() => navigate(`/employees/${id}/edit`)}
                >
                  Edit
                </Button>
                <Button
                  startIcon={<DeleteIcon />}
                  variant="outlined"
                  color="error"
                  onClick={() => setConfirmOpen(true)}
                >
                  Delete
                </Button>
              </>
            )}
          </Stack>
        }
      />

      <Card>
        <CardContent>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ sm: 'flex-start' }}
            spacing={2}
            sx={{ mb: 3 }}
          >
            <Box>
              <Typography variant="h5">{data.full_name}</Typography>
              <Typography color="text.secondary">{data.email}</Typography>
            </Box>
            <Chip
              label={titleCase(data.status)}
              color={
                data.status === 'active'
                  ? 'success'
                  : data.status === 'on_leave'
                    ? 'warning'
                    : 'default'
              }
            />
          </Stack>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <Field label="Department" value={data.department} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Field label="Job title" value={data.job_title} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Field label="Country" value={data.country} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Field label="Phone" value={data.phone} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Field label="Hire date" value={formatDate(data.hire_date)} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Field label="Salary" value={formatCurrency(data.salary)} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Field label="Created" value={formatDate(data.created_at)} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Field label="Last updated" value={formatDate(data.updated_at)} />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete employee?"
        description={`This will permanently remove ${data.full_name}.`}
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
      />
    </Box>
  );
}
