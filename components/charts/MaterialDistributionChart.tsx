'use client';

import { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { MaterialDistributionItem } from '@/lib/services/analytics';

interface MaterialDistributionChartProps {
  data: MaterialDistributionItem[];
  height?: number;
}

export default function MaterialDistributionChart({ data, height = 240 }: MaterialDistributionChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div 
        style={{ height }} 
        className="w-full rounded-xl bg-slate-100/70 animate-pulse flex items-center justify-center text-xs text-slate-400 font-medium"
      >
        Loading material distribution...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div 
        style={{ height }} 
        className="w-full rounded-xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center p-6 text-center"
      >
        <p className="text-xs font-semibold text-slate-500">No scan material records yet.</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
          <XAxis 
            dataKey="category" 
            tickLine={false} 
            axisLine={false} 
            tick={{ fontSize: 10, fill: '#64748b' }} 
          />
          <YAxis 
            tickLine={false} 
            axisLine={false} 
            tick={{ fontSize: 10, fill: '#64748b' }} 
            allowDecimals={false}
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const p = payload[0].payload as MaterialDistributionItem;
                return (
                  <div className="p-2.5 rounded-xl bg-slate-900 text-white shadow-xl text-xs space-y-0.5">
                    <p className="font-bold">{p.category}</p>
                    <p className="text-emerald-400 font-semibold">{p.count} scans ({p.percentage}%)</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`bar-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
