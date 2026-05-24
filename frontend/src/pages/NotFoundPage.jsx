import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <Box sx={{ py: 10, textAlign: 'center' }}>
      <Typography variant="h2" fontWeight={700}>
        404
      </Typography>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        Page not found
      </Typography>
      <Button variant="contained" onClick={() => navigate('/dashboard')} sx={{ mt: 2 }}>
        Back to dashboard
      </Button>
    </Box>
  );
}
