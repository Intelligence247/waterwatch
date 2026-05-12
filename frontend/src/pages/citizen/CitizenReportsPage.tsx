// import { useEffect, useState, useCallback } from 'react';
// import { useAuth } from '../../contexts/AuthContext';
// import { useToast } from '../../components/ui/ToastProvider';
// import { createFaultReport, listFaultReports } from '../../lib/faultReportsApi';
// import { listWaterpoints } from '../../lib/waterpointsApi';
// import {
//   captureBestPosition,
//   fetchApproximateLocationByNetwork,
//   geolocationFailureMessage,
//   getPositionErrorCode,
//   normalizeCapturedPosition,
// } from '../../lib/geolocation';
// import {
//   AlertTriangle,
//   Clock,
//   CheckCircle2,
//   XCircle,
//   CheckCircle,
//   Loader2,
//   Plus,
//   X,
//   Send,
//   Locate,
//   Navigation,
// } from 'lucide-react';

// type ReportStatus = 'pending' | 'verified' | 'dismissed' | 'resolved';

// interface FaultReport {
//   id: string;
//   waterpoint_id: string | null;
//   reporter_name: string;
//   reporter_phone: string;
//   description: string;
//   photo_url: string;
//   latitude: number | null;
//   longitude: number | null;
//   community: string;
//   status: ReportStatus;
//   created_at: string;
//   waterpoints?: { name: string } | null;
// }

// const statusConfig: Record<ReportStatus, { label: string; color: string; bg: string; icon: typeof Clock }> = {
//   pending: { label: 'Pending', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200/60', icon: Clock },
//   verified: { label: 'Verified', color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200/60', icon: CheckCircle2 },
//   dismissed: { label: 'Dismissed', color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200/60', icon: XCircle },
//   resolved: { label: 'Resolved', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200/60', icon: CheckCircle },
// };

// export default function CitizenReportsPage() {
//   const { user, profile } = useAuth();
//   const { toast } = useToast();
//   const [reports, setReports] = useState<FaultReport[]>([]);
//   const [loading, setLoading] = useState(true);

//   // New report modal
//   const [modalOpen, setModalOpen] = useState(false);
//   const [form, setForm] = useState({
//     description: '',
//     waterpointId: '',
//     community: '',
//     latitude: '',
//     longitude: '',
//   });
//   const [submitting, setSubmitting] = useState(false);
//   const [locating, setLocating] = useState(false);
//   const [capturedAccuracyMeters, setCapturedAccuracyMeters] = useState<number | null>(null);

//   const fetchReports = useCallback(async () => {
//     setLoading(true);
//     try {
//       const data = await listFaultReports({ limit: 100 });
//       setReports((data.items as FaultReport[]) || []);
//     } catch {
//       toast('error', 'Failed to load your reports.');
//     }
//     setLoading(false);
//   }, [toast]);

//   useEffect(() => { fetchReports(); }, [fetchReports]);

//   const getMyLocation = async () => {
//     setLocating(true);
//     try {
//       const position = await captureBestPosition();
//       const n = normalizeCapturedPosition(position);
//       setForm((prev) => ({
//         ...prev,
//         latitude: n.latitude,
//         longitude: n.longitude,
//       }));
//       setCapturedAccuracyMeters(n.capturedAccuracyMeters);
//       if (n.isApproximateNetwork) {
//         toast(
//           'warning',
//           'Approximate network location (city-level). Prefer the Explore map to tap an exact spot.',
//         );
//       } else if (n.capturedAccuracyMeters === null) {
//         toast(
//           'warning',
//           'Location applied with moderate precision. Use the Explore map to refine if needed.',
//         );
//       } else {
//         toast('success', `Location captured with +/-${Math.round(n.capturedAccuracyMeters)}m accuracy.`);
//       }
//     } catch (error) {
//       if (getPositionErrorCode(error) === 1) {
//         toast('error', geolocationFailureMessage(error));
//         return;
//       }
//       const guess = await fetchApproximateLocationByNetwork();
//       if (guess) {
//         const n = normalizeCapturedPosition(guess);
//         setForm((prev) => ({ ...prev, latitude: n.latitude, longitude: n.longitude }));
//         setCapturedAccuracyMeters(null);
//         toast(
//           'warning',
//           'GPS unavailable; used approximate network location. Prefer the Explore map for an exact pin.',
//         );
//         return;
//       }
//       toast('error', geolocationFailureMessage(error));
//     } finally {
//       setLocating(false);
//     }
//   };

