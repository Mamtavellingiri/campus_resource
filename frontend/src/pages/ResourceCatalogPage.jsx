import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import EcoBadge from '../components/EcoBadge';
import { Search, Filter, MapPin, Users, Zap, CheckCircle2, AlertTriangle, ArrowRight, Layers } from 'lucide-react';

export default function ResourceCatalogPage() {
  const [searchParams] = useSearchParams();
  const [resources, setResources] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [capacityFilter, setCapacityFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [slotDate, setSlotDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
  });
  const [slotStartTime, setSlotStartTime] = useState('10:00');
  const [slotEndTime, setSlotEndTime] = useState('12:00');
  const [slotAvailability, setSlotAvailability] = useState({});
  const [slotChecked, setSlotChecked] = useState(false);
  const [checkingSlot, setCheckingSlot] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');

  const fetchResources = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.set('search', search);
      if (selectedBuilding) queryParams.set('buildingId', selectedBuilding);
      if (selectedCategory) queryParams.set('typeCategory', selectedCategory);
      if (statusFilter) queryParams.set('status', statusFilter);
      if (capacityFilter) queryParams.set('minCapacity', capacityFilter);

      const res = await api.get(`/resources?${queryParams.toString()}`);
      if (res.data.success) {
        setResources(res.data.resources);
        setSlotChecked(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const metaRes = await api.get('/resources/meta/categories');
        if (metaRes.data.success) {
          setBuildings(metaRes.data.buildings);
          setCategories(metaRes.data.types);
        }
      } catch (e) {}
    };
    fetchMeta();
    fetchResources();
  }, [search, selectedBuilding, selectedCategory, statusFilter, capacityFilter]);

  const checkSelectedSlot = async () => {
    if (!slotDate || !slotStartTime || !slotEndTime || slotStartTime >= slotEndTime) {
      setAvailabilityError('Choose a date and a valid start and end time.');
      return;
    }

    setCheckingSlot(true);
    setAvailabilityError('');
    try {
      const results = await Promise.all(resources.map(async (resource) => {
        try {
          const response = await api.post('/bookings/check-availability', {
            resourceId: resource.id,
            date: slotDate,
            startTime: slotStartTime,
            endTime: slotEndTime
          });
          return [resource.id, response.data.isAvailable];
        } catch (error) {
          if ([400, 409].includes(error.response?.status)) {
            return [resource.id, false];
          }
          throw error;
        }
      }));
      setSlotAvailability(Object.fromEntries(results));
      setSlotChecked(true);
    } catch (error) {
      setAvailabilityError(error.response?.data?.message || 'Failed to check resource availability.');
    } finally {
      setCheckingSlot(false);
    }
  };

  const allResourcesUnavailable = slotChecked && resources.length > 0 &&
    resources.every((resource) => slotAvailability[resource.id] === false);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <Layers className="w-6 h-6 text-emerald-400" />
            Campus Resources Catalog
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse classrooms, computing labs, auditoriums, meeting rooms, and portable gear
          </p>
        </div>

        <div className="text-xs text-slate-400 font-semibold bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 shrink-0">
          Showing {resources.length} Resources
        </div>
      </div>

      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Check date</label>
          <input
            type="date"
            value={slotDate}
            onChange={(event) => {
              setSlotDate(event.target.value);
              setSlotChecked(false);
            }}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Start time</label>
          <input
            type="time"
            value={slotStartTime}
            onChange={(event) => {
              setSlotStartTime(event.target.value);
              setSlotChecked(false);
            }}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">End time</label>
          <input
            type="time"
            value={slotEndTime}
            onChange={(event) => {
              setSlotEndTime(event.target.value);
              setSlotChecked(false);
            }}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
          />
        </div>
        <button
          type="button"
          onClick={checkSelectedSlot}
          disabled={checkingSlot || resources.length === 0}
          className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold disabled:opacity-50"
        >
          {checkingSlot ? 'Checking...' : 'Check slot availability'}
        </button>
        {availabilityError && <p className="basis-full text-xs text-rose-400">{availabilityError}</p>}
      </div>

      {allResourcesUnavailable && (
        <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 text-xs text-amber-200 flex flex-wrap items-center justify-between gap-3">
          <span>No resources available for this slot.</span>
          <Link
            to={`/booking/smart?${new URLSearchParams({ date: slotDate, startTime: slotStartTime, endTime: slotEndTime })}`}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-amber-500/30 text-amber-200 font-semibold"
          >
            Join a waitlist or pick another time
          </Link>
        </div>
      )}

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search resource name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Building Filter (Location) */}
        <select
          value={selectedBuilding}
          onChange={(e) => setSelectedBuilding(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Buildings</option>
          {buildings.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        {/* Category Filter (Type) */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Types (Classroom, Lab, Hall...)</option>
          {categories.map(c => (
            <option key={c.id} value={c.category}>{c.name}</option>
          ))}
        </select>

        {/* Capacity Filter */}
        <select
          value={capacityFilter}
          onChange={(e) => setCapacityFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
        >
          <option value="">Any Capacity</option>
          <option value="15">15+ Seats</option>
          <option value="30">30+ Seats</option>
          <option value="50">50+ Seats</option>
          <option value="100">100+ Seats</option>
          <option value="200">200+ Seats</option>
        </select>

        {/* Status Filter (Availability) */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Statuses</option>
          <option value="AVAILABLE">AVAILABLE Only</option>
          <option value="MAINTENANCE">UNDER MAINTENANCE</option>
        </select>

      </div>

      {/* Grid List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading resources...</div>
      ) : resources.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center text-xs text-slate-400">
          No resources found matching the selected filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((res) => (
            <div key={res.id} className="glass-panel rounded-3xl border border-slate-800 overflow-hidden hover:border-emerald-500/40 transition-all flex flex-col justify-between group">
              
              {/* Image banner */}
              <div className="h-44 bg-slate-900 relative overflow-hidden">
                <img
                  src={res.images[0] || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80'}
                  alt={res.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3">
                  <EcoBadge score={res.ecoScore} />
                </div>
                <div className="absolute bottom-3 left-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold shadow-md ${
                    res.status === 'AVAILABLE' ? 'bg-emerald-500 text-slate-950' :
                    res.status === 'MAINTENANCE' ? 'bg-rose-500 text-white' :
                    'bg-amber-500 text-slate-950'
                  }`}>
                    {res.status}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 space-y-3">
                <h3 className="font-bold text-base text-slate-100 group-hover:text-emerald-400 transition-colors">
                  {res.name}
                </h3>

                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  {res.building?.name} • Floor {res.floor}, Room {res.roomNumber}
                </p>

                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {res.description}
                </p>

                {/* Facilities Tags */}
                <div className="flex flex-wrap gap-1">
                  {res.facilities.slice(0, 3).map((f, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md text-[10px] bg-slate-900 text-slate-400 border border-slate-800">
                      {f}
                    </span>
                  ))}
                  {res.facilities.length > 3 && (
                    <span className="text-[10px] text-slate-500">+{res.facilities.length - 3} more</span>
                  )}
                </div>
              </div>

              {/* Footer Action */}
              <div className="p-4 bg-slate-900/60 border-t border-slate-800/80 flex items-center justify-between">
                <div className="text-xs text-slate-400 font-medium">
                  Capacity: <strong className="text-slate-200">{res.capacity} seats</strong>
                </div>

                <div className="flex items-center gap-2">
                  {slotChecked && slotAvailability[res.id] === false ? (
                    <span className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px] font-bold">
                      Unavailable for selected slot
                    </span>
                  ) : slotChecked && slotAvailability[res.id] === true ? (
                    <Link
                      to={`/booking/smart?${new URLSearchParams({
                        resourceId: res.id,
                        date: slotDate,
                        startTime: slotStartTime,
                        endTime: slotEndTime
                      })}`}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      Book this slot
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <Link
                      to={`/resources/${res.id}`}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      Details & Schedule
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                  {slotChecked && (
                    <Link to={`/resources/${res.id}`} className="text-[10px] text-slate-500 hover:text-slate-300">
                      Details
                    </Link>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
