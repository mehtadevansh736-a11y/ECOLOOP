'use client';

import { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { TrendPoint } from '@/lib/services/analytics';

interface ImpactTrendChartProps {
  data: TrendPoint[];
  height?: number;
}

export default function ImpactTrendChart({ data, height = 300 }: ImpactTrendChartProps) {
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
        Loading trend chart...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div 
        style={{ height }} 
        className="w-full rounded-xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center p-6 text-center"
      >
        <p className="text-xs font-semibold text-slate-500">No activity data for this time range.</p>
        <p className="text-[11px] text-slate-400 mt-1">Start scanning items to see your environmental trend.</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="date" 
            tickLine={false} 
            axisLine={false} 
            tick={{ fontSize: 11, fill: '#64748b' }} 
          />
          <YAxis 
            tickLine={false} 
            axisLine={false} 
            tick={{ fontSize: 11, fill: '#64748b' }} 
            unit=" kg"
          />
          <Tooltip 
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const p = payload[0].payload as TrendPoint;
                return (
                  <div className="p-3 rounded-xl bg-slate-900 text-white shadow-xl text-xs space-y-1">
                    <p className="font-bold border-b border-slate-700 pb-1">{label}</p>
                    <p className="text-emerald-400 font-semibold">
                      Estimated CO₂ Avoided: {p.co2Saved} kg
                    </p>
                    <p className="text-slate-400 text-[11px]">
                      Circular Actions: {p.actionCount}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area 
            type="monotone" 
            dataKey="co2Saved" 
            stroke="#10b981" 
            strokeWidth={2.5} 
            fillOpacity={1} 
            fill="url(#emeraldGradient)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
