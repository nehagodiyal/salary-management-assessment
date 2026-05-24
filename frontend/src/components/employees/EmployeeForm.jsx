import { useEffect } from 'react';
import { Formik, Form } from 'formik';
import { Alert, Box, Button, Grid, Stack, Typography } from '@mui/material';

import FormikTextField from '@/components/common/FormikTextField';
import FormikSelect from '@/components/common/FormikSelect';
import PicklistWithOther from './PicklistWithOther.jsx';
import { EMPLOYMENT_STATUS_OPTIONS } from '@/config/constants';
import { useEmployeeFacets } from '@/hooks/useEmployees';
import {
  employeeInitialValues,
  employeeValidationSchema,
  toApiPayload,
  toFormValues,
} from './employeeFormSchema';

function FacetSelect({ name, label, options, loading, required, initialValue }) {
  // Show the current value as a synthetic option when it's not in the list yet
  // (e.g. editing an employee whose department was retired from the catalogue).
  const merged =
    initialValue && !options.includes(initialValue)
      ? [...options, initialValue]
      : options;
  return (
    <FormikSelect
      name={name}
      label={label}
      required={required}
      options={merged.map((v) => ({ value: v, label: v }))}
      disabled={loading}
      helperText={loading ? `Loading ${label.toLowerCase()}…` : undefined}
    />
  );
}

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

  const {
    data: facets,
    isLoading: facetsLoading,
    error: facetsError,
    refetch,
  } = useEmployeeFacets();

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
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
              Fields marked with <Box component="span" sx={{ color: 'error.main', fontWeight: 700 }}>*</Box> are required.
            </Typography>

            {facetsError && (
              <Alert
                severity="warning"
                sx={{ mb: 2 }}
                action={
                  <Button color="inherit" size="small" onClick={refetch}>
                    Retry
                  </Button>
                }
              >
                Could not load picklists — type values manually for now.
              </Alert>
            )}
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <FormikTextField name="full_name" label="Full name" required autoFocus />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormikTextField name="email" label="Email" type="email" required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormikTextField name="phone" label="Phone" />
              </Grid>
              <Grid item xs={12} sm={6}>
                {facetsError ? (
                  <FormikTextField name="country" label="Country" required />
                ) : (
                  <PicklistWithOther
                    name="country"
                    label="Country"
                    options={facets?.countries || []}
                    loading={facetsLoading}
                    required
                    customPlaceholder="e.g. Switzerland"
                  />
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                {facetsError ? (
                  <FormikTextField name="department" label="Department" required />
                ) : (
                  <FacetSelect
                    name="department"
                    label="Department"
                    options={facets?.departments || []}
                    loading={facetsLoading}
                    required
                    initialValue={initialValues.department}
                  />
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                {facetsError ? (
                  <FormikTextField name="job_title" label="Job title" required />
                ) : (
                  <PicklistWithOther
                    name="job_title"
                    label="Job title"
                    options={facets?.job_titles || []}
                    loading={facetsLoading}
                    required
                    customPlaceholder="e.g. Data Platform Architect"
                  />
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormikTextField
                  name="salary"
                  label="Salary"
                  type="number"
                  required
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormikTextField
                  name="hire_date"
                  label="Hire date"
                  type="date"
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormikSelect
                  name="status"
                  label="Status"
                  required
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
                <Button type="submit" variant="contained" disabled={submitting}>
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
