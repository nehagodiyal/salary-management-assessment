import { useEffect, useState } from 'react';
import { InputAdornment, TextField, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Close';

import useDebounce from '@/hooks/useDebounce';

export default function SearchInput({
  value: controlled,
  onChange,
  placeholder = 'Search…',
  fullWidth = false,
  debounceMs = 400,
}) {
  const [value, setValue] = useState(controlled ?? '');
  const debounced = useDebounce(value, debounceMs);

  useEffect(() => {
    onChange?.(debounced);
  }, [debounced, onChange]);

  return (
    <TextField
      value={value}
      size="small"
      placeholder={placeholder}
      onChange={(e) => setValue(e.target.value)}
      fullWidth={fullWidth}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon fontSize="small" />
          </InputAdornment>
        ),
        endAdornment: value ? (
          <InputAdornment position="end">
            <IconButton size="small" onClick={() => setValue('')} aria-label="clear search">
              <ClearIcon fontSize="small" />
            </IconButton>
          </InputAdornment>
        ) : null,
      }}
    />
  );
}
