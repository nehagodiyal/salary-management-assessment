import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Toolbar, useMediaQuery, useTheme } from '@mui/material';

import AppHeader from './AppHeader.jsx';
import AppSidebar from './AppSidebar.jsx';

const DRAWER_WIDTH = 248;

export default function AppLayout() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = () => setMobileOpen((v) => !v);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppHeader onMenuClick={toggleSidebar} drawerWidth={DRAWER_WIDTH} />
      <AppSidebar
        width={DRAWER_WIDTH}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        isDesktop={isDesktop}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          px: { xs: 1.5, sm: 2.5, md: 4 },
          pb: 6,
          maxWidth: '100%',
          overflowX: 'hidden',
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
