import { Box, Typography } from '@mui/material';

export default function ChartTooltip({ active, payload, label, valueFormatter }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const value = valueFormatter ? valueFormatter(item.value) : item.value;
  return (
    <Box
      sx={{
        bgcolor: 'rgba(15, 23, 42, 0.92)',
        color: '#fff',
        px: 1.5,
        py: 1,
        borderRadius: 1.5,
        minWidth: 140,
        boxShadow: 4,
      }}
    >
      <Typography variant="caption" sx={{ opacity: 0.7, display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.25 }}>
        {value}
      </Typography>
    </Box>
  );
}
