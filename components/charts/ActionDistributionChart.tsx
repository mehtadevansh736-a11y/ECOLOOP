'use client';

import { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { ActionDistributionItem } from '@/lib/services/analytics';

interface ActionDistributionChartProps {
  data: ActionDistributionItem[];
  height?: number;
}

export default function ActionDistributionChart({ data, height = 260 }: ActionDistributionChartProps) {
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
        Loading action distribution...
      </div>
    );
  }

  const activeData = data.filter((item) => item.count > 0);

  if (activeData.length === 0) {
    return (
      <div 
        style={{ height }} 
        className="w-full rounded-xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center p-6 text-center"
      >
        <p className="text-xs font-semibold text-slate-500">No actions recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
      <div style={{ width: '100%', height, maxWidth: '240px' }} className="mx-auto">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={activeData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={4}
              dataKey="count"
            >
              {activeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const p = payload[0].payload as ActionDistributionItem;
                  return (
                    <div className="p-2.5 rounded-xl bg-slate-900 text-white shadow-xl text-xs space-y-0.5">
                      <p className="font-bold">{p.name}</p>
                      <p className="text-slate-300">{p.count} items ({p.percentage}%)</p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="w-full md:w-48 space-y-2 text-xs">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
              <span className="text-slate-700 font-medium">{item.name}</span>
            </div>
            <span className="font-bold text-slate-900">{item.count} <span className="text-slate-400 font-normal">({item.percentage}%)</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}
