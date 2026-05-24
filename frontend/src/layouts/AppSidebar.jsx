import {
  Drawer,
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import InsightsIcon from '@mui/icons-material/Insights';
import PaidIcon from '@mui/icons-material/Paid';
import { NavLink, useLocation } from 'react-router-dom';

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { to: '/employees', label: 'Employees', icon: PeopleIcon },
  { to: '/analytics', label: 'Analytics', icon: InsightsIcon },
];

function NavItems({ onNavigate }) {
  const { pathname } = useLocation();
  return (
    <List sx={{ px: 1.25, pt: 1 }}>
      {nav.map(({ to, label, icon: Icon }) => {
        const active = pathname.startsWith(to);
        return (
          <ListItemButton
            key={to}
            component={NavLink}
            to={to}
            onClick={onNavigate}
            sx={{
              borderRadius: 2.5,
              mb: 0.75,
              py: 1.2,
              color: active ? 'primary.main' : 'text.secondary',
              background: active
                ? 'linear-gradient(135deg, rgba(99,102,241,0.10) 0%, rgba(139,92,246,0.10) 100%)'
                : 'transparent',
              position: 'relative',
              '&::before': active
                ? {
                    content: '""',
                    position: 'absolute',
                    left: -4,
                    top: 10,
                    bottom: 10,
                    width: 3,
                    borderRadius: 2,
                    background:
                      'linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%)',
                  }
                : {},
              '&:hover': {
                background: active
                  ? 'linear-gradient(135deg, rgba(99,102,241,0.14) 0%, rgba(139,92,246,0.14) 100%)'
                  : 'rgba(15, 23, 42, 0.04)',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
              <Icon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={label}
              primaryTypographyProps={{
                fontWeight: active ? 700 : 500,
                fontSize: 14,
              }}
            />
          </ListItemButton>
        );
      })}
    </List>
  );
}

function Brand() {
  return (
    <Toolbar sx={{ gap: 1.25, minHeight: { xs: 60, sm: 68 } }}>
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: 2.5,
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          color: '#fff',
          display: 'grid',
          placeItems: 'center',
          boxShadow: '0 6px 14px -4px rgba(99, 102, 241, 0.5)',
        }}
      >
        <PaidIcon fontSize="small" />
      </Box>
      <Box>
        <Typography variant="subtitle1" fontWeight={800} lineHeight={1.1}>
          Salary Mgmt
        </Typography>
        <Typography variant="caption" color="text.secondary">
          HR Console
        </Typography>
      </Box>
    </Toolbar>
  );
}

export default function AppSidebar({ width, mobileOpen, onClose, isDesktop }) {
  const content = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Brand />
      <Divider />
      <NavItems onNavigate={isDesktop ? undefined : onClose} />
      <Box sx={{ flexGrow: 1 }} />
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            background:
              'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.08) 100%)',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            VERSION
          </Typography>
          <Typography variant="body2" fontWeight={700}>
            v0.1.0
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  if (isDesktop) {
    return (
      <Drawer
        variant="permanent"
        open
        sx={{
          width,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width,
            borderRight: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          },
        }}
      >
        {content}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="temporary"
      open={mobileOpen}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width } }}
    >
      {content}
    </Drawer>
  );
}
