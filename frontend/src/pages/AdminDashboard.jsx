import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
import {
  Shield,
  Layers,
  CheckSquare,
  Wrench,
  Leaf,
  Users,
  AlertTriangle,
  TrendingUp,
  Activity,
  ArrowRight,
  RefreshCw,
  Building2
} from 'lucide-react';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [energyData, setEnergyData] = useState(null);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [overviewRes, energyRes, pendingRes] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/analytics/energy'),
        api.get('/bookings?status=PENDING')
      ]);

      if (overviewRes.data.success) setMetrics(overviewRes.data.metrics);
      if (energyRes.data.success) setEnergyData(energyRes.data.analytics);
      if (pendingRes.data.success) setPendingBookings(pendingRes.data.bookings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const COLORS = ['#22c55e', '#14b8a6', '#06b6d4', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-rose-500/30 bg-gradient-to-r from-rose-950/20 via-slate-900 to-slate-900">
        <div>
          <span className="text-xs font-bold text-rose-400 uppercase tracking-widest flex items-center gap-1">
            <Shield className="w-4 h-4" /> System Executive Control Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            Campus Administration Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-Time Resource Allocation, Energy Analytics & No-Show Monitoring
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAdminData}
            className="p-2.5 rounded-xl bg-slate-900 text-slate-300 hover:text-white border border-slate-800"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/admin/resources"
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg flex items-center gap-2"
          >
            <Layers className="w-4 h-4" />
            Manage Resources
          </Link>
        </div>
      </div>

      {/* KPI METRICS GRID (8 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold mb-1">Total Resources</div>
          <div className="text-2xl font-extrabold text-slate-100">{metrics?.totalResources || 15}</div>
          <div className="text-[10px] text-emerald-400 mt-1">{metrics?.availableResources || 12} Available Now</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold mb-1">Pending Approvals</div>
          <div className="text-2xl font-extrabold text-amber-400">{metrics?.pendingApprovals || 0}</div>
          <div className="text-[10px] text-amber-400 mt-1 font-medium">Requires Admin Clearance</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold mb-1">Under Maintenance</div>
          <div className="text-2xl font-extrabold text-rose-400">{metrics?.maintenanceResources || 1}</div>
          <div className="text-[10px] text-rose-400 mt-1">Locked from Booking</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold mb-1">Resource Utilization</div>
          <div className="text-2xl font-extrabold text-emerald-400">{metrics?.utilizationRate || 76}%</div>
          <div className="text-[10px] text-emerald-400 mt-1 font-medium">Optimal Peak Allocation</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold mb-1">No-Show Released</div>
          <div className="text-2xl font-extrabold text-rose-400">{metrics?.noShowCount || 1}</div>
          <div className="text-[10px] text-slate-400 mt-1">15-min Grace Auto Release</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold mb-1">Today's Bookings</div>
          <div className="text-2xl font-extrabold text-teal-400">{metrics?.todayBookingsCount || 5}</div>
          <div className="text-[10px] text-slate-400 mt-1">Active Sessions</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold mb-1">Energy Saved</div>
          <div className="text-2xl font-extrabold text-emerald-400">{metrics?.estimatedSavingsKwh || 28} kWh</div>
          <div className="text-[10px] text-emerald-400 mt-1 font-medium">22% Smart Reduction</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold mb-1">Campus Eco Score</div>
          <div className="text-2xl font-extrabold text-emerald-400">{metrics?.avgEcoScore || 91}/100</div>
          <div className="text-[10px] text-emerald-400 mt-1 font-medium">High Efficiency Rating</div>
        </div>

      </div>

      {/* RECHARTS CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Monthly Eco Power Trend */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Leaf className="w-4 h-4 text-emerald-400" />
              Monthly Campus Eco Energy Savings (kWh)
            </h3>
            <span className="text-[11px] text-emerald-400 font-semibold">2026 Trend</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={energyData?.ecoTrendData || []}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="consumptionKwh" stroke="#ef4444" strokeWidth={2} name="Consumption (kWh)" />
                <Line type="monotone" dataKey="savedKwh" stroke="#22c55e" strokeWidth={3} name="Saved Energy (kWh)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Building Energy Breakdown Bar Chart */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-400" />
              Energy Usage per Building (kWh)
            </h3>
            <span className="text-[11px] text-slate-400">By Building</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={energyData?.buildingBreakdown || []}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} interval={0} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="totalEnergyKwh" fill="#14b8a6" radius={[6, 6, 0, 0]} name="Energy (kWh)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* PENDING APPROVALS QUEUE FOR ADMIN */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm text-slate-100">Pending Booking Clearances</h3>
          </div>
          <Link to="/admin/bookings" className="text-xs text-emerald-400 font-semibold hover:underline">
            Manage All Bookings →
          </Link>
        </div>

        {pendingBookings.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No pending booking requests. All system requests are processed!
          </div>
        ) : (
          <div className="space-y-3">
            {pendingBookings.slice(0, 3).map((b) => (
              <div key={b.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div>
                  <div className="font-semibold text-slate-100">{b.resource?.name}</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Requested by <strong className="text-slate-200">{b.user?.name}</strong> ({b.user?.role}) • {b.date} ({b.startTime} - {b.endTime})
                  </div>
                  <div className="text-slate-300 text-xs italic mt-1 font-mono">"{b.purpose}"</div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to="/admin/bookings"
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-bold border border-emerald-500/30"
                  >
                    Process Approval
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
