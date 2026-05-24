const DEFAULT_CURRENCY = 'INR';
const DEFAULT_LOCALE = 'en-IN';

export const formatCurrency = (value, currency = DEFAULT_CURRENCY, locale = DEFAULT_LOCALE) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `₹${Math.round(value).toLocaleString(locale)}`;
  }
};

/**
 * Indian-style compact currency (lakh / crore). Use for axis ticks and
 * stat cards where space is tight.
 *   12,000      → ₹12,000
 *   1,25,000    → ₹1.25L
 *   1,20,00,000 → ₹1.2Cr
 */
export const formatCurrencyCompact = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const n = Number(value);
  const abs = Math.abs(n);
  if (abs >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2).replace(/\.?0+$/, '')}Cr`;
  if (abs >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2).replace(/\.?0+$/, '')}L`;
  if (abs >= 1_000) return `₹${(n / 1_000).toFixed(1).replace(/\.?0+$/, '')}K`;
  return `₹${Math.round(n).toLocaleString(DEFAULT_LOCALE)}`;
};

export const formatNumber = (value, locale = DEFAULT_LOCALE) => {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat(locale).format(value);
};

/**
 * Compact head-count formatter. 1234 → 1.2K, 12_500 → 12.5K, 1_500_000 → 1.5M
 */
export const formatNumberCompact = (value) => {
  if (value === null || value === undefined) return '—';
  const n = Number(value);
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.?0+$/, '')}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.?0+$/, '')}K`;
  return String(Math.round(n));
};

export const formatDate = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return String(value);
  }
};

export const titleCase = (value) => {
  if (!value) return '';
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};
