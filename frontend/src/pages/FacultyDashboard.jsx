import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import QRModal from '../components/QRModal';
import EcoBadge from '../components/EcoBadge';
import {
  Briefcase,
  Sparkles,
  QrCode
} from 'lucide-react';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQRBooking, setSelectedQRBooking] = useState(null);

  const fetchFacultyData = async () => {
    setLoading(true);
    try {
      // Fetch bookings for faculty and department
      const res = await api.get('/bookings');
      if (res.data.success) {
        const bList = res.data.bookings;
        setBookings(bList.filter(b => b.userId === user.id));
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

      {/* FACULTY RESERVATIONS */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800">
        <h3 className="font-bold text-sm text-slate-100 mb-4">My Class & Event Reservations</h3>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading your reservations...</div>
        ) : bookings.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">You have no class or event reservations yet.</div>
        ) : (
          <div className="divide-y divide-slate-800/80">
          {bookings.map((b) => (
            <div key={b.id} className="py-3 flex items-center justify-between gap-4 text-xs">
              <div>
                <div className="font-semibold text-slate-200">{b.resource?.name}</div>
                <div className="text-slate-400 text-[11px]">
                  {b.date} ({b.startTime} - {b.endTime}) • {b.purpose} {b.isRecurring && '(Recurring Class)'}
                </div>
                {b.subject?.name && <div className="text-slate-500 text-[10px] mt-1">{b.subject.name} • {b.year}</div>}
              </div>

              <div className="flex items-center gap-3">
                <EcoBadge score={b.ecoScoreCalculated} />
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  b.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-300'
                }`}>
                  {b.status}
                </span>
                {['APPROVED', 'CHECKED_IN'].includes(b.status) && (
                  <button
                    onClick={() => setSelectedQRBooking(b)}
                    className="p-1.5 rounded-lg bg-slate-900 text-emerald-400 border border-slate-800"
                    title="View booking QR"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
          </div>
        )}
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
