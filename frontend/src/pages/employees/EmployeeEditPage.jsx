import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Card, CardContent } from '@mui/material';

import PageHeader from '@/components/feedback/PageHeader';
import EmployeeForm from '@/components/employees/EmployeeForm';
import LoadingState from '@/components/feedback/LoadingState';
import ErrorState from '@/components/feedback/ErrorState';
import { useEmployeeQuery, useUpdateEmployee } from '@/hooks/useEmployees';
import { useSnackbar } from '@/hooks/useSnackbar.jsx';
import { extractApiError } from '@/api/errors';

export default function EmployeeEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const { data, isLoading, isError, error, refetch } = useEmployeeQuery(id);
  const mutation = useUpdateEmployee();
  const [serverFieldErrors, setServerFieldErrors] = useState(null);

  const handleSubmit = async (payload) => {
    setServerFieldErrors(null);
    try {
      await mutation.mutateAsync({ id, payload });
      snackbar.success('Employee updated');
      navigate(`/employees/${id}`);
    } catch (e) {
      const apiError = extractApiError(e);
      if (apiError.fieldErrors) setServerFieldErrors(apiError.fieldErrors);
      snackbar.error(apiError.message || 'Could not update employee');
    }
  };

  if (isLoading) return <LoadingState label="Loading employee…" />;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <Box>
      <PageHeader title="Edit employee" subtitle={data?.full_name} />
      <Card>
        <CardContent>
          <EmployeeForm
            initialEmployee={data}
            onSubmit={handleSubmit}
            onCancel={() => navigate(`/employees/${id}`)}
            submitting={mutation.isPending}
            serverFieldErrors={serverFieldErrors}
            submitLabel="Save changes"
          />
        </CardContent>
      </Card>
    </Box>
  );
}
