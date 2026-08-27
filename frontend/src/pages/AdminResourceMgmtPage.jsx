import React, { useState, useEffect } from 'react';
import api from '../services/api';
import EcoBadge from '../components/EcoBadge';
import { Layers, Plus, Edit, Trash2, Shield, AlertTriangle, CheckCircle, Wrench, X } from 'lucide-react';

export default function AdminResourceMgmtPage() {
  const [resources, setResources] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRes, setEditingRes] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    typeId: '',
    buildingId: '',
    floor: 1,
    roomNumber: '',
    capacity: 30,
    description: '',
    operatingHoursStart: '08:00',
    operatingHoursEnd: '20:00',
    energyEfficiencyRating: 90,
    ecoScore: 90,
    basePowerConsumptionKw: 2.0
  });

  const fetchAdminResources = async () => {
    setLoading(true);
    try {
      const [rRes, metaRes] = await Promise.all([
        api.get('/resources'),
        api.get('/resources/meta/categories')
      ]);
      if (rRes.data.success) setResources(rRes.data.resources);
      if (metaRes.data.success) {
        setBuildings(metaRes.data.buildings);
        setCategories(metaRes.data.types);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminResources();
  }, []);

  const handleOpenAdd = () => {
    setEditingRes(null);
    setFormData({
      name: '',
      typeId: categories[0]?.id || '',
      buildingId: buildings[0]?.id || '',
      floor: 1,
      roomNumber: '',
      capacity: 30,
      description: '',
      operatingHoursStart: '08:00',
      operatingHoursEnd: '20:00',
      energyEfficiencyRating: 90,
      ecoScore: 90,
      basePowerConsumptionKw: 2.0
    });
    setShowModal(true);
  };

  const handleOpenEdit = (resItem) => {
    setEditingRes(resItem);
    setFormData({
      name: resItem.name,
      typeId: resItem.typeId,
      buildingId: resItem.buildingId,
      floor: resItem.floor,
      roomNumber: resItem.roomNumber,
      capacity: resItem.capacity,
      description: resItem.description || '',
      operatingHoursStart: resItem.operatingHoursStart,
      operatingHoursEnd: resItem.operatingHoursEnd,
      energyEfficiencyRating: resItem.energyEfficiencyRating,
      ecoScore: resItem.ecoScore,
      basePowerConsumptionKw: resItem.basePowerConsumptionKw
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingRes) {
        await api.put(`/resources/${editingRes.id}`, formData);
      } else {
        await api.post('/resources', formData);
      }
      setShowModal(false);
      fetchAdminResources();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save resource');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this resource permanently?')) return;
    try {
      await api.delete(`/resources/${id}`);
      fetchAdminResources();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'AVAILABLE' ? 'MAINTENANCE' : 'AVAILABLE';
    try {
      await api.patch(`/resources/${id}/status`, { status: nextStatus });
      fetchAdminResources();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <Layers className="w-6 h-6 text-emerald-400" />
            Admin Resource Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Create, modify capacity, toggle maintenance locks, or update energy specs
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add New Resource
        </button>
      </div>

      {/* Resource Table */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3.5">Resource Name</th>
                <th className="p-3.5">Building & Room</th>
                <th className="p-3.5">Capacity</th>
                <th className="p-3.5">Eco Score / Power</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {resources.map((r) => (
                <tr key={r.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3.5 font-bold text-slate-100">{r.name}</td>
                  <td className="p-3.5 text-slate-400">
                    {r.building?.name} (R-{r.roomNumber})
                  </td>
                  <td className="p-3.5 font-semibold text-slate-200">{r.capacity} seats</td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-2">
                      <EcoBadge score={r.ecoScore} />
                      <span className="text-[11px] text-slate-400 font-mono">{r.basePowerConsumptionKw} kW</span>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <button
                      onClick={() => handleStatusToggle(r.id, r.status)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                        r.status === 'AVAILABLE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        r.status === 'MAINTENANCE' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {r.status}
                    </button>
                  </td>
                  <td className="p-3.5 text-right space-x-2">
                    <button
                      onClick={() => handleOpenEdit(r)}
                      className="p-1.5 rounded-lg bg-slate-900 text-slate-300 hover:text-white border border-slate-800"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Resource Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-panel w-full max-w-lg rounded-3xl border border-slate-800 p-6 relative shadow-2xl space-y-4">
            
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-900 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-100">
              {editingRes ? 'Edit Resource Specifications' : 'Add New Campus Resource'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Resource Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Building *</label>
                  <select
                    value={formData.buildingId}
                    onChange={(e) => setFormData({ ...formData, buildingId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  >
                    {buildings.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Resource Type *</label>
                  <select
                    value={formData.typeId}
                    onChange={(e) => setFormData({ ...formData, typeId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Room No.</label>
                  <input
                    type="text"
                    required
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Capacity</label>
                  <input
                    type="number"
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Power (kW/h)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.basePowerConsumptionKw}
                    onChange={(e) => setFormData({ ...formData, basePowerConsumptionKw: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs"
              >
                Save Resource Changes
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