//   const submitReport = async () => {
//     if (!user || !profile) return;
//     if (!form.description.trim()) {
//       toast('error', 'Please describe the problem.');
//       return;
//     }
//     setSubmitting(true);
//     try {
//       await createFaultReport({
//         ...(form.waterpointId ? { waterpointId: form.waterpointId } : {}),
//         reporterName: profile.full_name,
//         reporterPhone: profile.phone,
//         description: form.description.trim(),
//         community: form.community.trim() || profile.community || '',
//         ...(form.latitude ? { latitude: parseFloat(form.latitude) } : {}),
//         ...(form.longitude ? { longitude: parseFloat(form.longitude) } : {}),
//       });
//       toast('success', 'Fault report submitted! The Water Corporation will review it.');
//     } catch {
//       toast('error', 'Failed to submit report. Please try again.');
//     }
//     setSubmitting(false);
//     setModalOpen(false);
//     setForm({ description: '', waterpointId: '', community: '', latitude: '', longitude: '' });
//     setCapturedAccuracyMeters(null);
//     fetchReports();
//   };

//   // Fetch waterpoints for the dropdown
//   const [waterpoints, setWaterpoints] = useState<Array<{ id: string; name: string }>>([]);
//   useEffect(() => {
//     listWaterpoints({ limit: 100 })
//       .then((data) => {
//         setWaterpoints(data.items.map((item) => ({ id: item.id, name: item.name })));
//       })
//       .catch(() => {
//         setWaterpoints([]);
//       });
//   }, []);

//   const openGoogleMaps = (lat: number, lng: number) => {
//     window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
//   };

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//         <div>
//           <h1 className="font-heading font-800 text-2xl text-slate-900 tracking-tight">My Reports</h1>
//           <p className="text-sm text-slate-500 mt-1">Track the fault reports you have submitted.</p>
//         </div>
//         <button
//           onClick={() => setModalOpen(true)}
//           className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-sm hover:shadow-md transition-all"
//         >
//           <Plus className="w-4 h-4" />
//           New Report
//         </button>
//       </div>

//       {/* Reports List */}
//       {loading ? (
//         <div className="flex items-center justify-center py-16">
//           <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
//         </div>
//       ) : reports.length === 0 ? (
//         <div className="bg-white rounded-xl border border-slate-200 text-center py-16">
//           <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
//           <p className="text-sm text-slate-500 mb-4">You have not submitted any fault reports yet.</p>
//           <button
//             onClick={() => setModalOpen(true)}
//             className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold shadow-sm transition-all"
//           >
//             <Plus className="w-4 h-4" />
//             Submit your first report
//           </button>
//         </div>
//       ) : (
//         <div className="space-y-3">
//           {reports.map((report) => {
//             const cfg = statusConfig[report.status];
//             const StatusIcon = cfg.icon;
//             return (
//               <div key={report.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
//                 <div className="flex items-start gap-4">
//                   <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
//                     <StatusIcon className={`w-5 h-5 ${cfg.color}`} />
//                   </div>
//                   <div className="flex-1 min-w-0">
//                     <div className="flex items-start justify-between gap-3">
//                       <div>
//                         <p className="text-sm font-semibold text-slate-900">
//                           {report.waterpoints?.name || 'General Report'}
//                         </p>
//                         {report.community && (
//                           <p className="text-xs text-slate-500 mt-0.5">in {report.community}</p>
//                         )}
//                       </div>
//                       <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
//                         <StatusIcon className="w-3 h-3" />
//                         {cfg.label}
//                       </span>
//                     </div>
//                     <p className="text-sm text-slate-600 mt-2">{report.description}</p>
//                     <div className="flex items-center gap-4 mt-3 text-xs text-slate-400 flex-wrap">
//                       <span className="flex items-center gap-1">
//                         <Clock className="w-3 h-3" />
//                         {new Date(report.created_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
//                       </span>
//                       {report.latitude && report.longitude && (
//                         <button
//                           onClick={() => openGoogleMaps(report.latitude!, report.longitude!)}
//                           className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 font-medium"
//                         >
//                           <Navigation className="w-3 h-3" />
//                           View on Map
//                         </button>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       )}

