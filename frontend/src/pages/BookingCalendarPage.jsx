import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import api from '../services/api';
import QRModal from '../components/QRModal';
import { useAuth } from '../context/AuthContext';
import { Calendar as CalendarIcon, Filter, Layers, Clock, MapPin, QrCode } from 'lucide-react';

export default function BookingCalendarPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [resources, setResources] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedResource, setSelectedResource] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCalendarEvents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bookings?view=all');

      // Faculty also get anonymous "Busy" blocks for other faculty's bookings
      let busyEvents = [];
      if (user?.role === 'FACULTY') {
        try {
          const busyRes = await api.get('/bookings/busy-slots');
          const resourceById = Object.fromEntries(resources.map(r => [r.id, r]));
          busyEvents = (busyRes.data.slots || [])
            .filter(slot => !slot.isMine)
            .filter(slot => {
              const r = resourceById[slot.resourceId];
              if (selectedResource && slot.resourceId !== selectedResource) return false;
              if (selectedBuilding && r?.buildingId !== selectedBuilding) return false;
              if (selectedCategory && r?.type?.category !== selectedCategory) return false;
              return true;
            })
            .map((slot, index) => ({
              id: `busy-${index}-${slot.resourceId}-${slot.date}-${slot.startTime}`,
              title: `${resourceById[slot.resourceId]?.name || 'Room'} - Busy`,
              start: `${slot.date}T${slot.startTime}:00`,
              end: `${slot.date}T${slot.endTime}:00`,
              backgroundColor: '#64748b',
              borderColor: '#64748b',
              extendedProps: { busy: true }
            }));
        } catch (busyErr) {
          console.error(busyErr);
        }
      }

      if (res.data.success) {
        let bList = res.data.bookings;
        if (user?.role === 'STUDENT') {
          bList = bList.filter((booking) => booking.status === 'APPROVED');
        }

        if (selectedBuilding) {
          bList = bList.filter(b => b.resource?.buildingId === selectedBuilding);
        }
        if (selectedCategory) {
          bList = bList.filter(b => b.resource?.type?.category === selectedCategory);
        }
        if (selectedResource) {
          bList = bList.filter(b => b.resourceId === selectedResource);
        }

        const formattedEvents = bList.map(b => {
          let color = '#22c55e'; // APPROVED (green)
          if (b.status === 'CHECKED_IN') color = '#14b8a6'; // teal
          if (b.status === 'PENDING') color = '#f59e0b'; // amber
          if (b.status === 'NO_SHOW' || b.status === 'REJECTED') color = '#ef4444'; // rose

          return {
            id: b.id,
            title: `${b.resource?.name} - ${b.purpose}`,
            start: `${b.date}T${b.startTime}:00`,
            end: `${b.date}T${b.endTime}:00`,
            backgroundColor: color,
            borderColor: color,
            extendedProps: { booking: b }
          };
        });

        setEvents([...formattedEvents, ...busyEvents]);
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
        const [metaRes, resRes] = await Promise.all([
          api.get('/resources/meta/categories'),
          api.get('/resources')
        ]);
        if (metaRes.data.success) {
          setBuildings(metaRes.data.buildings);
          setCategories(metaRes.data.types);
        }
        if (resRes.data.success) {
          setResources(resRes.data.resources);
        }
      } catch (e) {}
    };
    fetchMeta();
    fetchCalendarEvents();
  }, [selectedBuilding, selectedCategory, selectedResource, user?.role, resources.length]);

  const handleEventClick = (info) => {
    if (info.event.extendedProps?.busy) return; // anonymous busy block: nothing to open
    const booking = info.event.extendedProps?.booking;
    if (
      user?.role !== 'STUDENT' &&
      booking &&
      ['APPROVED', 'CHECKED_IN', 'CHECKED_OUT'].includes(booking.status) &&
      booking.qrCodeData
    ) {
      setSelectedBooking(booking);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-emerald-400" />
            Campus Master Booking Calendar
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time visual schedule across all campus facilities & resources
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-semibold">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"/> Approved</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-teal-400"/> Checked-In</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400"/> Pending</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"/> No-Show</span>
          {user?.role === 'FACULTY' && (
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-500"/> Busy (other faculty)</span>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
          <Filter className="w-4 h-4 text-emerald-400" /> Filter Calendar:
        </div>

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

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Resource Categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.category}>{c.name}</option>
          ))}
        </select>

        {/* Per-Resource Filter */}
        <select
          value={selectedResource}
          onChange={(e) => setSelectedResource(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Resources (Campus Schedule)</option>
          {resources.map(r => (
            <option key={r.id} value={r.id}>{r.name} ({r.building?.name || 'Room ' + r.roomNumber})</option>
          ))}
        </select>
      </div>

      {/* FullCalendar Container */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 text-slate-100 font-sans">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          events={events}
          eventClick={handleEventClick}
          height="auto"
          aspectRatio={1.8}
        />
      </div>

      {/* Booking Details Modal */}
      {selectedBooking &&
        ['APPROVED', 'CHECKED_IN', 'CHECKED_OUT'].includes(selectedBooking.status) &&
        selectedBooking.qrCodeData && (
        <QRModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onRefresh={fetchCalendarEvents}
        />
      )}

    </div>
  );
}