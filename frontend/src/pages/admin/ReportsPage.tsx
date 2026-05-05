import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/ToastProvider';
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  X,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
  Loader2,
  MapPin,
  Phone,
  User,
  Camera,
  Navigation,
} from 'lucide-react';

type ReportStatus = 'pending' | 'verified' | 'dismissed' | 'resolved';

interface FaultReport {
  id: string;
  waterpoint_id: string | null;
  reporter_name: string;
  reporter_phone: string;
  description: string;
  photo_url: string;
  latitude: number | null;
  longitude: number | null;
  community: string;
  status: ReportStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  waterpoints?: { name: string } | null;
}

const statusConfig: Record<ReportStatus, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200/60', icon: Clock },
  verified: { label: 'Verified', color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200/60', icon: CheckCircle2 },
  dismissed: { label: 'Dismissed', color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200/60', icon: XCircle },
  resolved: { label: 'Resolved', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200/60', icon: CheckCircle },
};

export default function ReportsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<FaultReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<ReportStatus | 'all'>('all');

  // Detail modal
  const [selectedReport, setSelectedReport] = useState<FaultReport | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('fault_reports')
      .select('*, waterpoints(name)')
      .order('created_at', { ascending: false });
    if (filterStatus !== 'all') query = query.eq('status', filterStatus);
    const { data } = await query;
    setReports((data as FaultReport[]) || []);
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const filtered = reports.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.reporter_name.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.community.toLowerCase().includes(q)
    );
  });

  const updateStatus = async (reportId: string, newStatus: ReportStatus) => {
    setUpdating(true);
    const { error } = await supabase
      .from('fault_reports')
      .update({
        status: newStatus,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', reportId);
    setUpdating(false);
    if (error) {
      toast('error', 'Failed to update report status. Please try again.');
    } else {
      const labels: Record<ReportStatus, string> = { pending: 'reopened', verified: 'verified', dismissed: 'dismissed', resolved: 'marked as resolved' };
      toast('success', `Report ${labels[newStatus]} successfully.`);
    }
    setSelectedReport(null);
    fetchReports();
  };

  const openGoogleMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading font-800 text-2xl text-slate-900 tracking-tight">Fault Reports</h1>
        <p className="text-sm text-slate-500 mt-1">Review and manage citizen-submitted fault reports.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by reporter, description, or community..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
          />
        </div>
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ReportStatus | 'all')}
            className="appearance-none pl-3.5 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="dismissed">Dismissed</option>
            <option value="resolved">Resolved</option>
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 text-center py-16">
          <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No fault reports found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((report) => {
            const cfg = statusConfig[report.status];
            const StatusIcon = cfg.icon;
            return (
              <div
                key={report.id}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedReport(report)}
              >
                <div className="flex items-start gap-4">
                  {/* Status indicator */}
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                    <StatusIcon className={`w-5 h-5 ${cfg.color}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {report.waterpoints?.name || 'General Report'}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Reported by <span className="font-medium text-slate-700">{report.reporter_name}</span>
                          {report.community && <> in {report.community}</>}
                        </p>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-2 line-clamp-2">{report.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(report.created_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {report.reporter_phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {report.reporter_phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedReport(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="font-heading font-700 text-lg text-slate-900 tracking-tight">Report Details</h2>
              <button onClick={() => setSelectedReport(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Status */}
              {(() => {
                const cfg = statusConfig[selectedReport.status];
                const StatusIcon = cfg.icon;
                return (
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {cfg.label}
                    </span>
                  </div>
                );
              })()}

              {/* Waterpoint */}
              {selectedReport.waterpoints?.name && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Linked Water Point</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-teal-500" />
                    <span className="text-sm font-medium text-slate-900">{selectedReport.waterpoints.name}</span>
                  </div>
                </div>
              )}

              {/* Reporter info */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Reporter Information</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <User className="w-4 h-4 text-slate-400" />
                    {selectedReport.reporter_name}
                  </div>
                  {selectedReport.reporter_phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <Phone className="w-4 h-4 text-slate-400" />
                      {selectedReport.reporter_phone}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Description</p>
                <p className="text-sm text-slate-700 leading-relaxed">{selectedReport.description}</p>
              </div>

              {/* Photo */}
              {selectedReport.photo_url ? (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Photo Evidence</p>
                  <div className="rounded-xl overflow-hidden border border-slate-200/60">
                    <img
                      src={selectedReport.photo_url}
                      alt="Fault evidence"
                      className="w-full aspect-video object-cover"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Photo Evidence</p>
                  <div className="rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center aspect-video">
                    <div className="text-center">
                      <Camera className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                      <p className="text-xs text-slate-400">No photo provided</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Location */}
              {selectedReport.latitude && selectedReport.longitude && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Location</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-700 font-mono">
                      {selectedReport.latitude.toFixed(4)}, {selectedReport.longitude.toFixed(4)}
                    </p>
                    <button
                      onClick={() => openGoogleMaps(selectedReport.latitude!, selectedReport.longitude!)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200/60 hover:bg-teal-100 transition-colors"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      Directions
                    </button>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Timeline</p>
                <div className="space-y-1 text-sm text-slate-600">
                  <p>Submitted: {new Date(selectedReport.created_at).toLocaleDateString('en-NG', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  {selectedReport.reviewed_at && (
                    <p>Reviewed: {new Date(selectedReport.reviewed_at).toLocaleDateString('en-NG', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex items-center gap-3">
              {selectedReport.status === 'pending' && (
                <>
                  <button
                    onClick={() => updateStatus(selectedReport.id, 'verified')}
                    disabled={updating}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-60"
                  >
                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Verify Report
                  </button>
                  <button
                    onClick={() => updateStatus(selectedReport.id, 'dismissed')}
                    disabled={updating}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-all disabled:opacity-60"
                  >
                    <XCircle className="w-4 h-4" />
                    Dismiss
                  </button>
                </>
              )}
              {selectedReport.status === 'verified' && (
                <button
                  onClick={() => updateStatus(selectedReport.id, 'resolved')}
                  disabled={updating}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-60"
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Mark as Resolved
                </button>
              )}
              {(selectedReport.status === 'dismissed' || selectedReport.status === 'resolved') && (
                <button
                  onClick={() => updateStatus(selectedReport.id, 'pending')}
                  disabled={updating}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-all disabled:opacity-60"
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                  Reopen Report
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
