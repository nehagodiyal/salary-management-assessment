import { useState } from 'react';
import { Card, CardContent, Stack, Button, Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import PeopleIcon from '@mui/icons-material/People';
import InsightsIcon from '@mui/icons-material/Insights';
import BoltIcon from '@mui/icons-material/Bolt';

import EmployeePickerDialog from '@/components/employees/EmployeePickerDialog';

export default function QuickActions({ canCreate = true }) {
  const navigate = useNavigate();
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <>
      <Card sx={{ mb: 3, position: 'relative', overflow: 'hidden' }}>
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
          }}
        />
        <CardContent
          sx={{
            p: { xs: 2, sm: 2.5 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 6px 14px -4px rgba(99, 102, 241, 0.5)',
              }}
            >
              <BoltIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} lineHeight={1.1}>
                Quick actions
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Common operations, one click away.
              </Typography>
            </Box>
          </Stack>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            sx={{ flex: { xs: '1 1 100%', sm: 'unset' } }}
          >
            {canCreate && (
              <Button
                variant="contained"
                size="medium"
                startIcon={<AddIcon />}
                onClick={() => navigate('/employees/new')}
              >
                Add employee
              </Button>
            )}
            {canCreate && (
              <Button
                variant="outlined"
                size="medium"
                startIcon={<EditIcon />}
                onClick={() => setPickerOpen(true)}
              >
                Edit employee
              </Button>
            )}
            <Button
              variant="outlined"
              size="medium"
              startIcon={<PeopleIcon />}
              onClick={() => navigate('/employees')}
            >
              View employees
            </Button>
            <Button
              variant="outlined"
              size="medium"
              startIcon={<InsightsIcon />}
              onClick={() => navigate('/analytics')}
            >
              Open analytics
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <EmployeePickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
      />
    </>
  );
}
