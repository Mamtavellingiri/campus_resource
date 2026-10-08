import React, { useState } from 'react';
import api from '../services/api';
import { Star, MessageSquare, X, CheckCircle } from 'lucide-react';

export default function FeedbackModal({ booking, onClose, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [resourceCondition, setCondition] = useState('EXCELLENT');
  const [cleanliness, setCleanliness] = useState('EXCELLENT');
  const [loading, setLoading] = useState(false);

  if (!booking) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/feedback', {
        bookingId: booking.id,
        rating,
        comments,
        resourceCondition,
        cleanliness,
        equipmentQuality: resourceCondition
      });
      if (res.data.success) {
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-md rounded-3xl border border-slate-800 p-6 relative shadow-2xl">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-900 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-3">
            <Star className="w-6 h-6 fill-amber-400" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-100">Rate Resource Experience</h3>
          <p className="text-xs text-slate-400 mt-1">
            {booking.resource?.name || 'Campus Resource'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Star Rating Selector */}
          <div className="flex items-center justify-center gap-2 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onClick={() => setRating(star)}
                className="p-1 text-amber-400 transition-transform hover:scale-125 focus:outline-none"
              >
                <Star className={`w-7 h-7 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`} />
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Resource Condition</label>
            <select
              value={resourceCondition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="EXCELLENT">Excellent - Everything Working Perfectly</option>
              <option value="GOOD">Good - Minor Signs of Use</option>
              <option value="FAIR">Fair - Require Minor Maintenance</option>
              <option value="POOR">Poor - Equipment Malfunction Reported</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Cleanliness</label>
            <select
              value={cleanliness}
              onChange={(e) => setCleanliness(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="EXCELLENT">Spotless & Tidy</option>
              <option value="GOOD">Acceptable</option>
              <option value="POOR">Needs Cleaning Service</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Feedback Comments</label>
            <textarea
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Provide comments regarding AV quality, AC temperature, cleanliness, or room acoustics..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>

      </div>
    </div>
  );
}
