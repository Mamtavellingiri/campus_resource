import React, { useState } from 'react';
import api from '../services/api';
import { Calendar, Clock, AlertTriangle, CheckCircle2, X, ArrowRight, RefreshCw } from 'lucide-react';

export default function RescheduleModal({ booking, onClose, onSuccess }) {
  if (!booking) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(booking.date || todayStr);
  const [startTime, setStartTime] = useState(booking.startTime || '10:00');
  const [endTime, setEndTime] = useState(booking.endTime || '11:00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conflict, setConflict] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleReschedule = async (e) => {
    e.preventDefault();
    setError(null);
    setConflict(null);
    setSuccessMsg(null);

    // Frontend validation
    if (startTime >= endTime) {
      setError('End time must be strictly after start time.');
      return;
    }

    if (date < todayStr) {
      setError('Cannot reschedule to a date in the past.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.patch(`/bookings/${booking.id}/reschedule`, {
        date,
        startTime,
        endTime
      });

      if (res.data.success) {
        setSuccessMsg(res.data.message || 'Booking rescheduled successfully!');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      }
    } catch (err) {
      if (err.response && err.response.status === 409) {
        setConflict(err.response.data.conflict || {
          startTime,
          endTime,
          date
        });
        setError(err.response.data.message || 'Time slot conflict detected.');
      } else {
        setError(err.response?.data?.message || 'Failed to reschedule booking.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-lg rounded-3xl border border-slate-700 p-6 relative shadow-2xl space-y-4">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-900 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-100">Reschedule Booking</h3>
            <p className="text-xs text-slate-400">
              Update reservation slot for <strong className="text-slate-200">{booking.resource?.name}</strong>
            </p>
          </div>
        </div>

        {/* Current Booking Info Banner */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span>Booking Code: <strong className="text-emerald-400 font-mono">{booking.bookingCode}</strong></span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
              {booking.status}
            </span>
          </div>
          <div className="text-slate-300 font-medium">
            Currently scheduled: <span className="text-amber-400">{booking.date}</span> from <span className="text-amber-400">{booking.startTime} - {booking.endTime}</span>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">{error}</div>
              {conflict && (
                <div className="text-[11px] text-rose-300/80 mt-1">
                  Conflicting slot: {conflict.startTime} - {conflict.endTime} on {conflict.date || date}
                </div>
              )}
            </div>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleReschedule} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" /> New Date
            </label>
            <input
              type="date"
              required
              min={todayStr}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" /> New Start Time
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" /> New End Time
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Note: The system checks for scheduling conflicts in real time using strict overlap rules. Rescheduled student bookings return to pending status for administrator clearance.
          </p>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-900 text-slate-300 hover:bg-slate-800 text-xs font-semibold border border-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs hover:from-emerald-400 hover:to-teal-400 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              {loading ? 'Validating...' : 'Confirm Reschedule'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
