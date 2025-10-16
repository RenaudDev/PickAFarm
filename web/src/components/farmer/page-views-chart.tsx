/**
 * Page Views Chart Component
 * Story 2.4: Farmer Dashboard Layout & Overview Page
 *
 * Displays a line chart showing page views over the last 30 days.
 * Uses Recharts library with PickAFarm branding colors.
 */

'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface PageViewsChartProps {
  data: Array<{ date: string; views: number }>;
}

export default function PageViewsChart({ data }: PageViewsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => {
            const date = new Date(value);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          }}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '8px 12px',
          }}
          labelFormatter={(value) => {
            const date = new Date(value as string);
            return date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
          }}
        />
        <Line
          type="monotone"
          dataKey="views"
          stroke="#2D5016"
          strokeWidth={2}
          dot={{ fill: '#2D5016', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
