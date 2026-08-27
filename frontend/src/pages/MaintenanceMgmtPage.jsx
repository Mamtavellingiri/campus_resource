import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Wrench, Plus, CheckCircle2, Clock, AlertTriangle, X } from 'lucide-react';

export default function MaintenanceMgmtPage() {
  const [tickets, setTickets] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    resourceId: '',
    issue: '',
    description: '',
    priority: 'HIGH',
    assignedStaff: 'Facilities Engineering Team A'
  });

  const fetchMaintenance = async () => {
    setLoading(true);
    try {
      const [mRes, rRes] = await Promise.all([
        api.get('/maintenance'),
        api.get('/resources')
      ]);
      if (mRes.data.success) setTickets(mRes.data.tickets);
      if (rRes.data.success) setResources(rRes.data.resources);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaintenance();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/maintenance', formData);
      setShowModal(false);
      fetchMaintenance();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create ticket');
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.patch(`/maintenance/${id}`, { status });
      fetchMaintenance();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-rose-400" />
            Resource Maintenance & Repairs
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Report maintenance issues. Locking a resource in MAINTENANCE status disables all booking requests.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({ ...formData, resourceId: resources[0]?.id || '' });
            setShowModal(true);
          }}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 font-bold text-xs hover:from-rose-400 hover:to-amber-400 transition-all shadow-lg flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Report Maintenance Issue
        </button>
      </div>

      {/* Tickets List */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3.5">Resource</th>
                <th className="p-3.5">Issue Title</th>
                <th className="p-3.5">Priority</th>
                <th className="p-3.5">Assigned Staff</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {tickets.map((t) => (
                <tr key={t.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3.5 font-bold text-slate-100">{t.resource?.name}</td>
                  <td className="p-3.5 font-medium text-slate-200">
                    {t.issue}
                    <div className="text-[10px] text-slate-400 font-normal">{t.description}</div>
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      t.priority === 'URGENT' || t.priority === 'HIGH' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-400">{t.assignedStaff || 'Facility Staff'}</td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      t.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    {t.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleStatusUpdate(t.id, 'COMPLETED')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-bold border border-emerald-500/30"
                      >
                        Mark Fixed & Release
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-panel w-full max-w-md rounded-3xl border border-slate-800 p-6 relative shadow-2xl space-y-4">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-900 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-100">Report Maintenance Ticket</h3>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Resource *</label>
                <select
                  value={formData.resourceId}
                  onChange={(e) => setFormData({ ...formData, resourceId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                >
                  {resources.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.building?.name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Issue Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AC Thermostat Sensor Fault, Projector Lamp Bulb"
                  value={formData.issue}
                  onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-200"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 font-bold text-xs"
              >
                Submit Ticket & Lock Resource
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
