import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { formatCurrency, formatCurrencyCompact, formatNumber } from '@/utils/formatters';
import ChartTooltip from './ChartTooltip.jsx';

export default function TenureBandsChart({ data }) {
  // Recharts wants flat numeric props; we ship both metrics so the tooltip
  // can show count alongside the (primary) avg-salary value.
  const items = (data || []).map((row) => ({
    name: row.band,
    value: row.average_salary == null ? 0 : Math.round(row.average_salary),
    employees: row.employee_count,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={items} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <defs>
          <linearGradient id="grad-tenure" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.95} />
            <stop offset="100%" stopColor="#fb923c" stopOpacity={0.85} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatCurrencyCompact}
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
          width={70}
        />
        <Tooltip
          cursor={{ fill: 'rgba(245, 158, 11, 0.08)' }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const item = payload[0].payload;
            return (
              <ChartTooltip
                active
                payload={[
                  { value: item.value },
                ]}
                label={`${label} · ${formatNumber(item.employees)} employees`}
                valueFormatter={(v) =>
                  item.employees === 0 ? '—' : `Avg ${formatCurrency(v)}`
                }
              />
            );
          }}
        />
        <Bar
          dataKey="value"
          fill="url(#grad-tenure)"
          radius={[8, 8, 0, 0]}
          maxBarSize={64}
          animationDuration={800}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
