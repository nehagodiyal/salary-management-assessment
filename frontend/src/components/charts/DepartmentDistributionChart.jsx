import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

import { formatNumber } from '@/utils/formatters';
import ChartTooltip from './ChartTooltip.jsx';

const COLORS = [
  '#6366f1',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#0ea5e9',
  '#ec4899',
];

export default function DepartmentDistributionChart({ data, onSliceClick }) {
  const items = (data || []).map((d) => ({ name: d.group, value: d.employee_count }));
  const clickable = typeof onSliceClick === 'function';

  const handleClick = (slice) => {
    if (!clickable) return;
    // Recharts passes the slice payload via `slice.payload` (or top-level on some versions).
    const name = slice?.payload?.name ?? slice?.name;
    if (name) onSliceClick(name);
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={items}
          dataKey="value"
          nameKey="name"
          innerRadius="55%"
          outerRadius="85%"
          paddingAngle={3}
          stroke="#fff"
          strokeWidth={2}
          animationDuration={800}
          onClick={handleClick}
          cursor={clickable ? 'pointer' : 'default'}
        >
          {items.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip valueFormatter={(v) => `${formatNumber(v)} employees`} />} />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          wrapperStyle={{ fontSize: 12 }}
          formatter={(v) => (
            <span style={{ color: '#475569', marginLeft: 4, cursor: clickable ? 'pointer' : 'default' }}>
              {v}
            </span>
          )}
          onClick={(entry) => clickable && onSliceClick(entry.value)}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
