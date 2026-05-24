import { Card, CardActionArea, CardContent, Skeleton, Stack, Typography, Box } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const ACCENTS = {
  primary: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  secondary: 'linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%)',
  success: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
  warning: 'linear-gradient(135deg, #f59e0b 0%, #fb923c 100%)',
  error: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
  info: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
  rose: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
  emerald: 'linear-gradient(135deg, #059669 0%, #14b8a6 100%)',
};

export default function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  accent = 'primary',
  loading = false,
  onClick,
  trend,
  cta,
}) {
  const gradient = ACCENTS[accent] || ACCENTS.primary;
  const isInteractive = !!onClick;

  const body = (
    <CardContent
      sx={{
        p: { xs: 2.25, sm: 2.5 },
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: gradient,
          opacity: 0.06,
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: gradient,
        }}
      />
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        spacing={1.5}
        sx={{ position: 'relative', flex: 1 }}
      >
        <Box sx={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              fontSize: 11,
            }}
          >
            {label}
          </Typography>
          {loading ? (
            <Skeleton variant="text" width={140} height={40} sx={{ mt: 0.5 }} />
          ) : (
            <Typography
              variant="h4"
              sx={{
                mt: 0.5,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                wordBreak: 'break-word',
                fontSize: { xs: '1.5rem', sm: '1.6rem' },
                lineHeight: 1.15,
              }}
            >
              {value ?? '—'}
            </Typography>
          )}
          {helper && !loading && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 0.5, fontWeight: 500 }}
            >
              {helper}
            </Typography>
          )}
          {trend && !loading && (
            <Typography
              variant="caption"
              sx={{
                display: 'inline-block',
                mt: 0.75,
                px: 1,
                py: 0.25,
                borderRadius: 999,
                fontWeight: 700,
                color: trend.positive ? 'success.dark' : 'error.dark',
                bgcolor: trend.positive
                  ? 'rgba(16, 185, 129, 0.10)'
                  : 'rgba(239, 68, 68, 0.10)',
              }}
            >
              {trend.label}
            </Typography>
          )}

          <Box sx={{ flex: 1 }} />

          {cta && isInteractive && !loading && (
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.5}
              sx={{
                mt: 1.5,
                color: 'primary.main',
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: '0.02em',
              }}
            >
              <span>{cta}</span>
              <ArrowForwardIcon sx={{ fontSize: 14 }} />
            </Stack>
          )}
        </Box>
        {Icon && (
          <Box
            sx={{
              flexShrink: 0,
              width: 44,
              height: 44,
              borderRadius: 2.5,
              background: gradient,
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              boxShadow: '0 8px 16px -4px rgba(15, 23, 42, 0.2)',
            }}
          >
            <Icon fontSize="small" />
          </Box>
        )}
      </Stack>
    </CardContent>
  );

  return (
    <Card
      sx={{
        height: '100%',
        overflow: 'hidden',
        '&:hover': isInteractive
          ? { transform: 'translateY(-3px)', boxShadow: 8 }
          : { boxShadow: 3 },
      }}
    >
      {isInteractive ? (
        <CardActionArea
          onClick={onClick}
          sx={{ height: '100%', alignItems: 'stretch' }}
        >
          {body}
        </CardActionArea>
      ) : (
        body
      )}
    </Card>
  );
}
