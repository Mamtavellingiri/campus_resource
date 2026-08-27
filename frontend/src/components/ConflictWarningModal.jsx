import React from 'react';
import { AlertTriangle, Clock, ArrowRight, X } from 'lucide-react';

export default function ConflictWarningModal({ conflictInfo, onClose, onPickAlternative }) {
  if (!conflictInfo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-lg rounded-3xl border border-rose-500/30 p-6 relative shadow-2xl">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-900 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 text-rose-400 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-100">Booking Time Slot Conflict</h3>
            <p className="text-xs text-rose-400 font-medium">Resource is already occupied for this time range.</p>
          </div>
        </div>

        {/* Conflict Notice Box */}
        <div className="bg-rose-500/10 rounded-2xl p-4 border border-rose-500/20 text-xs mb-6">
          <div className="font-semibold text-rose-300 text-sm mb-1">
            "Resource already booked from {conflictInfo.startTime || '2:00 PM'} to {conflictInfo.endTime || '4:00 PM'}."
          </div>
          <div className="text-slate-400 text-xs">
            Event Purpose: <strong className="text-slate-200">{conflictInfo.purpose || 'Existing Academic Session'}</strong>
          </div>
        </div>

        <p className="text-xs text-slate-300 mb-4">
          Double-booking is strictly prohibited by system rules to prevent room overlapping. Please select an alternative time or explore our AI Smart Recommendations for available rooms.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onPickAlternative}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg flex items-center justify-center gap-2"
          >
            Find AI Recommended Alternatives
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="py-3 px-4 rounded-xl bg-slate-900 text-slate-300 hover:bg-slate-800 text-xs font-semibold"
          >
            Change Time Slot
          </button>
        </div>

      </div>
    </div>
  );
}
