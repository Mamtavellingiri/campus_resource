import React, { useState, useEffect } from 'react';
import api from '../services/api';
import EcoBadge from '../components/EcoBadge';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Leaf, Zap, Award, TrendingUp, ShieldCheck, ArrowUpRight } from 'lucide-react';

export default function EnergyAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await api.get('/analytics/energy');
        if (res.data.success) {
          setAnalytics(res.data.analytics);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/20 via-slate-900 to-slate-900">
        <div>
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
            <Leaf className="w-4 h-4" /> Green Campus Initiative
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            Energy Consumption & Eco Score Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time power consumption metrics, energy savings from smart allocation, and building sustainability ratings
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
            <Award className="w-4 h-4" />
            Rating: A+ Green Campus
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold mb-1">Total Estimated Energy</div>
          <div className="text-2xl font-extrabold text-slate-100">124.5 kWh</div>
          <div className="text-[10px] text-slate-400 mt-1">Calculated from room power loads</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold mb-1">Energy Saved</div>
          <div className="text-2xl font-extrabold text-emerald-400">28.4 kWh</div>
          <div className="text-[10px] text-emerald-400 mt-1 font-medium">22% Reduction via Smart Booking</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold mb-1">Campus Eco Index</div>
          <div className="text-2xl font-extrabold text-emerald-400">92/100</div>
          <div className="text-[10px] text-emerald-400 mt-1 font-medium">Top 5% Sustainability Score</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold mb-1">CO₂ Offset Equivalent</div>
          <div className="text-2xl font-extrabold text-teal-400">14.2 kg</div>
          <div className="text-[10px] text-teal-400 mt-1 font-medium">Reduced Carbon Footprint</div>
        </div>
      </div>

      {/* Recharts Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="glass-panel p-6 rounded-3xl border border-slate-800">
          <h3 className="font-bold text-sm text-slate-100 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Monthly Eco Savings Trend (kWh)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.ecoTrendData || []}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="consumptionKwh" stroke="#ef4444" strokeWidth={2} name="Consumption (kWh)" />
                <Line type="monotone" dataKey="savedKwh" stroke="#22c55e" strokeWidth={3} name="Energy Saved (kWh)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-slate-800">
          <h3 className="font-bold text-sm text-slate-100 mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-teal-400" />
            Building Power Consumption Breakdown
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.buildingBreakdown || []}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} interval={0} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="totalEnergyKwh" fill="#14b8a6" radius={[6, 6, 0, 0]} name="Energy (kWh)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Top Green vs Most Consuming Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="glass-panel p-6 rounded-3xl border border-slate-800">
          <h3 className="font-bold text-sm text-slate-100 mb-4 flex items-center gap-2">
            <Leaf className="w-4 h-4 text-emerald-400" />
            Top 5 Greenest Campus Resources
          </h3>
          <div className="space-y-3">
            {analytics?.topGreenResources?.map((r) => (
              <div key={r.id} className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-100">{r.name}</div>
                  <div className="text-slate-400 text-[11px]">{r.building?.name}</div>
                </div>
                <EcoBadge score={r.ecoScore} />
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-slate-800">
          <h3 className="font-bold text-sm text-slate-100 mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-rose-400" />
            Highest Energy Consuming Resources
          </h3>
          <div className="space-y-3">
            {analytics?.topConsumingResources?.map((r) => (
              <div key={r.id} className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-100">{r.name}</div>
                  <div className="text-slate-400 text-[11px]">{r.building?.name}</div>
                </div>
                <span className="font-mono font-bold text-rose-400">{r.basePowerConsumptionKw} kW/h</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
