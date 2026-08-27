import React from 'react';
import EcoBadge from './EcoBadge';
import { Sparkles, Users, MapPin, CheckCircle2, ArrowRight, Zap, ShieldCheck } from 'lucide-react';

export default function RecommendationCard({ recommendation, onSelect }) {
  const { resource, suitabilityScore, ecoScore, estimatedEnergyKwh, reasons } = recommendation;

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 hover:border-emerald-500/30 transition-all shadow-sm relative overflow-hidden group">
      
      {/* Recommended Tag */}
      <div className="absolute top-0 right-0 bg-emerald-500/10 text-emerald-400 border-l border-b border-emerald-500/20 px-3 py-0.5 rounded-bl-xl font-semibold text-[10px] flex items-center gap-1">
        <Sparkles className="w-3 h-3 text-emerald-400" />
        {suitabilityScore}% MATCH
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
        <div>
          <h3 className="text-base font-bold text-slate-100 group-hover:text-emerald-400 transition-colors flex items-center gap-2">
            {resource.name}
          </h3>
          <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            {resource.building?.name || 'Main Campus'} • Floor {resource.floor}, Room {resource.roomNumber}
          </p>
        </div>
      </div>

      {/* Badges & Metrics Row */}
      <div className="flex flex-wrap items-center gap-2 mb-3.5">
        <EcoBadge score={ecoScore} showDetails={true} estimatedKwh={estimatedEnergyKwh} />
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-900 text-slate-300 border border-slate-800">
          <Users className="w-3 h-3 text-slate-400" />
          Cap: {resource.capacity} seats
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-900 text-slate-300 border border-slate-800">
          <Zap className="w-3 h-3 text-amber-400" />
          {resource.basePowerConsumptionKw} kW/h
        </span>
      </div>

      {/* WHY RECOMMENDED BULLETS */}
      <div className="bg-slate-900/70 rounded-xl p-3 border border-slate-800/80 mb-4">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 mb-1 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          Recommendation Rationale:
        </div>
        <ul className="space-y-1 text-xs text-slate-300">
          {reasons && reasons.map((reason, idx) => (
            <li key={idx} className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Action Button */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-slate-400 font-normal">
          Hours: {resource.operatingHoursStart} - {resource.operatingHoursEnd}
        </span>
        <button
          onClick={() => onSelect(resource)}
          className="subtle-button-primary flex items-center gap-1.5"
        >
          Book Resource
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
