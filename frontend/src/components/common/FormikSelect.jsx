import { TextField, MenuItem } from '@mui/material';
import { useField } from 'formik';

export default function FormikSelect({ name, options = [], ...rest }) {
  const [field, meta] = useField(name);
  const showError = meta.touched && Boolean(meta.error);
  return (
    <TextField
      select
      {...field}
      {...rest}
      value={field.value ?? ''}
      error={showError}
      helperText={showError ? meta.error : rest.helperText}
      fullWidth
    >
      {options.map((opt) => (
        <MenuItem key={opt.value} value={opt.value}>
          {opt.label}
        </MenuItem>
      ))}
    </TextField>
  );
}
