import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import api from '../services/api';
import QRModal from '../components/QRModal';
import { Calendar as CalendarIcon, Filter, Layers, Clock, MapPin, QrCode } from 'lucide-react';

export default function BookingCalendarPage() {
  const [events, setEvents] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCalendarEvents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bookings?view=all');
      if (res.data.success) {
        let bList = res.data.bookings;

        if (selectedBuilding) {
          bList = bList.filter(b => b.resource?.buildingId === selectedBuilding);
        }
        if (selectedCategory) {
          bList = bList.filter(b => b.resource?.type?.category === selectedCategory);
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

        setEvents(formattedEvents);
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
    fetchCalendarEvents();
  }, [selectedBuilding, selectedCategory]);

  const handleEventClick = (info) => {
    if (info.event.extendedProps?.booking) {
      setSelectedBooking(info.event.extendedProps.booking);
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
      {selectedBooking && (
        <QRModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onRefresh={fetchCalendarEvents}
        />
      )}

    </div>
  );
}
