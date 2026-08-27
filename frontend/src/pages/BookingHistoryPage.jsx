import React, { useState, useEffect } from 'react';
import api from '../services/api';
import QRModal from '../components/QRModal';
import FeedbackModal from '../components/FeedbackModal';
import EcoBadge from '../components/EcoBadge';
import { QrCode, Clock, MapPin, XCircle, CheckCircle2, MessageSquare, AlertCircle } from 'lucide-react';

export default function BookingHistoryPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQRBooking, setSelectedQRBooking] = useState(null);
  const [selectedFeedbackBooking, setSelectedFeedbackBooking] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bookings');
      if (res.data.success) {
        setBookings(res.data.bookings);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await api.patch(`/bookings/${id}/cancel`);
      fetchHistory();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <QrCode className="w-6 h-6 text-emerald-400" />
            My Bookings & Access QR Codes
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track status, view digital QR passes, simulate check-ins, or provide post-use feedback
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading booking records...</div>
      ) : bookings.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center text-xs text-slate-400">
          You have no booking records yet.
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b.id} className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-extrabold text-emerald-400">
                    {b.bookingCode}
                  </span>
                  <EcoBadge score={b.ecoScoreCalculated} />
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    b.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' :
                    b.status === 'CHECKED_IN' ? 'bg-teal-500/20 text-teal-400' :
                    b.status === 'CHECKED_OUT' ? 'bg-slate-800 text-slate-300' :
                    b.status === 'NO_SHOW' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>
                    {b.status}
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-100">
                  {b.resource?.name}
                </h3>

                <p className="text-xs text-slate-400 flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    {b.resource?.building?.name} (Room {b.resource?.roomNumber})
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    {b.date} ({b.startTime} - {b.endTime})
                  </span>
                </p>

                <p className="text-xs text-slate-300 italic">
                  Purpose: "{b.purpose}"
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                
                {(b.status === 'APPROVED' || b.status === 'CHECKED_IN') && (
                  <button
                    onClick={() => setSelectedQRBooking(b)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs hover:from-emerald-400 hover:to-teal-400 transition-all flex items-center gap-1.5 shadow-md"
                  >
                    <QrCode className="w-4 h-4" />
                    View QR & Check-In
                  </button>
                )}

                {b.status === 'CHECKED_OUT' && (
                  <button
                    onClick={() => setSelectedFeedbackBooking(b)}
                    className="px-4 py-2 rounded-xl bg-slate-900 border border-amber-500/30 text-amber-400 hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Leave Feedback
                  </button>
                )}

                {(b.status === 'PENDING' || b.status === 'APPROVED') && (
                  <button
                    onClick={() => handleCancel(b.id)}
                    className="px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold"
                  >
                    Cancel Booking
                  </button>
                )}

              </div>

            </div>
          ))}
        </div>
      )}

      {selectedQRBooking && (
        <QRModal
          booking={selectedQRBooking}
          onClose={() => setSelectedQRBooking(null)}
          onRefresh={fetchHistory}
        />
      )}

      {selectedFeedbackBooking && (
        <FeedbackModal
          booking={selectedFeedbackBooking}
          onClose={() => setSelectedFeedbackBooking(null)}
          onSuccess={fetchHistory}
        />
      )}

    </div>
  );
}
