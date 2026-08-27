import React, { useState, useEffect } from 'react';
import api from '../services/api';
import QRModal from '../components/QRModal';
import EcoBadge from '../components/EcoBadge';
import { CheckSquare, Shield, CheckCircle2, XCircle, QrCode, Search, Filter } from 'lucide-react';

export default function AdminBookingMgmtPage() {
  const [bookings, setBookings] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedQRBooking, setSelectedQRBooking] = useState(null);

  const fetchAllBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bookings?view=all');
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
    fetchAllBookings();
  }, []);

  const handleApprove = async (id) => {
    try {
      await api.post(`/bookings/${id}/approve`);
      fetchAllBookings();
    } catch (err) {
      alert('Failed to approve booking');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Enter rejection reason for user notification:');
    if (!reason) return;
    try {
      await api.post(`/bookings/${id}/reject`, { reason });
      fetchAllBookings();
    } catch (err) {
      alert('Failed to reject booking');
    }
  };

  const filtered = filterStatus
    ? bookings.filter(b => b.status === filterStatus)
    : bookings;

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-amber-400" />
            System Booking Clearances & Approvals
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review, approve, or reject student and faculty resource reservation requests
          </p>
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
        >
          <option value="">All Statuses ({bookings.length})</option>
          <option value="PENDING">PENDING Only</option>
          <option value="APPROVED">APPROVED</option>
          <option value="CHECKED_IN">CHECKED_IN</option>
          <option value="NO_SHOW">NO_SHOW</option>
        </select>
      </div>

      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3.5">Booking Code</th>
                <th className="p-3.5">User</th>
                <th className="p-3.5">Resource</th>
                <th className="p-3.5">Date & Slot</th>
                <th className="p-3.5">Eco Score</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-emerald-400">{b.bookingCode}</td>
                  <td className="p-3.5 font-semibold text-slate-200">
                    {b.user?.name}
                    <div className="text-[10px] text-slate-400 font-normal">{b.user?.email} ({b.user?.role})</div>
                  </td>
                  <td className="p-3.5 text-slate-200 font-medium">{b.resource?.name}</td>
                  <td className="p-3.5 text-slate-400">
                    {b.date} ({b.startTime} - {b.endTime})
                  </td>
                  <td className="p-3.5">
                    <EcoBadge score={b.ecoScoreCalculated} />
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      b.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' :
                      b.status === 'CHECKED_IN' ? 'bg-teal-500/20 text-teal-400' :
                      b.status === 'NO_SHOW' ? 'bg-rose-500/20 text-rose-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right space-x-2">
                    {b.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleApprove(b.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-[11px] font-bold border border-emerald-500/30"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(b.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-[11px] font-bold border border-rose-500/30"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {(b.status === 'APPROVED' || b.status === 'CHECKED_IN') && (
                      <button
                        onClick={() => setSelectedQRBooking(b)}
                        className="p-1.5 rounded-lg bg-slate-900 text-emerald-400 border border-slate-800"
                        title="View QR Code"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedQRBooking && (
        <QRModal
          booking={selectedQRBooking}
          onClose={() => setSelectedQRBooking(null)}
          onRefresh={fetchAllBookings}
        />
      )}

    </div>
  );
}
