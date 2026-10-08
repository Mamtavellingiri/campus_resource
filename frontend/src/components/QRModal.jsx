import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../services/api';
import { X, QrCode, CheckCircle2, Clock, MapPin, AlertCircle, RefreshCw } from 'lucide-react';

export default function QRModal({ booking, onClose, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  if (!booking) return null;

  const qrValue = booking.qrCodeData || JSON.stringify({
    bookingCode: booking.bookingCode,
    userId: booking.userId,
    resourceId: booking.resourceId,
    date: booking.date
  });

  const handleSimulateCheckIn = async () => {
    setLoading(true);
    setMsg(null);
    setErr(null);
    try {
      const res = await api.post('/checkin/scan', {
        bookingId: booking.id,
        qrPayload: qrValue
      });
      if (res.data.success) {
        setMsg(res.data.message);
        if (onRefresh) onRefresh();
      }
    } catch (e) {
      setErr(e.response?.data?.message || 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateCheckOut = async () => {
    setLoading(true);
    setMsg(null);
    setErr(null);
    try {
      const res = await api.post('/checkin/checkout', {
        bookingId: booking.id
      });
      if (res.data.success) {
        setMsg(res.data.message);
        if (onRefresh) onRefresh();
      }
    } catch (e) {
      setErr(e.response?.data?.message || 'Check-out failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-md rounded-3xl border border-slate-800 p-6 relative shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <QrCode className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-100">Booking Pass & QR Code</h3>
          <p className="text-xs text-slate-400 mt-1">
            Booking ID: <strong className="text-emerald-400 font-mono">{booking.bookingCode}</strong>
          </p>
        </div>

        {/* QR Display Card */}
        <div className="bg-white p-5 rounded-2xl flex flex-col items-center justify-center shadow-xl border-4 border-emerald-500/30 mb-6">
          <QRCodeSVG value={qrValue} size={180} level="H" includeMargin={true} />
          <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mt-2">
            Scan for Access & Check-In
          </span>
        </div>

        {/* Booking Details Summary */}
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-2 mb-6 text-xs">
          <div className="flex justify-between items-center text-slate-300">
            <span className="text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Resource:
            </span>
            <span className="font-semibold text-slate-100 truncate max-w-[200px]">
              {booking.resource?.name || 'Campus Resource'}
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-300">
            <span className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-400" /> Time Slot:
            </span>
            <span className="font-semibold text-slate-100">
              {booking.date} ({booking.startTime} - {booking.endTime})
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-300">
            <span className="text-slate-400">Current Status:</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
              booking.status === 'CHECKED_IN' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
              booking.status === 'CHECKED_OUT' ? 'bg-slate-800 text-slate-300' :
              booking.status === 'NO_SHOW' ? 'bg-rose-500/20 text-rose-400' :
              'bg-amber-500/20 text-amber-400'
            }`}>
              {booking.status}
            </span>
          </div>
        </div>

        {/* Feedback Message */}
        {msg && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{msg}</span>
          </div>
        )}

        {err && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{err}</span>
          </div>
        )}

        {/* Interactive Action Buttons */}
        <div className="space-y-2">
          {booking.status === 'APPROVED' && (
            <button
              onClick={handleSimulateCheckIn}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Simulate QR Check-In Scanner
            </button>
          )}

          {booking.status === 'CHECKED_IN' && (
            <button
              onClick={handleSimulateCheckOut}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
              Check-Out of Resource
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-900 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition-colors"
          >
            Close Modal
          </button>
        </div>

      </div>
    </div>
  );
}
