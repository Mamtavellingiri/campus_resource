import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { MessageSquare, Star, User, Building2 } from 'lucide-react';

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedback = async () => {
      setLoading(true);
      try {
        const res = await api.get('/feedback');
        if (res.data.success) {
          setFeedbacks(res.data.feedbacks);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-amber-400" />
            Resource Feedback & Condition Reviews
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Post-checkout ratings submitted by students and faculty after utilizing campus resources
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {feedbacks.length === 0 ? (
          <div className="glass-panel p-8 rounded-3xl text-center text-xs text-slate-400">
            No feedback entries found yet.
          </div>
        ) : (
          feedbacks.map((f) => (
            <div key={f.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-100">{f.resource?.name}</h4>
                  <p className="text-xs text-slate-400">
                    By <strong className="text-slate-200">{f.user?.name}</strong> ({f.user?.role} - {f.user?.department})
                  </p>
                </div>

                <div className="flex items-center gap-1 text-amber-400 font-bold text-sm">
                  <Star className="w-4 h-4 fill-amber-400" />
                  {f.rating}/5
                </div>
              </div>

              <p className="text-xs text-slate-300 italic bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                "{f.comments || 'No written comments provided.'}"
              </p>

              <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 pt-1">
                <span className="bg-slate-900 px-2.5 py-0.5 rounded-full border border-slate-800">
                  Condition: <strong className="text-emerald-400">{f.resourceCondition}</strong>
                </span>
                <span className="bg-slate-900 px-2.5 py-0.5 rounded-full border border-slate-800">
                  Cleanliness: <strong className="text-emerald-400">{f.cleanliness}</strong>
                </span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
