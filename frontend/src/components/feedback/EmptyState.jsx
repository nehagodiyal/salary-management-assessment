import { Box, Typography } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';

export default function EmptyState({
  title = 'Nothing here yet',
  description = '',
  icon: Icon = InboxIcon,
  action = null,
}) {
  return (
    <Box
      sx={{
        py: 6,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.25,
      }}
    >
      <Icon sx={{ fontSize: 48, color: 'text.disabled' }} />
      <Typography variant="h6">{title}</Typography>
      {description && (
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      )}
      {action}
    </Box>
  );
}
