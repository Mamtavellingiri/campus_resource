import React from 'react';
import { Leaf } from 'lucide-react';

export default function EcoBadge({ score = 85, showDetails = false, estimatedKwh = null }) {
  const getBadgeStyle = (s) => {
    if (s >= 90) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (s >= 75) return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
    if (s >= 60) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${getBadgeStyle(score)}`}>
        <Leaf className="w-3 h-3" />
        Eco Score: {score}/100
      </span>
      {showDetails && estimatedKwh !== null && (
        <span className="text-[10px] text-slate-400 font-normal">
          (~{estimatedKwh} kWh)
        </span>
      )}
    </div>
  );
}