//       {/* New Report Modal */}
//       {modalOpen && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
//           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
//           <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
//             <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
//               <h2 className="font-heading font-700 text-lg text-slate-900 tracking-tight">Report a Fault</h2>
//               <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
//                 <X className="w-5 h-5" />
//               </button>
//             </div>

//             <div className="p-6 space-y-4">
//               <div>
//                 <label className="block text-sm font-semibold text-slate-700 mb-1.5">
//                   Link to water point (optional)
//                 </label>
//                 <select
//                   value={form.waterpointId}
//                   onChange={(e) => setForm({ ...form, waterpointId: e.target.value })}
//                   className="field-input"
//                 >
//                   <option value="">None - general report</option>
//                   {waterpoints.map((wp) => (
//                     <option key={wp.id} value={wp.id}>{wp.name}</option>
//                   ))}
//                 </select>
//               </div>

//               <div>
//                 <label className="block text-sm font-semibold text-slate-700 mb-1.5">
//                   Community
//                 </label>
//                 <input
//                   type="text"
//                   value={form.community}
//                   onChange={(e) => setForm({ ...form, community: e.target.value })}
//                   className="field-input"
//                   placeholder={profile?.community || 'Your community'}
//                 />
//               </div>

//               {/* Location capture */}
//               <div>
//                 <label className="block text-sm font-semibold text-slate-700 mb-1.5">
//                   Location
//                 </label>
//                 <div className="flex gap-2">
//                   <button
//                     type="button"
//                     onClick={getMyLocation}
//                     disabled={locating}
//                     className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-teal-200 bg-teal-50 text-teal-700 text-sm font-semibold hover:bg-teal-100 transition-colors disabled:opacity-60"
//                   >
//                     {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Locate className="w-4 h-4" />}
//                     {locating ? 'Capturing best location...' : 'Use My Location'}
//                   </button>
//                 </div>
//                 {capturedAccuracyMeters !== null && (
//                   <p className="text-xs text-slate-500 mt-2">
//                     Last captured accuracy: +/-{Math.round(capturedAccuracyMeters)}m
//                   </p>
//                 )}
//                 {form.latitude && form.longitude && (
//                   <p className="text-xs text-slate-500 mt-2 font-mono">
//                     {form.latitude}, {form.longitude}
//                   </p>
//                 )}
//                 <p className="text-xs text-slate-400 mt-1">
//                   Or report directly from the map on the Explore Map page for precise pinning.
//                 </p>
//               </div>

//               <div>
//                 <label className="block text-sm font-semibold text-slate-700 mb-1.5">
//                   Describe the problem <span className="text-red-400">*</span>
//                 </label>
//                 <textarea
//                   value={form.description}
//                   onChange={(e) => setForm({ ...form, description: e.target.value })}
//                   className="field-input min-h-[100px] resize-none"
//                   placeholder="What is wrong? Be specific about the issue, location, and when it started..."
//                 />
//               </div>

//               <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-3.5">
//                 <p className="text-xs text-amber-700">
//                   Your report will be reviewed by the Water Corporation. For the most accurate location, use the "Report a Fault" button on the Explore Map page.
//                 </p>
//               </div>
//             </div>

//             <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex items-center justify-end gap-3">
//               <button
//                 onClick={() => setModalOpen(false)}
//                 className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={submitReport}
//                 disabled={submitting || !form.description.trim()}
//                 className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-60"
//               >
//                 {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
//                 Submit Report
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }




















