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

export default function AvgSalaryByCountryChart({ data, limit = 10 }) {
  const items = [...(data || [])]
    .sort((a, b) => b.average_salary - a.average_salary)
    .slice(0, limit)
    .map((d) => ({ name: d.group, value: Math.round(d.average_salary) }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={items} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <defs>
          <linearGradient id="grad-country" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.95} />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.85} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#64748b' }}
          interval={0}
          angle={-20}
          textAnchor="end"
          height={56}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatCurrencyCompact}
          tick={{ fontSize: 11, fill: '#64748b' }}
          width={70}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
          content={<ChartTooltip valueFormatter={(v) => formatCurrency(v)} />}
        />
        <Bar
          dataKey="value"
          fill="url(#grad-country)"
          radius={[8, 8, 0, 0]}
          maxBarSize={56}
          animationDuration={800}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
