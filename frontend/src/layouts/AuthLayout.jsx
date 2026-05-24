import { Outlet } from 'react-router-dom';
import { Box, Container } from '@mui/material';

export default function AuthLayout() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e40af 0%, #0ea5e9 100%)',
        px: 2,
      }}
    >
      <Container maxWidth="sm">
        <Outlet />
      </Container>
    </Box>
  );
}