import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/ToastProvider';
import { createFaultReport, listFaultReports } from '../../lib/faultReportsApi';
import { listWaterpoints } from '../../lib/waterpointsApi';
import {
  captureBestPosition,
  geolocationFailureMessage,
  normalizeCapturedPosition,
  type LocationPhase,
} from '../../lib/geolocation';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  CheckCircle,
  Loader2,
  Plus,
  X,
  Send,
  Locate,
  Navigation,
  Wifi,
  Satellite,
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
  created_at: string;
  waterpoints?: { name: string } | null;
}

const statusConfig: Record<ReportStatus, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending:  { label: 'Pending',   color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200/60',   icon: Clock       },
  verified: { label: 'Verified',  color: 'text-teal-700',    bg: 'bg-teal-50 border-teal-200/60',     icon: CheckCircle2 },
  dismissed:{ label: 'Dismissed', color: 'text-slate-500',   bg: 'bg-slate-50 border-slate-200/60',   icon: XCircle     },
  resolved: { label: 'Resolved',  color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200/60',icon: CheckCircle },
};

export default function CitizenReportsPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<FaultReport[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    description: '',
    waterpointId: '',
    community: '',
    latitude: '',
    longitude: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Location state
  const [locating, setLocating] = useState(false);
  const [locationPhase, setLocationPhase] = useState<LocationPhase | null>(null);
  const [capturedAccuracyMeters, setCapturedAccuracyMeters] = useState<number | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listFaultReports({ limit: 100 });
      setReports((data.items as FaultReport[]) || []);
    } catch {
      toast('error', 'Failed to load your reports.');
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  /**
   * captureBestPosition handles the full fallback chain internally
   * (Wi-Fi → GPS watch → stale cache → IP geolocation).
   * No need for a manual network-location fallback here.
   */
  const getMyLocation = async () => {
    setLocating(true);
    setLocationPhase(null);
    try {
      const position = await captureBestPosition((phase) => setLocationPhase(phase));
      const n = normalizeCapturedPosition(position);
      setForm((prev) => ({ ...prev, latitude: n.latitude, longitude: n.longitude }));
      setCapturedAccuracyMeters(n.capturedAccuracyMeters);

      if (n.isApproximateNetwork) {
        toast('warning', 'Approximate network location (city-level). Prefer the Explore map to tap an exact spot.');
      } else if (n.capturedAccuracyMeters === null) {
        toast('warning', 'Location applied with moderate precision. Use the Explore map to refine if needed.');
      } else {
        toast('success', `Location captured with ±${Math.round(n.capturedAccuracyMeters)} m accuracy.`);
      }
    } catch (error) {
      // Only reaches here on PERMISSION_DENIED or complete failure.
      toast('error', geolocationFailureMessage(error));
    } finally {
      setLocating(false);
      setLocationPhase(null);
    }
  };

  const submitReport = async () => {
    if (!user || !profile) return;
    if (!form.description.trim()) {
      toast('error', 'Please describe the problem.');
      return;
    }
    setSubmitting(true);
    try {
      await createFaultReport({
        ...(form.waterpointId ? { waterpointId: form.waterpointId } : {}),
        reporterName: profile.full_name,
        reporterPhone: profile.phone,
        description: form.description.trim(),
        community: form.community.trim() || profile.community || '',
        ...(form.latitude  ? { latitude:  parseFloat(form.latitude)  } : {}),
        ...(form.longitude ? { longitude: parseFloat(form.longitude) } : {}),
      });
      toast('success', 'Fault report submitted! The Water Corporation will review it.');
    } catch {
      toast('error', 'Failed to submit report. Please try again.');
    }
    setSubmitting(false);
    setModalOpen(false);
    setForm({ description: '', waterpointId: '', community: '', latitude: '', longitude: '' });
    setCapturedAccuracyMeters(null);
    fetchReports();
  };

  const [waterpoints, setWaterpoints] = useState<Array<{ id: string; name: string }>>([]);
  useEffect(() => {
    listWaterpoints({ limit: 100 })
      .then((data) => setWaterpoints(data.items.map((item) => ({ id: item.id, name: item.name }))))
      .catch(() => setWaterpoints([]));
  }, []);

  const openGoogleMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  /** Button label while acquiring location. */
  const locatingLabel = () => {
    if (!locating) return 'Use My Location';
    if (locationPhase === 'wifi')    return 'Wi-Fi fix…';
    if (locationPhase === 'gps')     return 'GPS warm-up…';
    if (locationPhase === 'network') return 'Network location…';
    return 'Locating…';
  };

  const locatingIcon = () => {
    if (!locating) return <Locate className="w-4 h-4" />;
    if (locationPhase === 'gps') return <Satellite className="w-4 h-4" />;
    if (locationPhase === 'wifi' || locationPhase === 'network') return <Wifi className="w-4 h-4" />;
    return <Loader2 className="w-4 h-4 animate-spin" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-800 text-2xl text-slate-900 tracking-tight">My Reports</h1>
          <p className="text-sm text-slate-500 mt-1">Track the fault reports you have submitted.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-sm hover:shadow-md transition-all"
        >
          <Plus className="w-4 h-4" /> New Report
        </button>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 text-center py-16">
          <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500 mb-4">You have not submitted any fault reports yet.</p>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Submit your first report
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const cfg = statusConfig[report.status];
            const StatusIcon = cfg.icon;
            return (
              <div key={report.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                    <StatusIcon className={`w-5 h-5 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {report.waterpoints?.name || 'General Report'}
                        </p>
                        {report.community && <p className="text-xs text-slate-500 mt-0.5">in {report.community}</p>}
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
                        <StatusIcon className="w-3 h-3" /> {cfg.label}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-2">{report.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(report.created_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {report.latitude && report.longitude && (
                        <button
                          onClick={() => openGoogleMaps(report.latitude!, report.longitude!)}
                          className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 font-medium"
                        >
                          <Navigation className="w-3 h-3" /> View on Map
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Report Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="font-heading font-700 text-lg text-slate-900 tracking-tight">Report a Fault</h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Link to water point (optional)</label>
                <select value={form.waterpointId} onChange={(e) => setForm({ ...form, waterpointId: e.target.value })} className="field-input">
                  <option value="">None — general report</option>
                  {waterpoints.map((wp) => <option key={wp.id} value={wp.id}>{wp.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Community</label>
                <input
                  type="text" value={form.community}
                  onChange={(e) => setForm({ ...form, community: e.target.value })}
                  className="field-input"
                  placeholder={profile?.community || 'Your community'}
                />
              </div>

              {/* Location capture */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Location</label>
                <button
                  type="button"
                  onClick={getMyLocation}
                  disabled={locating}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-teal-200 bg-teal-50 text-teal-700 text-sm font-semibold hover:bg-teal-100 transition-colors disabled:opacity-60"
                >
                  {locatingIcon()} {locatingLabel()}
                </button>

                {/* Live GPS phase description */}
                {locating && locationPhase === 'gps' && (
                  <p className="text-xs text-teal-600 mt-2 animate-pulse">
                    GPS warm-up in progress — can take up to 15 s on first use.
                  </p>
                )}

                {capturedAccuracyMeters !== null && (
                  <p className="text-xs text-slate-500 mt-2">
                    Last captured accuracy: ±{Math.round(capturedAccuracyMeters)} m
                  </p>
                )}
                {form.latitude && form.longitude && (
                  <p className="text-xs text-slate-500 mt-1 font-mono">
                    {form.latitude}, {form.longitude}
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-1">
                  Or report directly from the map on the Explore Map page for precise pinning.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Describe the problem <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="field-input min-h-[100px] resize-none"
                  placeholder="What is wrong? Be specific about the issue, location, and when it started…"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-3.5">
                <p className="text-xs text-amber-700">
                  Your report will be reviewed by the Water Corporation. For the most accurate location, use the "Report a Fault" button on the Explore Map page.
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitReport}
                disabled={submitting || !form.description.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-60"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}