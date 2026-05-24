import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Stack,
  Typography,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Skeleton,
  Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

import SearchInput from '@/components/common/SearchInput';
import EmptyState from '@/components/feedback/EmptyState';
import { useEmployeesQuery } from '@/hooks/useEmployees';
import { formatCurrency, titleCase } from '@/utils/formatters';
import { SORT_FIELDS } from '@/config/constants';

const STATUS_COLOR = {
  active: 'success',
  on_leave: 'warning',
  terminated: 'default',
};

const initialsOf = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

/**
 * Searchable employee picker. Used from anywhere that needs the admin to
 * choose a specific employee before continuing (e.g. "Edit employee" from
 * the dashboard).
 */
export default function EmployeePickerDialog({ open, onClose, title = 'Edit employee', actionLabel = 'Edit' }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data, isLoading, isFetching } = useEmployeesQuery({
    page: 1,
    page_size: 10,
    search,
    sort_by: SORT_FIELDS.FULL_NAME,
    sort_dir: 'asc',
  });

  const employees = data?.items || [];

  const handlePick = (employee) => {
    onClose?.();
    navigate(`/employees/${employee.id}/edit`);
  };

  const handleClose = () => {
    setSearch('');
    onClose?.();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1.5,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <EditIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700} lineHeight={1.1}>
              {title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Search by name or email, then pick an employee to edit
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>
      <DialogContent dividers sx={{ pb: 1 }}>
        <SearchInput
          placeholder="Search by name or email…"
          onChange={setSearch}
          fullWidth
        />

        <Box sx={{ mt: 2, minHeight: 240 }}>
          {isLoading || (isFetching && employees.length === 0) ? (
            <Stack spacing={1}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} variant="rounded" height={56} />
              ))}
            </Stack>
          ) : employees.length === 0 ? (
            <EmptyState
              title="No employees found"
              description={
                search
                  ? `Nothing matches “${search}”. Try a different search term.`
                  : 'Start typing to search your workforce.'
              }
            />
          ) : (
            <List dense disablePadding>
              {employees.map((e) => (
                <ListItemButton
                  key={e.id}
                  onClick={() => handlePick(e)}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    '&:hover .pick-cta': { opacity: 1 },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        background:
                          'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      {initialsOf(e.full_name) || '?'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ fontWeight: 600 }}>{e.full_name}</Box>
                    }
                    secondary={
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ mt: 0.25 }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {e.job_title} · {e.department}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          · {formatCurrency(e.salary)}
                        </Typography>
                      </Stack>
                    }
                  />
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      size="small"
                      label={titleCase(e.status)}
                      color={STATUS_COLOR[e.status] || 'default'}
                      variant="outlined"
                    />
                    <Chip
                      label={actionLabel}
                      size="small"
                      color="primary"
                      className="pick-cta"
                      sx={{
                        opacity: 0,
                        transition: 'opacity 120ms ease',
                        fontWeight: 700,
                      }}
                    />
                  </Stack>
                </ListItemButton>
              ))}
            </List>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
