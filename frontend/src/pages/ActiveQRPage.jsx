import React, { useEffect, useState } from 'react';
import { Clock, MapPin, QrCode } from 'lucide-react';
import api from '../services/api';
import QRModal from '../components/QRModal';
import { useAuth } from '../context/AuthContext';

const getToday = () => {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${today.getFullYear()}-${month}-${day}`;
};

export default function ActiveQRPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/bookings');
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to load active QR passes.');
      }
      const today = getToday();
      const activeBookings = response.data.bookings.filter((booking) =>
        booking.userId === user?.id &&
        ['APPROVED', 'CHECKED_IN'].includes(booking.status) &&
        booking.date >= today &&
        Boolean(booking.qrCodeData)
      );
      setBookings(activeBookings);
      setSelectedBooking((current) => current
        ? activeBookings.find((booking) => booking.id === current.id) || null
        : null);
    } catch (fetchError) {
      setError(fetchError.response?.data?.message || fetchError.message || 'Failed to load active QR passes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user?.id]);

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-3xl border border-slate-800">
        <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
          <QrCode className="w-6 h-6 text-emerald-400" />
          Active QR Passes
        </h1>
        <p className="text-xs text-slate-400 mt-1">Approved bookings for today and future dates.</p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading active QR passes...</div>
      ) : error ? (
        <div className="glass-panel p-8 rounded-3xl border border-rose-500/30 text-center text-xs text-rose-400">
          {error}
        </div>
      ) : bookings.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center text-xs text-slate-400">
          No active QR passes yet. Your QR appears here once the admin approves a booking.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {bookings.map((booking) => (
            <article key={booking.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold text-base text-slate-100">{booking.resource?.name}</h2>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    {booking.resource?.building?.name} · Room {booking.resource?.roomNumber}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-bold">
                  {booking.status}
                </span>
              </div>

              <p className="text-xs text-slate-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                {booking.date} ({booking.startTime} - {booking.endTime})
              </p>
              <p className="font-mono text-xs text-emerald-400">{booking.bookingCode}</p>

              <button
                type="button"
                onClick={() => setSelectedBooking(booking)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs flex items-center gap-2"
              >
                <QrCode className="w-4 h-4" />
                Show QR
              </button>
            </article>
          ))}
        </div>
      )}

      {selectedBooking &&
        ['APPROVED', 'CHECKED_IN', 'CHECKED_OUT'].includes(selectedBooking.status) &&
        selectedBooking.qrCodeData && (
          <QRModal
            booking={selectedBooking}
            onClose={() => setSelectedBooking(null)}
            onRefresh={fetchBookings}
          />
        )}
    </div>
  );
}
