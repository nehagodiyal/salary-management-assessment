import { useEffect, useMemo, useState } from 'react';
import { MenuItem, TextField, Box } from '@mui/material';
import { useField, useFormikContext } from 'formik';

const OTHER_SENTINEL = '__other__';

/**
 * Dropdown of known values + an "Other (specify)" escape hatch that reveals
 * a free-text input. The Formik field value is always the canonical string;
 * the dropdown mode is purely local UI state.
 *
 * Used for both `country` and `job_title` in the employee form.
 */
export default function PicklistWithOther({
  name,
  label,
  options = [],
  loading = false,
  required = false,
  helperText,
  customPlaceholder,
}) {
  const [, meta] = useField(name);
  const { values, setFieldValue, setFieldTouched } = useFormikContext();
  const currentValue = values[name] || '';

  const knownOptions = useMemo(() => options || [], [options]);
  const isKnown = !currentValue || knownOptions.includes(currentValue);
  const [isCustom, setIsCustom] = useState(!isKnown);

  // When editing an employee, fall out of custom mode if the prefilled value
  // turns out to be in the catalogue.
  useEffect(() => {
    if (knownOptions.includes(currentValue)) setIsCustom(false);
  }, [knownOptions, currentValue]);

  const handleSelectChange = (e) => {
    const v = e.target.value;
    if (v === OTHER_SENTINEL) {
      setIsCustom(true);
      setFieldValue(name, '', true);
    } else {
      setIsCustom(false);
      setFieldValue(name, v, true);
    }
  };

  const selectValue = isCustom
    ? OTHER_SENTINEL
    : knownOptions.includes(currentValue)
      ? currentValue
      : '';

  const showError = meta.touched && Boolean(meta.error);
  const defaultHelper =
    helperText || `Pick from the list — or choose "Other" to add a new one.`;
  const customLabel = `Custom ${label.toLowerCase()}`;

  return (
    <Box>
      <TextField
        select
        label={label}
        required={required}
        value={selectValue}
        onChange={handleSelectChange}
        onBlur={() => setFieldTouched(name, true)}
        disabled={loading}
        helperText={
          showError
            ? meta.error
            : loading
              ? `Loading ${label.toLowerCase()}…`
              : defaultHelper
        }
        error={showError}
        fullWidth
      >
        {knownOptions.map((opt) => (
          <MenuItem key={opt} value={opt}>
            {opt}
          </MenuItem>
        ))}
        <MenuItem value={OTHER_SENTINEL} sx={{ fontStyle: 'italic' }}>
          Other (specify below)
        </MenuItem>
      </TextField>

      {isCustom && (
        <TextField
          label={customLabel}
          placeholder={customPlaceholder}
          value={currentValue}
          onChange={(e) => setFieldValue(name, e.target.value, true)}
          onBlur={() => setFieldTouched(name, true)}
          error={showError}
          helperText={showError ? meta.error : ' '}
          autoFocus
          required={required}
          fullWidth
          sx={{ mt: 2 }}
        />
      )}
    </Box>
  );
}
