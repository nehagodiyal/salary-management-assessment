import { useEffect } from 'react';
import { Formik, Form } from 'formik';
import { Box, Button, Grid, Stack } from '@mui/material';

import FormikTextField from '@/components/common/FormikTextField';
import FormikSelect from '@/components/common/FormikSelect';
import { EMPLOYMENT_STATUS_OPTIONS } from '@/config/constants';
import {
  employeeInitialValues,
  employeeValidationSchema,
  toApiPayload,
  toFormValues,
} from './employeeFormSchema';

export default function EmployeeForm({
  initialEmployee,
  onSubmit,
  onCancel,
  submitting,
  serverFieldErrors,
  submitLabel = 'Save',
}) {
  const initialValues = initialEmployee
    ? toFormValues(initialEmployee)
    : employeeInitialValues;

  return (
    <Formik
      initialValues={initialValues}
      enableReinitialize
      validationSchema={employeeValidationSchema}
      onSubmit={(values, helpers) => onSubmit(toApiPayload(values), helpers)}
    >
      {({ setFieldError }) => (
        <ServerErrorBridge
          fieldErrors={serverFieldErrors}
          setFieldError={setFieldError}
        >
          <Form noValidate>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <FormikTextField name="full_name" label="Full name" autoFocus />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormikTextField name="email" label="Email" type="email" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormikTextField name="phone" label="Phone" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormikTextField name="country" label="Country" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormikTextField name="department" label="Department" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormikTextField name="job_title" label="Job title" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormikTextField
                  name="salary"
                  label="Salary"
                  type="number"
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormikTextField
                  name="hire_date"
                  label="Hire date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormikSelect
                  name="status"
                  label="Status"
                  options={EMPLOYMENT_STATUS_OPTIONS}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
              <Stack direction="row" spacing={1.5}>
                {onCancel && (
                  <Button onClick={onCancel} disabled={submitting} color="inherit">
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting}
                >
                  {submitting ? 'Saving…' : submitLabel}
                </Button>
              </Stack>
            </Box>
          </Form>
        </ServerErrorBridge>
      )}
    </Formik>
  );
}

function ServerErrorBridge({ fieldErrors, setFieldError, children }) {
  useEffect(() => {
    if (!fieldErrors) return;
    Object.entries(fieldErrors).forEach(([k, v]) => setFieldError(k, v));
  }, [fieldErrors, setFieldError]);
  return children;
}
