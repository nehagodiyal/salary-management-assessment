import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent } from '@mui/material';

import PageHeader from '@/components/feedback/PageHeader';
import EmployeeForm from '@/components/employees/EmployeeForm';
import { useCreateEmployee } from '@/hooks/useEmployees';
import { useSnackbar } from '@/hooks/useSnackbar.jsx';
import { extractApiError } from '@/api/errors';

export default function EmployeeCreatePage() {
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const mutation = useCreateEmployee();
  const [serverFieldErrors, setServerFieldErrors] = useState(null);

  const handleSubmit = async (payload) => {
    setServerFieldErrors(null);
    try {
      const created = await mutation.mutateAsync(payload);
      snackbar.success('Employee created');
      navigate(`/employees/${created.id}`, { replace: true });
    } catch (e) {
      const apiError = extractApiError(e);
      if (apiError.fieldErrors) setServerFieldErrors(apiError.fieldErrors);
      snackbar.error(apiError.message || 'Could not create employee');
    }
  };

  return (
    <Box>
      <PageHeader title="Add employee" subtitle="Create a new employee record." />
      <Card>
        <CardContent>
          <EmployeeForm
            onSubmit={handleSubmit}
            onCancel={() => navigate('/employees')}
            submitting={mutation.isPending}
            serverFieldErrors={serverFieldErrors}
            submitLabel="Create employee"
          />
        </CardContent>
      </Card>
    </Box>
  );
}
