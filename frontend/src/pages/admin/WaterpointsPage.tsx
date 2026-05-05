import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import type { Waterpoint, WaterpointType, WaterpointStatus } from '../../lib/types';
import { useToast } from '../../components/ui/ToastProvider';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Droplets,
  MapPin,
  Loader2,
  ChevronDown,
} from 'lucide-react';

const statusConfig: Record<WaterpointStatus, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  functional: { label: 'Functional', color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200/60', icon: CheckCircle2 },
  faulty: { label: 'Faulty', color: 'text-red-600', bg: 'bg-red-50 border-red-200/60', icon: AlertTriangle },
  under_repair: { label: 'Under Repair', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200/60', icon: Wrench },
};

const typeLabels: Record<WaterpointType, string> = { borehole: 'Borehole', well: 'Well', tap: 'Public Tap' };

interface FormData {
  name: string;
  type: WaterpointType;
  status: WaterpointStatus;
  latitude: string;
  longitude: string;
  community: string;
  lga: string;
  description: string;
}

const emptyForm: FormData = {
  name: '', type: 'borehole', status: 'functional',
  latitude: '', longitude: '', community: '', lga: '', description: '',
};

export default function WaterpointsPage() {
  const { toast } = useToast();
  const [waterpoints, setWaterpoints] = useState<Waterpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<WaterpointStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<WaterpointType | 'all'>('all');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Waterpoint | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchWaterpoints = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('waterpoints').select('*').order('name');
    if (filterStatus !== 'all') query = query.eq('status', filterStatus);
    if (filterType !== 'all') query = query.eq('type', filterType);
    const { data, error } = await query;
    if (error) {
      toast('error', 'Failed to load water points.');
    } else {
      setWaterpoints((data as Waterpoint[]) || []);
    }
    setLoading(false);
  }, [filterStatus, filterType, toast]);

  useEffect(() => { fetchWaterpoints(); }, [fetchWaterpoints]);

  const filtered = waterpoints.filter((wp) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return wp.name.toLowerCase().includes(q) || wp.community.toLowerCase().includes(q) || wp.lga.toLowerCase().includes(q);
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (wp: Waterpoint) => {
    setEditingId(wp.id);
    setForm({
      name: wp.name, type: wp.type, status: wp.status,
      latitude: String(wp.latitude), longitude: String(wp.longitude),
      community: wp.community, lga: wp.lga, description: wp.description,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast('error', 'Please enter valid coordinates (Latitude: -90 to 90, Longitude: -180 to 180).');
      return;
    }
    if (!form.name.trim() || !form.community.trim() || !form.lga.trim()) {
      toast('error', 'Name, community, and LGA are required.');
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      type: form.type,
      status: form.status,
      latitude: lat,
      longitude: lng,
      community: form.community.trim(),
      lga: form.lga.trim(),
      description: form.description.trim(),
      updated_at: new Date().toISOString(),
    };

    if (editingId) {
      const { error } = await supabase.from('waterpoints').update(payload).eq('id', editingId);
      if (error) {
        toast('error', 'Failed to update water point. Please try again.');
      } else {
        toast('success', `"${payload.name}" updated successfully.`);
      }
    } else {
      const { error } = await supabase.from('waterpoints').insert(payload);
      if (error) {
        toast('error', 'Failed to add water point. Please try again.');
      } else {
        toast('success', `"${payload.name}" added successfully.`);
      }
    }
    setSaving(false);
    setModalOpen(false);
    fetchWaterpoints();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from('waterpoints').delete().eq('id', deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast('error', 'Failed to delete water point. Please try again.');
    } else {
      toast('success', `"${deleteTarget.name}" deleted.`);
    }
    setDeleteTarget(null);
    fetchWaterpoints();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-800 text-2xl text-slate-900 tracking-tight">Water Points</h1>
          <p className="text-sm text-slate-500 mt-1">Manage all water infrastructure assets across Kwara State.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-semibold shadow-sm hover:shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Water Point
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, community, or LGA..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as WaterpointStatus | 'all')}
              className="appearance-none pl-3.5 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            >
              <option value="all">All Status</option>
              <option value="functional">Functional</option>
              <option value="faulty">Faulty</option>
              <option value="under_repair">Under Repair</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as WaterpointType | 'all')}
              className="appearance-none pl-3.5 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            >
              <option value="all">All Types</option>
              <option value="borehole">Borehole</option>
              <option value="well">Well</option>
              <option value="tap">Public Tap</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Droplets className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No water points found matching your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-3">Name</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-3">Type</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-3 hidden md:table-cell">Community</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-3 hidden lg:table-cell">LGA</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-3">Status</th>
                  <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((wp) => {
                  const cfg = statusConfig[wp.status];
                  const StatusIcon = cfg.icon;
                  return (
                    <tr key={wp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <MapPin className="w-4 h-4 text-teal-500 flex-shrink-0" />
                          <span className="text-sm font-medium text-slate-900">{wp.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-600">{typeLabels[wp.type]}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-600 hidden md:table-cell">{wp.community}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-600 hidden lg:table-cell">{wp.lga}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(wp)}
                            className="p-2 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(wp)}
                            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Water Point"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone. Any linked fault reports will lose their water point reference.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="font-heading font-700 text-lg text-slate-900 tracking-tight">
                {editingId ? 'Edit Water Point' : 'Add Water Point'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <Field label="Name" required>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="field-input"
                  placeholder="e.g. Adewole Borehole"
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Type" required>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as WaterpointType })}
                    className="field-input"
                  >
                    <option value="borehole">Borehole</option>
                    <option value="well">Well</option>
                    <option value="tap">Public Tap</option>
                  </select>
                </Field>
                <Field label="Status" required>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as WaterpointStatus })}
                    className="field-input"
                  >
                    <option value="functional">Functional</option>
                    <option value="faulty">Faulty</option>
                    <option value="under_repair">Under Repair</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Latitude" required>
                  <input
                    type="number"
                    step="any"
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                    className="field-input"
                    placeholder="8.4833"
                  />
                </Field>
                <Field label="Longitude" required>
                  <input
                    type="number"
                    step="any"
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                    className="field-input"
                    placeholder="4.5653"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Community" required>
                  <input
                    type="text"
                    value={form.community}
                    onChange={(e) => setForm({ ...form, community: e.target.value })}
                    className="field-input"
                    placeholder="e.g. Adewole"
                  />
                </Field>
                <Field label="LGA" required>
                  <input
                    type="text"
                    value={form.lga}
                    onChange={(e) => setForm({ ...form, lga: e.target.value })}
                    className="field-input"
                    placeholder="e.g. Ilorin West"
                  />
                </Field>
              </div>

              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="field-input min-h-[80px] resize-none"
                  placeholder="Optional description of the water point..."
                />
              </Field>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim() || !form.latitude || !form.longitude}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingId ? 'Save Changes' : 'Add Water Point'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}
