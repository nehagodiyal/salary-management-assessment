import {
  AreaChart,
  Area,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { formatNumber } from '@/utils/formatters';
import ChartTooltip from './ChartTooltip.jsx';

export default function HiringTrendsChart({ data, granularity = 'year' }) {
  const items = (data || []).map((row) => ({
    name: row.period,
    value: row.hire_count,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={items} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <defs>
          <linearGradient id="grad-trend" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
          interval={granularity === 'month' ? 'preserveStartEnd' : 0}
          minTickGap={20}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          tickFormatter={(v) => formatNumber(v)}
        />
        <Tooltip
          content={
            <ChartTooltip
              valueFormatter={(v) => `${formatNumber(v)} hires`}
            />
          }
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#0284c7"
          strokeWidth={2}
          fill="url(#grad-trend)"
          animationDuration={800}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
