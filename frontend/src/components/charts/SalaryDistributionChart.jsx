import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { formatCurrencyCompact, formatNumber } from '@/utils/formatters';
import ChartTooltip from './ChartTooltip.jsx';

const formatBucketLabel = (row) => {
  // Show the lower bound only; the bar width implies the bucket span.
  return formatCurrencyCompact(row.bucket_low);
};

export default function SalaryDistributionChart({ data }) {
  const items = (data || []).map((row) => ({
    name: formatBucketLabel(row),
    value: row.count,
    bucket_low: row.bucket_low,
    bucket_high: row.bucket_high,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={items} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <defs>
          <linearGradient id="grad-dist" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.85} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
          interval={0}
          angle={-30}
          textAnchor="end"
          height={56}
        />
        <YAxis
          tickFormatter={(v) => formatNumber(v)}
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          cursor={{ fill: 'rgba(16, 185, 129, 0.08)' }}
          content={
            <ChartTooltip
              valueFormatter={(v) => `${formatNumber(v)} employees`}
            />
          }
        />
        <Bar
          dataKey="value"
          fill="url(#grad-dist)"
          radius={[6, 6, 0, 0]}
          maxBarSize={56}
          animationDuration={800}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
