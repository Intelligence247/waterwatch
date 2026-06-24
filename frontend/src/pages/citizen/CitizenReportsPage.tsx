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
import { uploadImages } from '../../lib/uploadsApi';
import { ApiError } from '../../lib/apiClient';
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
  MapPin,
  Camera,
  Trash2,
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
  resolution_note?: string | null;
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
    photoUrl: '',
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm((prev) => ({
        ...prev,
        community: prev.community || profile.community || '',
      }));
    }
  }, [profile]);

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
        photoUrl: form.photoUrl,
      });
      toast('success', 'Fault report submitted! The Water Corporation will review it.');
    } catch {
      toast('error', 'Failed to submit report. Please try again.');
    }
    setSubmitting(false);
    setModalOpen(false);
    setForm({ description: '', waterpointId: '', community: '', latitude: '', longitude: '', photoUrl: '' });
    setCapturedAccuracyMeters(null);
    fetchReports();
  };

  const [waterpoints, setWaterpoints] = useState<Array<{ id: string; name: string }>>([]);
  useEffect(() => {
    listWaterpoints({ limit: 100, auth: true })
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
    return 'Locating…';
  };

  const locatingIcon = () => {
    if (!locating) return <Locate className="w-4 h-4" />;
    if (locationPhase === 'gps') return <Satellite className="w-4 h-4" />;
    if (locationPhase === 'wifi') return <Wifi className="w-4 h-4" />;
    return <Loader2 className="w-4 h-4 animate-spin" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-800 text-2xl text-slate-900 tracking-tight flex items-center gap-2">
            My Reports
          </h1>
          <p className="text-sm text-slate-500 mt-1">Monitor the status and view resolutions of reports you submitted.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all"
        >
          <Plus className="w-4 h-4" /> File New Report
        </button>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-7 h-7 text-teal-600 animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 text-center py-16 shadow-sm">
          <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600 mb-1">No reports filed yet</p>
          <p className="text-xs text-slate-400 mb-5">You haven't filed any fault reports. Use the button below to log your first issue.</p>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Submit your first report
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {reports.map((report) => {
            const cfg = statusConfig[report.status];
            const StatusIcon = cfg.icon;
            return (
              <div key={report.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-all duration-200 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                    <StatusIcon className={`w-5.5 h-5.5 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {report.waterpoints?.name || 'General Report'}
                        </p>
                        {report.community && (
                          <p className="text-xs text-slate-400 mt-0.5 font-medium flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {report.community}
                          </p>
                        )}
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border flex-shrink-0 uppercase ${cfg.bg} ${cfg.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" /> {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 mt-2.5 leading-relaxed bg-slate-50/40 p-3 rounded-xl border border-slate-100/60">
                      {report.description}
                    </p>

                    {/* Resolution Notes blockquote */}
                    {report.resolution_note && (
                      <div className="mt-3.5 p-3.5 bg-green-50/30 border border-green-200/50 rounded-xl text-xs text-slate-600">
                        <p className="font-semibold text-green-800 flex items-center gap-1.5 mb-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-700" />
                          Resolution Notes
                        </p>
                        <p className="italic text-slate-600">"{report.resolution_note}"</p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 mt-3.5 text-xs text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(report.created_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {report.latitude && report.longitude && (
                        <button
                          onClick={() => openGoogleMaps(report.latitude!, report.longitude!)}
                          className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 font-semibold transition-colors"
                        >
                          <Navigation className="w-3.5 h-3.5" /> View location map
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
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-100">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="font-heading font-800 text-lg text-slate-900 tracking-tight">Report a Fault</h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Link to existing water point (optional)</label>
                <select
                  value={form.waterpointId}
                  onChange={(e) => setForm({ ...form, waterpointId: e.target.value })}
                  className="w-full appearance-none pl-3.5 pr-8 py-2.5 border border-slate-200 rounded-xl bg-white text-xs text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  <option value="">None — general report</option>
                  {waterpoints.map((wp) => <option key={wp.id} value={wp.id}>{wp.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Community Location</label>
                <input
                  type="text" value={form.community}
                  onChange={(e) => setForm({ ...form, community: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-700"
                  placeholder={profile?.community || 'Your community'}
                />
              </div>

              {/* Location capture */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Geotag Coordinates</label>
                <button
                  type="button"
                  onClick={getMyLocation}
                  disabled={locating}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-teal-200 bg-teal-50 text-teal-700 text-xs font-bold hover:bg-teal-100 transition-colors disabled:opacity-60"
                >
                  {locatingIcon()} {locatingLabel()}
                </button>

                {/* Live GPS phase description */}
                {locating && locationPhase === 'gps' && (
                  <p className="text-xs text-teal-600 mt-2 animate-pulse flex items-center gap-1 font-semibold">
                    <Satellite className="w-3.5 h-3.5" />
                    GPS fix in progress — can take up to 15 s on first use.
                  </p>
                )}

                {capturedAccuracyMeters !== null && (
                  <p className="text-xs text-slate-500 mt-2 font-medium">
                    Last captured accuracy: ±{Math.round(capturedAccuracyMeters)} m
                  </p>
                )}
                {form.latitude && form.longitude && (
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    Latitude: {form.latitude}, Longitude: {form.longitude}
                  </p>
                )}
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                  Note: Geotagging is optional but highly recommended. You can also report directly from the Explore Map page by clicking a specific location for precise pin accuracy.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Describe the problem <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-700 placeholder-slate-400 min-h-[100px] resize-none"
                  placeholder="What is wrong? Be specific about the issue, leak, flow rate, and when it started…"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Image Evidence</label>
                {form.photoUrl ? (
                  <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                    <img
                      src={form.photoUrl}
                      alt="Evidence preview"
                      className="w-full h-32 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, photoUrl: '' })}
                      className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white text-rose-600 rounded-lg shadow-sm border border-slate-100 hover:text-rose-700 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-all">
                    <div className="flex flex-col items-center justify-center pt-4 pb-4">
                      {uploadingImage ? (
                        <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
                      ) : (
                        <>
                          <Camera className="w-6 h-6 text-slate-400 mb-1" />
                          <p className="text-xs text-slate-500 font-medium">Click to upload photo evidence</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG up to 5MB</p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingImage}
                      onChange={async (e) => {
                        const files = e.target.files;
                        if (!files || files.length === 0) return;
                        setUploadingImage(true);
                        try {
                          const result = await uploadImages([files[0]]);
                          setForm({ ...form, photoUrl: result.imageUrl });
                          toast('success', 'Image uploaded successfully!');
                        } catch (err) {
                          const msg = err instanceof ApiError ? err.message : 'Failed to upload image';
                          toast('error', msg);
                        } finally {
                          setUploadingImage(false);
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              <div className="bg-amber-50/50 border border-amber-200/50 rounded-xl p-3.5">
                <p className="text-xs text-amber-800/95 leading-relaxed font-medium">
                  Your report will be reviewed by the Maintenance Department. Ensuring high-accuracy location tags helps repair teams deploy quickly.
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex items-center justify-end gap-3 z-10">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitReport}
                disabled={submitting || !form.description.trim() || uploadingImage}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-60"
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