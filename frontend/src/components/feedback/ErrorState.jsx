import { Alert, Box, Button } from '@mui/material';
import { extractApiError } from '@/api/errors';

export default function ErrorState({ error, onRetry, label = 'Could not load data' }) {
  const { message } = extractApiError(error);
  return (
    <Box sx={{ py: 2 }}>
      <Alert
        severity="error"
        action={
          onRetry && (
            <Button color="inherit" size="small" onClick={onRetry}>
              Retry
            </Button>
          )
        }
      >
        {label}: {message}
      </Alert>
    </Box>
  );
}
