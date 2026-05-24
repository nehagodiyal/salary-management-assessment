import { useState } from 'react';
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
import PersonAddIcon from '@mui/icons-material/PersonAddAlt1';
import EditIcon from '@mui/icons-material/Edit';
import { NavLink, useLocation } from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth.jsx';
import EmployeePickerDialog from '@/components/employees/EmployeePickerDialog';

function NavItems({ onNavigate, isAdmin, onPick }) {
  const { pathname } = useLocation();

  const items = [
    { kind: 'link', to: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
    { kind: 'link', to: '/employees', label: 'Employees', icon: PeopleIcon },
    ...(isAdmin
      ? [
          {
            kind: 'link',
            to: '/employees/new',
            label: 'Add Employee',
            icon: PersonAddIcon,
            activeWhen: '/employees/new',
          },
          {
            kind: 'action',
            label: 'Edit Employee',
            icon: EditIcon,
            onClick: onPick,
          },
        ]
      : []),
    { kind: 'link', to: '/analytics', label: 'Analytics', icon: InsightsIcon },
  ];

  return (
    <List sx={{ px: 1.25, pt: 1 }}>
      {items.map((item) => {
        const Icon = item.icon;
        const active =
          item.kind === 'link' &&
          (item.activeWhen
            ? pathname === item.activeWhen
            : item.to === '/employees'
              ? pathname === '/employees' || /^\/employees\/[^/]+$/.test(pathname)
              : pathname.startsWith(item.to));

        const baseSx = {
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
        };

        const inner = (
          <>
            <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
              <Icon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontWeight: active ? 700 : 500,
                fontSize: 14,
              }}
            />
          </>
        );

        if (item.kind === 'action') {
          return (
            <ListItemButton
              key={item.label}
              onClick={() => {
                item.onClick?.();
                onNavigate?.();
              }}
              sx={baseSx}
            >
              {inner}
            </ListItemButton>
          );
        }

        return (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            onClick={onNavigate}
            sx={baseSx}
          >
            {inner}
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
  const { isAdmin } = useAuth();
  const [pickerOpen, setPickerOpen] = useState(false);

  const content = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Brand />
      <Divider />
      <NavItems
        onNavigate={isDesktop ? undefined : onClose}
        isAdmin={isAdmin}
        onPick={() => setPickerOpen(true)}
      />
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

  return (
    <>
      {isDesktop ? (
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
      ) : (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={onClose}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { width } }}
        >
          {content}
        </Drawer>
      )}
      <EmployeePickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
      />
    </>
  );
}
