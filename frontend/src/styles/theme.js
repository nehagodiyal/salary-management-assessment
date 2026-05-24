import { createTheme } from '@mui/material/styles';

const palette = {
  mode: 'light',
  primary: {
    main: '#4f46e5',
    light: '#818cf8',
    dark: '#3730a3',
    contrastText: '#fff',
  },
  secondary: {
    main: '#06b6d4',
    light: '#22d3ee',
    dark: '#0e7490',
    contrastText: '#fff',
  },
  success: { main: '#10b981', light: '#34d399', dark: '#047857' },
  warning: { main: '#f59e0b', light: '#fbbf24', dark: '#b45309' },
  error: { main: '#ef4444', light: '#f87171', dark: '#b91c1c' },
  info: { main: '#0ea5e9', light: '#38bdf8', dark: '#0369a1' },
  background: {
    default: '#f4f5fb',
    paper: '#ffffff',
  },
  text: {
    primary: '#0f172a',
    secondary: '#64748b',
  },
  divider: 'rgba(15, 23, 42, 0.08)',
};

const accentGradients = {
  primary: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  secondary: 'linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%)',
  success: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
  warning: 'linear-gradient(135deg, #f59e0b 0%, #fb923c 100%)',
  error: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
  info: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
  rose: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
  emerald: 'linear-gradient(135deg, #059669 0%, #14b8a6 100%)',
};

export const theme = createTheme({
  palette,
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Helvetica',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: { fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontWeight: 800, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700, letterSpacing: '-0.02em' },
    h4: { fontWeight: 700, fontSize: '1.6rem', letterSpacing: '-0.02em' },
    h5: { fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.01em' },
    h6: { fontWeight: 700, fontSize: '1rem' },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0 },
  },
  shadows: [
    'none',
    '0 1px 2px rgba(15, 23, 42, 0.04)',
    '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
    '0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)',
    '0 6px 10px -2px rgba(15, 23, 42, 0.08), 0 4px 6px -2px rgba(15, 23, 42, 0.04)',
    '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -2px rgba(15, 23, 42, 0.04)',
    '0 12px 20px -3px rgba(15, 23, 42, 0.10), 0 6px 10px -4px rgba(15, 23, 42, 0.04)',
    '0 14px 22px -3px rgba(15, 23, 42, 0.10), 0 7px 12px -4px rgba(15, 23, 42, 0.04)',
    '0 16px 24px -3px rgba(15, 23, 42, 0.10), 0 8px 14px -4px rgba(15, 23, 42, 0.04)',
    '0 18px 26px -3px rgba(15, 23, 42, 0.10), 0 9px 16px -4px rgba(15, 23, 42, 0.04)',
    '0 20px 28px -3px rgba(15, 23, 42, 0.10), 0 10px 18px -4px rgba(15, 23, 42, 0.04)',
    '0 22px 30px -3px rgba(15, 23, 42, 0.10), 0 11px 20px -4px rgba(15, 23, 42, 0.04)',
    '0 24px 32px -3px rgba(15, 23, 42, 0.10), 0 12px 22px -4px rgba(15, 23, 42, 0.04)',
    '0 26px 34px -3px rgba(15, 23, 42, 0.12), 0 13px 24px -4px rgba(15, 23, 42, 0.04)',
    '0 28px 36px -3px rgba(15, 23, 42, 0.12), 0 14px 26px -4px rgba(15, 23, 42, 0.04)',
    '0 30px 38px -3px rgba(15, 23, 42, 0.12), 0 15px 28px -4px rgba(15, 23, 42, 0.04)',
    '0 32px 40px -3px rgba(15, 23, 42, 0.12), 0 16px 30px -4px rgba(15, 23, 42, 0.04)',
    '0 34px 42px -3px rgba(15, 23, 42, 0.12), 0 17px 32px -4px rgba(15, 23, 42, 0.04)',
    '0 36px 44px -3px rgba(15, 23, 42, 0.14), 0 18px 34px -4px rgba(15, 23, 42, 0.04)',
    '0 38px 46px -3px rgba(15, 23, 42, 0.14), 0 19px 36px -4px rgba(15, 23, 42, 0.04)',
    '0 40px 48px -3px rgba(15, 23, 42, 0.14), 0 20px 38px -4px rgba(15, 23, 42, 0.04)',
    '0 42px 50px -3px rgba(15, 23, 42, 0.14), 0 21px 40px -4px rgba(15, 23, 42, 0.04)',
    '0 44px 52px -3px rgba(15, 23, 42, 0.16), 0 22px 42px -4px rgba(15, 23, 42, 0.04)',
    '0 46px 54px -3px rgba(15, 23, 42, 0.16), 0 23px 44px -4px rgba(15, 23, 42, 0.04)',
    '0 48px 56px -3px rgba(15, 23, 42, 0.16), 0 24px 46px -4px rgba(15, 23, 42, 0.04)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: palette.background.default },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 12, paddingInline: 18, paddingBlock: 8 },
        sizeLarge: { paddingBlock: 12 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          border: `1px solid ${palette.divider}`,
          boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
          transition: 'box-shadow 200ms ease, transform 200ms ease',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'saturate(180%) blur(12px)',
          color: palette.text.primary,
          borderBottom: `1px solid ${palette.divider}`,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          fontSize: 12,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: palette.text.secondary,
          backgroundColor: '#f8fafc',
          borderBottom: `1px solid ${palette.divider}`,
        },
        body: {
          borderBottom: `1px solid ${palette.divider}`,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 120ms ease',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          fontSize: 12,
          padding: '6px 10px',
          borderRadius: 8,
        },
      },
    },
  },
});

theme.accents = accentGradients;

export default theme;
