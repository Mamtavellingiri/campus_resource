import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import QRModal from '../components/QRModal';
import EcoBadge from '../components/EcoBadge';
import {
  Briefcase,
  Calendar,
  Clock,
  Sparkles,
  CheckSquare,
  XCircle,
  CheckCircle2,
  Users,
  Building2,
  QrCode
} from 'lucide-react';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQRBooking, setSelectedQRBooking] = useState(null);

  const fetchFacultyData = async () => {
    setLoading(true);
    try {
      // Fetch bookings for faculty and department
      const res = await api.get('/bookings?view=all');
      if (res.data.success) {
        const bList = res.data.bookings;
        setBookings(bList.filter(b => b.userId === user.id));
        setPendingRequests(bList.filter(b => b.status === 'PENDING'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultyData();
  }, []);

  const handleApprove = async (id) => {
    try {
      await api.post(`/bookings/${id}/approve`);
      fetchFacultyData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id) => {
    try {
      await api.post(`/bookings/${id}/reject`, { reason: 'Schedule conflict with department lecture' });
      fetchFacultyData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-900">
        <div>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
            <Briefcase className="w-4 h-4" /> Faculty Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            Welcome, {user?.name || 'Professor'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Department of {user?.department || 'Computer Science'} • Event & Class Reservation Hub
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/booking/smart?eventType=ACADEMIC&recurring=true"
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Book Class / Recurring Lecture
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold mb-1">My Class Bookings</div>
          <div className="text-2xl font-extrabold text-slate-100">{bookings.length}</div>
          <div className="text-[10px] text-amber-400 mt-1 font-medium">Lectures & Workshops</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold mb-1">Pending Student Approvals</div>
          <div className="text-2xl font-extrabold text-amber-400">{pendingRequests.length}</div>
          <div className="text-[10px] text-amber-400 mt-1 font-medium">Requires Department Clearance</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold mb-1">Dept Utilization</div>
          <div className="text-2xl font-extrabold text-emerald-400">78%</div>
          <div className="text-[10px] text-emerald-400 mt-1 font-medium">High Eco Rating</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold mb-1">Active Eco Score</div>
          <div className="text-2xl font-extrabold text-emerald-400">92/100</div>
          <div className="text-[10px] text-emerald-400 mt-1 font-medium">Low Energy Footprint</div>
        </div>
      </div>

      {/* PENDING STUDENT BOOKING APPROVALS TABLE */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm text-slate-100">Student Booking Requests Awaiting Approval</h3>
          </div>
          <span className="text-xs text-slate-400">{pendingRequests.length} pending</span>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No pending student booking requests for your department.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Resource Requested</th>
                  <th className="p-3">Date & Time</th>
                  <th className="p-3">Purpose</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {pendingRequests.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3 font-semibold text-slate-200">{b.user?.name}</td>
                    <td className="p-3 font-medium text-emerald-400">{b.resource?.name}</td>
                    <td className="p-3 text-slate-400">{b.date} ({b.startTime} - {b.endTime})</td>
                    <td className="p-3 text-slate-300 max-w-xs truncate">{b.purpose}</td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handleApprove(b.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-bold border border-emerald-500/30"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(b.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 text-xs font-bold border border-rose-500/30"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FACULTY UPCOMING SCHEDULE */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800">
        <h3 className="font-bold text-sm text-slate-100 mb-4">My Class & Event Reservations</h3>

        <div className="divide-y divide-slate-800/80">
          {bookings.map((b) => (
            <div key={b.id} className="py-3 flex items-center justify-between gap-4 text-xs">
              <div>
                <div className="font-semibold text-slate-200">{b.resource?.name}</div>
                <div className="text-slate-400 text-[11px]">
                  {b.date} ({b.startTime} - {b.endTime}) • {b.purpose} {b.isRecurring && '(Recurring Class)'}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <EcoBadge score={b.ecoScoreCalculated} />
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  b.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-300'
                }`}>
                  {b.status}
                </span>
                <button
                  onClick={() => setSelectedQRBooking(b)}
                  className="p-1.5 rounded-lg bg-slate-900 text-emerald-400 border border-slate-800"
                >
                  <QrCode className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedQRBooking && (
        <QRModal
          booking={selectedQRBooking}
          onClose={() => setSelectedQRBooking(null)}
          onRefresh={fetchFacultyData}
        />
      )}

    </div>
  );
}
