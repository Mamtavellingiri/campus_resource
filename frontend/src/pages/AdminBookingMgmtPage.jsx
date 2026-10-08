import React, { useState, useEffect } from 'react';
import api from '../services/api';
import QRModal from '../components/QRModal';
import EcoBadge from '../components/EcoBadge';
import { CheckSquare, QrCode, X } from 'lucide-react';

export default function AdminBookingMgmtPage() {
  const [bookings, setBookings] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedQRBooking, setSelectedQRBooking] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [selectedRejectBooking, setSelectedRejectBooking] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

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
    setActionError(null);
    try {
      const res = await api.post(`/bookings/${id}/approve`);
      if (!res.data.success) throw new Error(res.data.message || 'Failed to approve booking.');
      fetchAllBookings();
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || 'Failed to approve booking.');
    }
  };

  const handleReject = async (event) => {
    event.preventDefault();
    const reason = rejectionReason.trim();
    if (!selectedRejectBooking || !reason) return;

    setIsRejecting(true);
    try {
      await api.post(`/bookings/${selectedRejectBooking.id}/reject`, { reason });
      setSelectedRejectBooking(null);
      setRejectionReason('');
      fetchAllBookings();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to reject booking.');
    } finally {
      setIsRejecting(false);
    }
  };

  const openRejectDialog = (booking) => {
    setActionError(null);
    setRejectionReason('');
    setSelectedRejectBooking(booking);
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

      {actionError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {actionError}
        </div>
      )}

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
                          onClick={() => openRejectDialog(b)}
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

      {selectedRejectBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-booking-title"
            onSubmit={handleReject}
            className="w-full max-w-lg space-y-5 rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="reject-booking-title" className="text-lg font-bold text-slate-100">Reject booking request</h2>
                <p className="mt-1 text-xs text-slate-400">
                  {selectedRejectBooking.resource?.name} for {selectedRejectBooking.user?.name} on {selectedRejectBooking.date}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRejectBooking(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                aria-label="Close rejection dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <label htmlFor="rejection-reason" className="block text-xs font-semibold text-slate-300">
              Rejection reason <span className="text-rose-400">*</span>
            </label>
            <textarea
              id="rejection-reason"
              autoFocus
              required
              minLength={1}
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              placeholder="Explain why this booking cannot be approved"
              rows={4}
              className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 outline-none focus:border-rose-400"
            />

            {actionError && (
              <p role="alert" className="text-xs text-rose-300">{actionError}</p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedRejectBooking(null)}
                className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!rejectionReason.trim() || isRejecting}
                className="rounded-lg border border-rose-500/40 bg-rose-500/15 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isRejecting ? 'Rejecting...' : 'Reject booking'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
