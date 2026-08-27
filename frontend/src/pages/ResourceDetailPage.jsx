import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import EcoBadge from '../components/EcoBadge';
import { MapPin, Users, Zap, Clock, Sparkles, CheckCircle2, ShieldCheck, ArrowLeft, Star } from 'lucide-react';

export default function ResourceDetailPage() {
  const { id } = useParams();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/resources/${id}`);
        if (res.data.success) {
          setResource(res.data.resource);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (loading) return <div className="p-12 text-center text-xs text-slate-400">Loading resource details...</div>;
  if (!resource) return <div className="p-12 text-center text-xs text-rose-400">Resource not found.</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      <Link to="/resources" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Catalog
      </Link>

      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
        
        {/* Banner image */}
        <div className="h-64 sm:h-80 bg-slate-900 relative">
          <img
            src={resource.images[0] || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80'}
            alt={resource.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 right-4">
            <EcoBadge score={resource.ecoScore} />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                {resource.type?.name}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 mt-1">
                {resource.name}
              </h1>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                {resource.building?.name} • Floor {resource.floor}, Room Number {resource.roomNumber}
              </p>
            </div>

            <Link
              to={`/booking/smart?resourceId=${resource.id}`}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg flex items-center gap-2 shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              Book This Resource
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Seating Capacity</span>
              <div className="font-bold text-slate-100 text-sm mt-0.5">{resource.capacity} Seats</div>
            </div>

            <div>
              <span className="text-slate-400 font-medium">Power Rating</span>
              <div className="font-bold text-slate-100 text-sm mt-0.5">{resource.basePowerConsumptionKw} kW/h</div>
            </div>

            <div>
              <span className="text-slate-400 font-medium">Operating Hours</span>
              <div className="font-bold text-slate-100 text-sm mt-0.5">{resource.operatingHoursStart} - {resource.operatingHoursEnd}</div>
            </div>

            <div>
              <span className="text-slate-400 font-medium">Building Efficiency</span>
              <div className="font-bold text-emerald-400 text-sm mt-0.5">{resource.energyEfficiencyRating}% Rating</div>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-sm text-slate-100 mb-2">Resource Description</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{resource.description}</p>
          </div>

          {/* Facilities list */}
          <div>
            <h3 className="font-bold text-sm text-slate-100 mb-2">Available Room Facilities & AV</h3>
            <div className="flex flex-wrap gap-2">
              {resource.facilities.map((fac, i) => (
                <span key={i} className="px-3 py-1 rounded-xl bg-slate-900 text-slate-200 border border-slate-800 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  {fac}
                </span>
              ))}
            </div>
          </div>

          {/* Feedback & Reviews */}
          {resource.feedbacks && resource.feedbacks.length > 0 && (
            <div className="border-t border-slate-800 pt-6">
              <h3 className="font-bold text-sm text-slate-100 mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                User Reviews & Ratings ({resource.feedbacks.length})
              </h3>
              <div className="space-y-3">
                {resource.feedbacks.map((f) => (
                  <div key={f.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-200">{f.user?.name} ({f.user?.role})</span>
                      <span className="text-amber-400 font-bold">★ {f.rating}/5</span>
                    </div>
                    <p className="text-slate-300 italic">"{f.comments}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
