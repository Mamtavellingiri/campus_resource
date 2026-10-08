import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import EcoBadge from '../components/EcoBadge';
import {
  Calendar,
  Clock,
  Sparkles,
  QrCode,
  CheckCircle2,
  AlertCircle,
  MapPin,
  ArrowRight,
  TrendingUp,
  Award,
  Search
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeBooking, setActiveBooking] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch user bookings
      const bRes = await api.get('/bookings');
      if (bRes.data.success) {
        const bList = bRes.data.bookings;
        setBookings(bList);

        // Find active checked-in or upcoming approved booking
        const current = bList.find(b => b.status === 'CHECKED_IN' || b.status === 'APPROVED');
        setActiveBooking(current || null);
      }

      // 2. Fetch AI Recommendations for student
      const todayStr = new Date().toISOString().split('T')[0];
      const recRes = await api.post('/bookings/recommend', {
        date: todayStr,
        startTime: '14:00',
        endTime: '16:00',
        attendeeCount: 25
      });
      if (recRes.data.success) {
        setRecommendations(recRes.data.recommendations.slice(0, 3));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const totalBookings = bookings.length;
  const pendingBookings = bookings.filter(b => b.status === 'PENDING').length;
  const noShows = bookings.filter(b => b.status === 'NO_SHOW').length;
  const checkedOutCount = bookings.filter(b => b.status === 'CHECKED_OUT').length;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
        <div>
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
            Student Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            Welcome back, {user?.name || 'Student'} 👋
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Department of {user?.department || 'Computer Science'} • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>

        <Link
          to="/history"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/20 shrink-0"
        >
          <Calendar className="w-4 h-4" />
          View Year Schedule
        </Link>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold mb-1">Total Bookings</div>
          <div className="text-2xl font-extrabold text-slate-100">{totalBookings}</div>
          <div className="text-[10px] text-emerald-400 mt-1 font-medium">History records</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold mb-1">Pending Approvals</div>
          <div className="text-2xl font-extrabold text-amber-400">{pendingBookings}</div>
          <div className="text-[10px] text-amber-400 mt-1 font-medium">Awaiting Clearance</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold mb-1">No-Show Count</div>
          <div className="text-2xl font-extrabold text-rose-400">{noShows}</div>
          <div className="text-[10px] text-slate-400 mt-1">Grace Period Release</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold mb-1">Eco Score Saved</div>
          <div className="text-2xl font-extrabold text-emerald-400">94/100</div>
          <div className="text-[10px] text-emerald-400 mt-1 font-medium">Top Green User</div>
        </div>
      </div>

      {/* ACTIVE BOOKING QR CARD BANNER */}
      {activeBooking ? (
        <div className="glass-panel p-6 rounded-3xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {activeBooking.status === 'CHECKED_IN' ? 'LIVE SESSION ACTIVE' : 'UPCOMING APPROVED BOOKING'}
                </span>
                <EcoBadge score={activeBooking.ecoScoreCalculated} />
              </div>

              <h3 className="text-xl font-extrabold text-slate-100">
                {activeBooking.resource?.name}
              </h3>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  {activeBooking.resource?.building?.name} (Room {activeBooking.resource?.roomNumber})
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  {activeBooking.date} ({activeBooking.startTime} - {activeBooking.endTime})
                </span>
              </div>
            </div>

            <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 shrink-0">
              Read-only class schedule
            </div>

          </div>
        </div>
      ) : (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 text-center py-8">
          <Clock className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-slate-200">No Active Class Booking Right Now</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            Faculty-scheduled sessions for your year will appear here.
          </p>
          <Link
            to="/history"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 text-xs font-bold hover:bg-slate-800"
          >
            <Calendar className="w-4 h-4" />
            View Year Schedule
          </Link>
        </div>
      )}

      {/* AI RECOMMENDED RESOURCES FOR YOU */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-100">AI Recommended for You</h2>
          </div>
          <Link to="/resources" className="text-xs text-emerald-400 font-semibold hover:underline">
            Customize Search →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendations.map((rec, i) => (
            <div key={i} className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition-all space-y-3">
              <div className="flex justify-between items-start">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {rec.suitabilityScore}% MATCH
                </span>
                <EcoBadge score={rec.ecoScore} />
              </div>

              <h4 className="font-bold text-sm text-slate-100">{rec.resource.name}</h4>
              <p className="text-xs text-slate-400">
                Cap: {rec.resource.capacity} seats • {rec.resource.building?.name}
              </p>

              <div className="text-[11px] text-slate-300 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 leading-tight">
                💡 {rec.reasons[0]}
              </div>

              <Link
                to={`/resources/${rec.resource.id}`}
                className="block text-center w-full py-2 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 text-xs font-bold hover:bg-slate-800"
              >
                View Resource
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* UPCOMING & RECENT BOOKINGS LIST */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm text-slate-100">My Year&apos;s Booking Schedule</h3>
          <Link to="/history" className="text-xs text-slate-400 hover:text-white">View All →</Link>
        </div>

        <div className="divide-y divide-slate-800/80">
          {bookings.slice(0, 5).map((b) => (
            <div key={b.id} className="py-3 flex items-center justify-between gap-4 text-xs">
              <div>
                <div className="font-semibold text-slate-200">{b.resource?.name}</div>
                <div className="text-slate-400 text-[11px]">
                  {b.date} ({b.startTime} - {b.endTime}) • {b.purpose}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  b.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' :
                  b.status === 'CHECKED_IN' ? 'bg-teal-500/20 text-teal-400' :
                  b.status === 'CHECKED_OUT' ? 'bg-slate-800 text-slate-300' :
                  b.status === 'NO_SHOW' ? 'bg-rose-500/20 text-rose-400' :
                  'bg-amber-500/20 text-amber-400'
                }`}>
                  {b.status}
                </span>

              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
