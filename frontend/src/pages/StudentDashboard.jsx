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
  const [mappedFaculty, setMappedFaculty] = useState(user?.mappedFaculty || null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [bRes, meRes] = await Promise.all([
        api.get('/bookings'),
        api.get('/auth/me')
      ]);
      if (meRes.data.success) {
        setMappedFaculty(meRes.data.user.mappedFaculty || null);
      }

      if (bRes.data.success) {
        const bList = bRes.data.bookings;
        setBookings(bList);

        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const timeNow = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const scheduled = bList
          .filter((booking) => ['APPROVED', 'CHECKED_IN'].includes(booking.status))
          .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
        const current = scheduled.find((booking) =>
          booking.date === todayStr &&
          (booking.status === 'CHECKED_IN' || (booking.startTime <= timeNow && booking.endTime > timeNow))
        );
        const next = scheduled.find((booking) =>
          booking.date > todayStr || (booking.date === todayStr && booking.startTime >= timeNow)
        );
        setActiveBooking(current || next || null);
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
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndStr = `${weekEnd.getFullYear()}-${String(weekEnd.getMonth() + 1).padStart(2, '0')}-${String(weekEnd.getDate()).padStart(2, '0')}`;
  const todayBookings = bookings
    .filter((booking) => booking.date === todayStr && ['APPROVED', 'CHECKED_IN', 'CHECKED_OUT'].includes(booking.status))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const upcomingBookings = bookings
    .filter((booking) =>
      booking.date >= todayStr &&
      booking.date <= weekEndStr &&
      ['APPROVED', 'CHECKED_IN'].includes(booking.status)
    )
    .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`))
    .slice(0, 7);

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
            Department of {user?.department || 'Computer Science'} · {user?.year || 'Year not assigned'} · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-400 mb-1">My Faculty</div>
          {mappedFaculty ? (
            <div className="text-sm font-bold text-slate-100">
              {mappedFaculty.name}<span className="text-xs font-normal text-slate-400"> · {mappedFaculty.department || 'Department not assigned'}</span>
            </div>
          ) : (
            <p className="text-xs text-slate-400">No faculty assigned to you yet. Please contact admin.</p>
          )}
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
                  {activeBooking.status === 'CHECKED_IN' ? 'LIVE SESSION ACTIVE' : activeBooking.startTime <= `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}` && activeBooking.endTime > `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}` && activeBooking.date === todayStr ? 'CURRENT CLASS' : 'NEXT CLASS'}
                </span>
                <EcoBadge score={activeBooking.ecoScoreCalculated} />
              </div>

              <h3 className="text-xl font-extrabold text-slate-100">
                {activeBooking.subject?.name || activeBooking.resource?.name}
              </h3>
              <p className="text-xs text-slate-300">Faculty: {activeBooking.user?.name || mappedFaculty?.name}</p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  Room {activeBooking.resource?.roomNumber}, {activeBooking.resource?.building?.name}, Floor {activeBooking.resource?.floor}
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
            Approved classes from your mapped faculty will appear here.
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <section className="glass-panel p-6 rounded-3xl border border-slate-800">
          <h3 className="font-bold text-sm text-slate-100 mb-4">Today&apos;s Timetable</h3>
          {todayBookings.length ? (
            <div className="divide-y divide-slate-800/80">
              {todayBookings.map((booking) => (
                <div key={booking.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                  <div>
                    <div className="font-semibold text-slate-200">{booking.startTime}-{booking.endTime} · {booking.subject?.name || booking.purpose}</div>
                    <div className="text-slate-400 mt-1">{booking.resource?.name} · Room {booking.resource?.roomNumber}, {booking.resource?.building?.name}, Floor {booking.resource?.floor}</div>
                    <div className="text-slate-500 mt-1">Faculty: {booking.user?.name || mappedFaculty?.name}</div>
                  </div>
                  <span className="text-emerald-400 font-semibold">{booking.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">No classes scheduled for today.</p>
          )}
        </section>

        <section className="glass-panel p-6 rounded-3xl border border-slate-800">
          <h3 className="font-bold text-sm text-slate-100 mb-4">Upcoming Classes This Week</h3>
          {upcomingBookings.length ? (
            <div className="divide-y divide-slate-800/80">
              {upcomingBookings.map((booking) => (
                <div key={booking.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                  <div>
                    <div className="font-semibold text-slate-200">{booking.date} · {booking.startTime}-{booking.endTime} · {booking.subject?.name || booking.purpose}</div>
                    <div className="text-slate-400 mt-1">{booking.resource?.name} · Room {booking.resource?.roomNumber}, {booking.resource?.building?.name}, Floor {booking.resource?.floor}</div>
                    <div className="text-slate-500 mt-1">Faculty: {booking.user?.name || mappedFaculty?.name}</div>
                  </div>
                  <span className="text-emerald-400 font-semibold">{booking.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">No upcoming approved classes this week.</p>
          )}
        </section>
      </div>

      <nav className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-wrap gap-3" aria-label="Student quick links">
        <Link to="/resources" className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-emerald-400">Resources</Link>
        <Link to="/calendar" className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-emerald-400">Calendar</Link>
        <Link to="/feedback" className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-emerald-400">Feedback</Link>
      </nav>

      {/* UPCOMING APPROVED BOOKINGS */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm text-slate-100">My Faculty&apos;s Approved Schedule</h3>
          <Link to="/history" className="text-xs text-slate-400 hover:text-white">View All →</Link>
        </div>

        <div className="divide-y divide-slate-800/80">
          {upcomingBookings.slice(0, 5).map((b) => (
            <div key={b.id} className="py-3 flex items-center justify-between gap-4 text-xs">
              <div>
                <div className="font-semibold text-slate-200">{b.resource?.name}</div>
                <div className="text-slate-400 text-[11px]">
                  {b.date} ({b.startTime} - {b.endTime}) • {b.purpose}
                </div>
                {b.subject?.name && (
                  <div className="text-slate-500 text-[10px] mt-1">
                    {b.subject.name} · Faculty: {b.user?.name || 'Not specified'}
                  </div>
                )}
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
