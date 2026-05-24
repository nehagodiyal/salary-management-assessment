import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { formatCurrency, formatCurrencyCompact } from '@/utils/formatters';
import ChartTooltip from './ChartTooltip.jsx';

export default function HighestPayingJobsChart({ data, limit = 8 }) {
  const items = [...(data || [])]
    .sort((a, b) => b.average_salary - a.average_salary)
    .slice(0, limit)
    .map((d) => ({ name: d.group, value: Math.round(d.average_salary) }))
    .reverse();

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        layout="vertical"
        data={items}
        margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
      >
        <defs>
          <linearGradient id="grad-jobs" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.95} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={formatCurrencyCompact}
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          dataKey="name"
          type="category"
          width={160}
          tick={{ fontSize: 12, fill: '#0f172a', fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: 'rgba(6, 182, 212, 0.08)' }}
          content={<ChartTooltip valueFormatter={(v) => formatCurrency(v)} />}
        />
        <Bar
          dataKey="value"
          fill="url(#grad-jobs)"
          radius={[0, 8, 8, 0]}
          maxBarSize={26}
          animationDuration={800}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
