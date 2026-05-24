import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Typography,
  Divider,
  Tooltip,
  Chip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import PaidIcon from '@mui/icons-material/Paid';

import { useAuth } from '@/hooks/useAuth.jsx';

export default function AppHeader({ onMenuClick, drawerWidth }) {
  const { user, logout } = useAuth();
  const [anchor, setAnchor] = useState(null);

  const initials = user?.email ? user.email[0].toUpperCase() : '?';

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { md: `calc(100% - ${drawerWidth}px)` },
        ml: { md: `${drawerWidth}px` },
      }}
    >
      <Toolbar sx={{ gap: 1.5, minHeight: { xs: 60, sm: 68 } }}>
        <IconButton
          color="inherit"
          edge="start"
          onClick={onMenuClick}
          sx={{ display: { md: 'none' } }}
          aria-label="open navigation"
        >
          <MenuIcon />
        </IconButton>

        <Box
          sx={{
            display: { xs: 'flex', md: 'none' },
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: 1.5,
              background:
                'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <PaidIcon sx={{ fontSize: 18 }} />
          </Box>
          <Typography variant="subtitle1" fontWeight={700}>
            Salary Mgmt
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {user?.role && (
          <Chip
            label={user.role.toUpperCase()}
            size="small"
            sx={{
              display: { xs: 'none', sm: 'inline-flex' },
              bgcolor: 'rgba(99, 102, 241, 0.1)',
              color: 'primary.dark',
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: '0.05em',
            }}
          />
        )}

        <Tooltip title={user?.email || ''}>
          <IconButton onClick={(e) => setAnchor(e.currentTarget)} size="small">
            <Avatar
              sx={{
                width: 36,
                height: 36,
                background:
                  'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: '#fff',
                fontWeight: 700,
              }}
            >
              {initials}
            </Avatar>
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchor}
          open={!!anchor}
          onClose={() => setAnchor(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{ sx: { mt: 1, minWidth: 240, borderRadius: 2 } }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="body2" fontWeight={700}>
              {user?.email}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ textTransform: 'capitalize' }}
            >
              {user?.role}
            </Typography>
          </Box>
          <Divider />
          <MenuItem
            onClick={() => {
              setAnchor(null);
              logout();
            }}
            sx={{ py: 1.25 }}
          >
            <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
