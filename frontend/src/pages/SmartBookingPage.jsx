import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import RecommendationCard from '../components/RecommendationCard';
import ConflictWarningModal from '../components/ConflictWarningModal';
import EcoBadge from '../components/EcoBadge';
import {
  Sparkles,
  Calendar,
  Clock,
  Users,
  Building2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Filter,
  Check
} from 'lucide-react';

export default function SmartBookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('12:00');
  const [attendeeCount, setAttendeeCount] = useState(30);
  const [purpose, setPurpose] = useState('');
  const [eventType, setEventType] = useState('ACADEMIC');
  const [resourceCategory, setCategory] = useState('');
  const [buildingId, setBuildingId] = useState('');
  const [requestedFacilities, setRequestedFacilities] = useState([]);
  const [selectedResourceId, setSelectedResourceId] = useState(searchParams.get('resourceId') || '');

  const [categories, setCategories] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [resources, setResources] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [conflictInfo, setConflictInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const facilityOptions = [
    'Projector',
    'Air Conditioning',
    'Smartboard',
    'Wi-Fi 6',
    'Workstations (45)',
    'Dolby Sound',
    'Wheelchair Access',
    '4K Video Bar'
  ];

  useEffect(() => {
    // Fetch buildings & categories
    const fetchMeta = async () => {
      try {
        const res = await api.get('/resources/meta/categories');
        if (res.data.success) {
          setBuildings(res.data.buildings);
          setCategories(res.data.types);
        }
        const rRes = await api.get('/resources');
        if (rRes.data.success) {
          setResources(rRes.data.resources);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchMeta();
  }, []);

  const handleFacilityToggle = (fac) => {
    if (requestedFacilities.includes(fac)) {
      setRequestedFacilities(requestedFacilities.filter(f => f !== fac));
    } else {
      setRequestedFacilities([...requestedFacilities, fac]);
    }
  };

  // Trigger AI Recommendation Engine
  const handleGetRecommendations = async () => {
    setLoading(true);
    setConflictInfo(null);
    setErrorMsg(null);
    try {
      const res = await api.post('/bookings/recommend', {
        resourceType: resourceCategory || undefined,
        date,
        startTime,
        endTime,
        attendeeCount: parseInt(attendeeCount, 10),
        requiredFacilities: requestedFacilities,
        preferredBuildingId: buildingId || undefined
      });
      if (res.data.success) {
        setRecommendations(res.data.recommendations);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to generate recommendations.');
    } finally {
      setLoading(false);
    }
  };

  // Confirm booking with Conflict check!
  const handleConfirmBooking = async (resId) => {
    const targetResource = resId || selectedResourceId;

    if (!targetResource) {
      setErrorMsg('Please select a resource to book.');
      return;
    }

    if (!purpose.trim()) {
      setErrorMsg('Please specify the event/booking purpose.');
      return;
    }

    setLoading(true);
    setConflictInfo(null);
    setErrorMsg(null);

    try {
      // 1. Check double booking conflict
      const availRes = await api.post('/bookings/check-availability', {
        resourceId: targetResource,
        date,
        startTime,
        endTime
      });

      if (!availRes.data.isAvailable) {
        setConflictInfo(availRes.data.conflict || { startTime, endTime, purpose: 'Existing booking' });
        setLoading(false);
        return;
      }

      // 2. Submit Booking
      const bookRes = await api.post('/bookings', {
        resourceId: targetResource,
        purpose,
        eventType,
        attendeeCount: parseInt(attendeeCount, 10),
        requestedFacilities,
        date,
        startTime,
        endTime
      });

      if (bookRes.data.success) {
        setBookingSuccess(bookRes.data.booking);
      }
    } catch (err) {
      if (err.response && err.response.status === 409) {
        setConflictInfo(err.response.data.conflict || { startTime, endTime, purpose: 'Double Booking Conflict' });
      } else {
        setErrorMsg(err.response?.data?.message || 'Failed to confirm booking.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/20 via-slate-900 to-slate-900">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-1 uppercase tracking-widest">
          <Sparkles className="w-4 h-4" /> AI-Powered Smart Booking Engine
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
          Smart Resource Booking & Recommendation
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Select requirements below. The AI algorithm will check availability in real time, guard against double-booking, and score eco suitability.
        </p>
      </div>

      {bookingSuccess ? (
        <div className="glass-panel p-8 rounded-3xl border border-emerald-500/50 text-center max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-100">Booking Confirmed!</h2>
          <p className="text-xs text-slate-400">
            Booking Code: <strong className="text-emerald-400 font-mono text-sm">{bookingSuccess.bookingCode}</strong>
          </p>
          <div className="bg-slate-900 p-4 rounded-2xl text-xs space-y-2 text-left border border-slate-800">
            <div><strong className="text-slate-300">Resource:</strong> {bookingSuccess.resource?.name}</div>
            <div><strong className="text-slate-300">Date & Time:</strong> {bookingSuccess.date} ({bookingSuccess.startTime} - {bookingSuccess.endTime})</div>
            <div><strong className="text-slate-300">Status:</strong> <span className="text-emerald-400 font-bold">{bookingSuccess.status}</span></div>
            <div><strong className="text-slate-300">Eco Score Rating:</strong> {bookingSuccess.ecoScoreCalculated}/100</div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/history')}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs"
            >
              View My Bookings & QR
            </button>
            <button
              onClick={() => setBookingSuccess(null)}
              className="py-3 px-4 rounded-xl bg-slate-900 text-slate-300 text-xs font-semibold"
            >
              Book Another
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Requirements Form */}
          <div className="lg:col-span-5 glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="font-bold text-sm text-slate-100 border-b border-slate-800 pb-2">
              1. Enter Booking Parameters
            </h3>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Resource Category</label>
              <select
                value={resourceCategory}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">Any Category (All Types)</option>
                {categories.map(c => (
                  <option key={c.id} value={c.category}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Attendees</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={attendeeCount}
                  onChange={(e) => setAttendeeCount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Purpose / Event Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. CS401 Lab Exam, Guest Symposium..."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Required Facilities</label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {facilityOptions.map(fac => {
                  const selected = requestedFacilities.includes(fac);
                  return (
                    <button
                      type="button"
                      key={fac}
                      onClick={() => handleFacilityToggle(fac)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                        selected
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {selected && '✓ '} {fac}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleGetRecommendations}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg flex items-center justify-center gap-2 mt-4"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? 'Calculating AI Match...' : 'Run AI Smart Recommendation'}
            </button>
          </div>

          {/* Right Column: AI Recommendations List */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                2. AI Recommendation Results ({recommendations.length})
              </h3>
              <span className="text-xs text-slate-400 font-medium">Sorted by Suitability Score</span>
            </div>

            {recommendations.length === 0 ? (
              <div className="glass-panel p-8 rounded-3xl border border-slate-800 text-center text-xs text-slate-400">
                <Sparkles className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-50" />
                Click "Run AI Smart Recommendation" to score and view top candidate resources matching your date and capacity.
              </div>
            ) : (
              <div className="space-y-4">
                {recommendations.map((rec, i) => (
                  <RecommendationCard
                    key={rec.resource.id}
                    recommendation={rec}
                    onSelect={(res) => {
                      setSelectedResourceId(res.id);
                      handleConfirmBooking(res.id);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Double Booking Warning Modal */}
      {conflictInfo && (
        <ConflictWarningModal
          conflictInfo={conflictInfo}
          onClose={() => setConflictInfo(null)}
          onPickAlternative={() => {
            setConflictInfo(null);
            handleGetRecommendations();
          }}
        />
      )}

    </div>
  );
}
