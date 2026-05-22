import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card } from '@/components/ui/Card';

interface ResultsChartProps {
  currentRevenue: number;
  projectedRevenue: number;
  profit: number;
  roi: number;
}

export const ResultsChart: React.FC<ResultsChartProps> = ({
  currentRevenue,
  projectedRevenue,
  profit,
  roi,
}) => {
  const data = [
    {
      name: 'Mevcut',
      value: currentRevenue,
      color: '#94a3b8', // Slate 400
    },
    {
      name: 'Gelecek',
      value: projectedRevenue,
      color: '#22c55e', // Green 500
    },
  ];

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <Card className="p-6 bg-white/5 border-white/10">
      <div className="flex flex-col h-full justify-between">
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <p className="text-sm text-green-300 mb-1">Net Kâr Artışı</p>
            <p className="text-2xl font-bold text-green-400">{formatCurrency(profit)}</p>
          </div>
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-sm text-blue-300 mb-1">ROI Oranı</p>
            <p className="text-2xl font-bold text-blue-400">%{roi.toFixed(0)}</p>
          </div>
        </div>

        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis hide stroke="#94a3b8" />
              <Tooltip
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => formatCurrency(Number(value) || 0)}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <p className="text-center text-sm text-gray-400 mt-4">
          Yatırımınızın <b>{Math.floor(roi / 100)}x</b> katını geri kazanabilirsiniz.
        </p>
      </div>
    </Card>
  );
};
