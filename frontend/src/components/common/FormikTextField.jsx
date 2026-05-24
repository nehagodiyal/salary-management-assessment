import { TextField } from '@mui/material';
import { useField } from 'formik';

export default function FormikTextField({ name, type = 'text', ...rest }) {
  const [field, meta] = useField(name);
  const showError = meta.touched && Boolean(meta.error);
  return (
    <TextField
      {...field}
      {...rest}
      type={type}
      value={field.value ?? ''}
      error={showError}
      helperText={showError ? meta.error : rest.helperText}
      fullWidth
    />
  );
}
