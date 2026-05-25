import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Clock,
  Check,
  GitMerge,
  ArrowRight,
  MapPin,
  HelpCircle,
  Sparkles,
  Info,
  Database,
  Search,
} from 'lucide-react';
import { ApiError } from '../../lib/apiClient';
import { useToast } from '../../components/ui/ToastProvider';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import {
  getWaterpointDedupeAudit,
  listDuplicateReviewQueue,
  resolveDuplicateReview,
  type DuplicateAuditCandidate,
  type DuplicateAuditResponse,
  type WaterpointWritePayload,
} from '../../lib/waterpointsApi';
import { getDuplicateReviewInsights } from '../../lib/analyticsApi';
import type { Waterpoint, WaterpointType, WaterpointStatus } from '../../lib/types';
import { settingsApi } from '../../lib/settingsApi';

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const earthRadiusMeters = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMeters * c;
}

interface WaterpointEditState {
  name: string;
  type: WaterpointType;
  status: WaterpointStatus;
  community: string;
  lga: string;
  latitude: number;
  longitude: number;
  description: string;
}

export default function AdminDedupePage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [reviewQueue, setReviewQueue] = useState<Waterpoint[]>([]);
  const [audit, setAudit] = useState<DuplicateAuditResponse | null>(null);
  const [insights, setInsights] = useState<Awaited<ReturnType<typeof getDuplicateReviewInsights>> | null>(null);
  const [auditFilter, setAuditFilter] = useState<'all' | 'hard_duplicate' | 'merge_candidate' | 'review_candidate'>(
    'all',
  );
  const [selectedCandidateKey, setSelectedCandidateKey] = useState<string | null>(null);
  const [mergeConfirmTarget, setMergeConfirmTarget] = useState<Waterpoint | null>(null);

  // Range and local edit states
  const [scanRange, setScanRange] = useState<number>(30);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [leftEdit, setLeftEdit] = useState<WaterpointEditState | null>(null);
  const [rightEdit, setRightEdit] = useState<WaterpointEditState | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let activeRange = scanRange;
      if (!settingsLoaded) {
        try {
          const settingsRes = await settingsApi.getSettings();
          activeRange = settingsRes.settings.waterpointAuditDistanceMeters;
          setScanRange(activeRange);
          setSettingsLoaded(true);
        } catch (settingsErr) {
          console.warn('Failed to load system settings, falling back to default range', settingsErr);
        }
      }

      const [queueRes, auditRes, insightsRes] = await Promise.all([
        listDuplicateReviewQueue({ status: 'pending_review', limit: 20, sortOrder: 'desc' }),
        getWaterpointDedupeAudit({ maxItems: 800, distanceMeters: activeRange }),
        getDuplicateReviewInsights(30),
      ]);
      setReviewQueue(queueRes.items);
      setAudit(auditRes);
      setInsights(insightsRes);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load dedupe workspace.';
      toast('error', message);
    } finally {
      setLoading(false);
    }
  }, [toast, scanRange, settingsLoaded]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const filteredCandidates = useMemo(() => {
    const all = audit?.proximityCandidates ?? [];
    if (auditFilter === 'all') return all;
    return all.filter((item) => item.recommendation === auditFilter);
  }, [audit?.proximityCandidates, auditFilter]);

  const topCandidates = useMemo(() => filteredCandidates.slice(0, 15), [filteredCandidates]);

  const selectedCandidate = useMemo(() => {
    if (topCandidates.length === 0) return null;
    if (!selectedCandidateKey) return topCandidates[0] ?? null;
    return (
      topCandidates.find((candidate) => `${candidate.left.id}-${candidate.right.id}` === selectedCandidateKey) ??
      topCandidates[0] ??
      null
    );
  }, [selectedCandidateKey, topCandidates]);

  const selectedQueueItem = useMemo(() => {
    if (!selectedCandidate) return null;
    return (
      reviewQueue.find((q) => q.id === selectedCandidate.left.id || q.id === selectedCandidate.right.id) ?? null
    );
  }, [selectedCandidate, reviewQueue]);

  // Sync edit states
  useEffect(() => {
    if (selectedCandidate) {
      setLeftEdit({
        name: selectedCandidate.left.name,
        type: selectedCandidate.left.type,
        status: selectedCandidate.left.status,
        community: selectedCandidate.left.community,
        lga: selectedCandidate.left.lga || '',
        latitude: selectedCandidate.left.latitude,
        longitude: selectedCandidate.left.longitude,
        description: selectedCandidate.left.description || '',
      });
      setRightEdit({
        name: selectedCandidate.right.name,
        type: selectedCandidate.right.type,
        status: selectedCandidate.right.status,
        community: selectedCandidate.right.community,
        lga: selectedCandidate.right.lga || '',
        latitude: selectedCandidate.right.latitude,
        longitude: selectedCandidate.right.longitude,
        description: selectedCandidate.right.description || '',
      });
    } else {
      setLeftEdit(null);
      setRightEdit(null);
    }
  }, [selectedCandidate]);

  const hasChanges = useMemo(() => {
    if (!selectedCandidate || !leftEdit || !rightEdit) return false;
    return (
      leftEdit.name !== selectedCandidate.left.name ||
      leftEdit.type !== selectedCandidate.left.type ||
      leftEdit.status !== selectedCandidate.left.status ||
      leftEdit.community !== selectedCandidate.left.community ||
      leftEdit.lga !== selectedCandidate.left.lga ||
      leftEdit.latitude !== selectedCandidate.left.latitude ||
      leftEdit.longitude !== selectedCandidate.left.longitude ||
      leftEdit.description !== selectedCandidate.left.description ||
      rightEdit.name !== selectedCandidate.right.name ||
      rightEdit.type !== selectedCandidate.right.type ||
      rightEdit.status !== selectedCandidate.right.status ||
      rightEdit.community !== selectedCandidate.right.community ||
      rightEdit.lga !== selectedCandidate.right.lga ||
      rightEdit.latitude !== selectedCandidate.right.latitude ||
      rightEdit.longitude !== selectedCandidate.right.longitude ||
      rightEdit.description !== selectedCandidate.right.description
    );
  }, [selectedCandidate, leftEdit, rightEdit]);

  const currentDistance = useMemo(() => {
    if (!leftEdit || !rightEdit) return 0;
    return calculateDistanceMeters(
      leftEdit.latitude,
      leftEdit.longitude,
      rightEdit.latitude,
      rightEdit.longitude
    );
  }, [leftEdit, rightEdit]);

  const handleLeftChange = <K extends keyof WaterpointEditState>(
    field: K,
    value: WaterpointEditState[K],
  ) => {
    setLeftEdit((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleRightChange = <K extends keyof WaterpointEditState>(
    field: K,
    value: WaterpointEditState[K],
  ) => {
    setRightEdit((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const getInputClass = (side: 'left' | 'right', field: keyof NonNullable<typeof leftEdit>) => {
    const base = 'w-full text-xs font-semibold px-2 py-1.5 rounded-lg border outline-none transition-all duration-200';
    if (!selectedCandidate || !leftEdit || !rightEdit) return base;

    const isModified =
      side === 'left'
        ? leftEdit[field] !== selectedCandidate.left[field]
        : rightEdit[field] !== selectedCandidate.right[field];

    const isMatching = leftEdit[field] === rightEdit[field];

    if (isModified) {
      return `${base} border-amber-400 bg-amber-50/30 text-amber-900 focus:ring-1 focus:ring-amber-500 focus:border-amber-500`;
    }
    if (isMatching) {
      return `${base} border-emerald-200 bg-emerald-50/20 text-emerald-800 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500`;
    }
    return `${base} border-slate-200 bg-white text-slate-800 focus:ring-1 focus:ring-brand-500 focus:border-brand-500`;
  };

  const resolveItem = async (item: Waterpoint, action: 'keep' | 'merge') => {
    setResolvingId(item.id);
    try {
      const mergeTargetId = item.duplicate_review?.candidate_waterpoint_id ?? undefined;
      if (action === 'merge' && !mergeTargetId) {
        toast('error', 'No merge candidate available for this record.');
        return;
      }

      let leftUpdates: Partial<WaterpointWritePayload> | undefined = undefined;
      let rightUpdates: Partial<WaterpointWritePayload> | undefined = undefined;

      if (selectedCandidate && leftEdit && rightEdit) {
        const compileUpdates = (
          edited: WaterpointEditState,
          original: typeof selectedCandidate.left,
        ): Partial<WaterpointWritePayload> | undefined => {
          const updates: Partial<WaterpointWritePayload> = {};
          if (edited.name !== original.name) updates.name = edited.name;
          if (edited.type !== original.type) updates.type = edited.type;
          if (edited.status !== original.status) updates.status = edited.status;
          if (edited.community !== original.community) updates.community = edited.community;
          if (edited.lga !== original.lga) updates.lga = edited.lga;
          if (edited.latitude !== original.latitude) updates.latitude = edited.latitude;
          if (edited.longitude !== original.longitude) updates.longitude = edited.longitude;
          if (edited.description !== original.description) updates.description = edited.description;
          return Object.keys(updates).length > 0 ? updates : undefined;
        };

        if (item.id === selectedCandidate.left.id) {
          leftUpdates = compileUpdates(leftEdit, selectedCandidate.left);
          rightUpdates = compileUpdates(rightEdit, selectedCandidate.right);
        } else if (item.id === selectedCandidate.right.id) {
          leftUpdates = compileUpdates(rightEdit, selectedCandidate.right);
          rightUpdates = compileUpdates(leftEdit, selectedCandidate.left);
        }
      }

      await resolveDuplicateReview(item.id, {
        action,
        mergeIntoWaterpointId: mergeTargetId,
        resolutionNote:
          action === 'keep'
            ? 'Resolved via integrity workspace: distinct waterpoint retained.'
            : 'Resolved via integrity workspace: duplicate merged into candidate.',
        leftUpdates,
        rightUpdates,
      });
      toast('success', action === 'keep' ? 'Marked as distinct waterpoint.' : 'Marked as merged duplicate.');
      setSelectedCandidateKey(null);
      await fetchData();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to resolve duplicate review.';
      toast('error', message);
    } finally {
      setResolvingId(null);
    }
  };



  const getRecommendationLabel = (rec: DuplicateAuditCandidate['recommendation']) => {
    switch (rec) {
      case 'hard_duplicate':
        return 'Critical Duplicate';
      case 'merge_candidate':
        return 'Merge Candidate';
      case 'review_candidate':
        return 'Review Recommended';
      default:
        return rec;
    }
  };

  const recommendationBadgeTone = (rec: DuplicateAuditCandidate['recommendation']) => {
    switch (rec) {
      case 'hard_duplicate':
        return 'text-red-700 bg-red-50 border-red-200/50';
      case 'merge_candidate':
        return 'text-amber-700 bg-amber-50 border-amber-200/50';
      case 'review_candidate':
        return 'text-teal-700 bg-teal-50 border-teal-200/50';
      default:
        return 'text-slate-700 bg-slate-50 border-slate-200/50';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'borehole':
        return 'bg-teal-50 text-teal-700 border-teal-100';
      case 'well':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'tap':
        return 'bg-sky-50 text-sky-700 border-sky-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-800 text-3xl text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 bg-brand-50 text-brand-600 rounded-xl border border-brand-100/50">
              <Database className="w-6 h-6" />
            </span>
            Data Integrity
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Resolve overlapping coordinates, clean duplicate waterpoint data, and monitor quality metrics.
          </p>
        </div>
        <button
          onClick={() => void fetchData()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-60 transition-all shadow-sm hover:shadow"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh Workspace
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Pending Review"
          value={insights?.stats.pendingReview ?? 0}
          icon={ShieldAlert}
          tone="amber"
          desc="Queue awaiting action"
        />
        <KpiCard
          label="Resolved Keep"
          value={insights?.stats.resolvedKeep ?? 0}
          icon={CheckCircle2}
          tone="teal"
          desc="Kept as distinct items"
        />
        <KpiCard
          label="Resolved Merged"
          value={insights?.stats.resolvedMerged ?? 0}
          icon={GitMerge}
          tone="red"
          desc="Duplicates merged"
        />
        <KpiCard
          label="Oldest Pending"
          value={insights?.stats.pendingOldestAgeDays ?? 0}
          icon={Clock}
          tone="slate"
          desc="Max active age (days)"
        />
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Workspace Panel: Queue & Audit List */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Pending Duplicate Review Queue */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  Pending Duplicate Review Queue
                  {reviewQueue.length > 0 && (
                    <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded-full font-bold">
                      {reviewQueue.length}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Flagged during submission. Action required.</p>
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />
              </div>
            ) : reviewQueue.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-5 h-5 text-emerald-500" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800">Workspace is clean</h3>
                <p className="text-xs text-slate-400 mt-1">No pending duplicate reviews in the queue.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[440px] overflow-y-auto">
                {reviewQueue.map((item) => (
                  <div
                    key={item.id}
                    className="px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-900">{item.name}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold border rounded-md uppercase tracking-wider ${getTypeColor(item.type)}`}>
                          {item.type}
                        </span>
                      </div>
                      
                      {/* Connection Graph illustration */}
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg w-fit">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium text-slate-700">{item.community}</span>
                        <ArrowRight className="w-3 h-3 text-slate-300" />
                        <span className="font-semibold text-amber-600 font-mono">
                          {item.duplicate_review?.distance_meters?.toFixed(1) ?? '0.0'}m
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-300" />
                        <span className="text-slate-400 text-[10px] font-medium">
                          Candidate: <span className="font-semibold text-slate-600">{item.duplicate_review?.candidate_waterpoint_name ?? item.duplicate_review?.candidate_waterpoint_id?.slice(-6) ?? 'N/A'}</span>
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => void resolveItem(item, 'keep')}
                        disabled={resolvingId === item.id}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold border border-teal-200 text-teal-700 hover:bg-teal-50 active:bg-teal-100 disabled:opacity-60 transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Keep distinct
                      </button>
                      <button
                        onClick={() => setMergeConfirmTarget(item)}
                        disabled={resolvingId === item.id || !item.duplicate_review?.candidate_waterpoint_id}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-sm hover:shadow disabled:opacity-60 transition-all"
                      >
                        <GitMerge className="w-3.5 h-3.5" />
                        Mark merged
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Audit Candidates */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Database Proximity Audit</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Closest suspicious pairs matching coordinates within audit distance.
                  </p>
                </div>
                {/* Range Selector Control */}
                <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-xl border border-slate-200/60 shadow-sm shrink-0">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Range:</span>
                  <input
                    type="number"
                    min="1"
                    max="2000"
                    value={scanRange}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) {
                        setScanRange(Math.max(1, Math.min(2000, val)));
                      }
                    }}
                    className="w-12 text-center py-0.5 text-xs font-bold text-slate-800 bg-slate-50 rounded-md border border-slate-200/50 outline-none font-mono focus:ring-1 focus:ring-brand-500"
                  />
                  <span className="text-[11px] font-semibold text-slate-500 font-mono">m</span>
                  <select
                    value={[10, 20, 30, 50, 100].includes(scanRange) ? scanRange : 'custom'}
                    onChange={(e) => {
                      if (e.target.value !== 'custom') {
                        setScanRange(Number(e.target.value));
                      }
                    }}
                    className="py-0.5 px-1 bg-slate-50 border border-slate-200/50 rounded-md text-xs font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="10">10m</option>
                    <option value="20">20m</option>
                    <option value="30">30m</option>
                    <option value="50">50m</option>
                    <option value="100">100m</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>
              
              {/* Segmented Filter Control */}
              <div className="mt-4 flex bg-slate-100 p-0.5 rounded-xl gap-0.5 border border-slate-200/40">
                {[
                  { id: 'all', label: 'All pairs' },
                  { id: 'hard_duplicate', label: 'Critical' },
                  { id: 'merge_candidate', label: 'Merge candidate' },
                  { id: 'review_candidate', label: 'Proximity' },
                ].map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() =>
                      setAuditFilter(chip.id as 'all' | 'hard_duplicate' | 'merge_candidate' | 'review_candidate')
                    }
                    className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-lg transition-all ${
                      auditFilter === chip.id
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />
              </div>
            ) : topCandidates.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-500">
                <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold">No candidates found</p>
                <p className="text-xs text-slate-400 mt-0.5">No pairs found in current audit scope.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
                {topCandidates.map((candidate) => {
                  const key = `${candidate.left.id}-${candidate.right.id}`;
                  const isSelected = selectedCandidateKey === key || (!selectedCandidateKey && topCandidates[0] === candidate);
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedCandidateKey(key)}
                      className={`w-full text-left px-5 py-4 transition-all border-l-4 ${
                        isSelected
                          ? 'bg-brand-50/20 border-brand-500 shadow-inner'
                          : 'hover:bg-slate-50/40 border-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                            {candidate.left.name}
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                            {candidate.right.name}
                          </p>
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-slate-700">{candidate.left.community}</span>
                            <span>•</span>
                            <span className="capitalize">{candidate.left.type}</span>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                              <MapPin className="w-3 h-3 text-slate-400" /> {candidate.distanceMeters.toFixed(1)}m apart
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Score Indicator */}
                      <div className="flex items-center justify-between mt-3">
                        <span
                          className={`text-[10px] font-bold border rounded-full px-2 py-0.5 ${recommendationBadgeTone(
                            candidate.recommendation,
                          )}`}
                        >
                          {getRecommendationLabel(candidate.recommendation)}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 font-semibold">Similarity:</span>
                          <div className="flex items-center gap-1.5 bg-white border border-slate-200/60 rounded-md px-1.5 py-0.5 shadow-sm">
                            <span className="text-[11px] font-bold text-slate-700 font-mono">
                              {(candidate.nameSimilarityScore * 100).toFixed(0)}%
                            </span>
                            <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-brand-500 rounded-full"
                                style={{ width: `${candidate.nameSimilarityScore * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Workspace Panel: Interactive Comparison Workspace */}
        <div className="lg:col-span-5 lg:sticky lg:top-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-600" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Comparison Workspace</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Analyze parameters side-by-side to resolve duplicates.</p>
                </div>
              </div>
              {hasChanges && (
                <button
                  onClick={() => {
                    if (selectedCandidate) {
                      setLeftEdit({
                        name: selectedCandidate.left.name,
                        type: selectedCandidate.left.type,
                        status: selectedCandidate.left.status,
                        community: selectedCandidate.left.community,
                        lga: selectedCandidate.left.lga || '',
                        latitude: selectedCandidate.left.latitude,
                        longitude: selectedCandidate.left.longitude,
                        description: selectedCandidate.left.description || '',
                      });
                      setRightEdit({
                        name: selectedCandidate.right.name,
                        type: selectedCandidate.right.type,
                        status: selectedCandidate.right.status,
                        community: selectedCandidate.right.community,
                        lga: selectedCandidate.right.lga || '',
                        latitude: selectedCandidate.right.latitude,
                        longitude: selectedCandidate.right.longitude,
                        description: selectedCandidate.right.description || '',
                      });
                      toast('warning', 'Edits reset to database values.');
                    }
                  }}
                  className="px-2.5 py-1.5 text-xs font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100/80 rounded-xl border border-amber-200/50 transition-colors shrink-0 shadow-sm"
                >
                  Reset Changes
                </button>
              )}
            </div>

            {!selectedCandidate ? (
              <div className="p-8 text-center text-slate-400">
                <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium">No candidate selected</p>
                <p className="text-xs text-slate-400 mt-1">Select an item from the audit list to compare details.</p>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                
                {/* Visual Mapping Info */}
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 space-y-2">
                  <div className="flex gap-2">
                    <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                        {getRecommendationLabel(selectedCandidate.recommendation)}
                      </h4>
                      <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                        These waterpoints are located <strong className="font-bold">{selectedCandidate.distanceMeters.toFixed(1)}m</strong> apart 
                        and share a name similarity index of <strong className="font-bold">{(selectedCandidate.nameSimilarityScore * 100).toFixed(0)}%</strong>.
                      </p>
                    </div>
                  </div>
                  {currentDistance !== selectedCandidate.distanceMeters && (
                    <div className="flex items-center gap-1.5 text-xs bg-white/65 border border-amber-200/40 px-2 py-1 rounded-lg w-fit text-amber-900 font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      <span>Adjusted distance:</span>
                      <strong className="font-mono text-amber-700">{currentDistance.toFixed(1)}m</strong>
                    </div>
                  )}
                </div>

                {/* Side by Side Comparative Table */}
                <div className="border border-slate-200/80 rounded-xl overflow-hidden shadow-sm bg-slate-50/30">
                  <div className="grid grid-cols-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wide bg-slate-100 border-b border-slate-200">
                    <div className="py-2 border-r border-slate-200">Candidate A</div>
                    <div className="py-2">Candidate B</div>
                  </div>

                  <div className="divide-y divide-slate-100 text-xs">
                    {/* Name */}
                    <div className="p-3 space-y-1">
                      <div className="text-[10px] text-slate-400 font-medium text-center uppercase tracking-wide">Name</div>
                      <div className="grid grid-cols-2 gap-2 text-center items-center">
                        <input
                          type="text"
                          value={leftEdit?.name ?? ''}
                          onChange={(e) => handleLeftChange('name', e.target.value)}
                          className={getInputClass('left', 'name')}
                        />
                        <input
                          type="text"
                          value={rightEdit?.name ?? ''}
                          onChange={(e) => handleRightChange('name', e.target.value)}
                          className={getInputClass('right', 'name')}
                        />
                      </div>
                    </div>

                    {/* Type */}
                    <div className="p-3 space-y-1">
                      <div className="text-[10px] text-slate-400 font-medium text-center uppercase tracking-wide">Type</div>
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <select
                          value={leftEdit?.type ?? 'borehole'}
                          onChange={(e) => handleLeftChange('type', e.target.value as WaterpointType)}
                          className={getInputClass('left', 'type')}
                        >
                          <option value="borehole">Borehole</option>
                          <option value="well">Well</option>
                          <option value="tap">Public Tap</option>
                        </select>
                        <select
                          value={rightEdit?.type ?? 'borehole'}
                          onChange={(e) => handleRightChange('type', e.target.value as WaterpointType)}
                          className={getInputClass('right', 'type')}
                        >
                          <option value="borehole">Borehole</option>
                          <option value="well">Well</option>
                          <option value="tap">Public Tap</option>
                        </select>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="p-3 space-y-1">
                      <div className="text-[10px] text-slate-400 font-medium text-center uppercase tracking-wide">Status</div>
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <select
                          value={leftEdit?.status ?? 'functional'}
                          onChange={(e) => handleLeftChange('status', e.target.value as WaterpointStatus)}
                          className={getInputClass('left', 'status')}
                        >
                          <option value="functional">Functional</option>
                          <option value="faulty">Faulty</option>
                          <option value="under_repair">Under Repair</option>
                        </select>
                        <select
                          value={rightEdit?.status ?? 'functional'}
                          onChange={(e) => handleRightChange('status', e.target.value as WaterpointStatus)}
                          className={getInputClass('right', 'status')}
                        >
                          <option value="functional">Functional</option>
                          <option value="faulty">Faulty</option>
                          <option value="under_repair">Under Repair</option>
                        </select>
                      </div>
                    </div>

                    {/* Community */}
                    <div className="p-3 space-y-1">
                      <div className="text-[10px] text-slate-400 font-medium text-center uppercase tracking-wide">Community</div>
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <input
                          type="text"
                          value={leftEdit?.community ?? ''}
                          onChange={(e) => handleLeftChange('community', e.target.value)}
                          className={getInputClass('left', 'community')}
                        />
                        <input
                          type="text"
                          value={rightEdit?.community ?? ''}
                          onChange={(e) => handleRightChange('community', e.target.value)}
                          className={getInputClass('right', 'community')}
                        />
                      </div>
                    </div>

                    {/* LGA */}
                    <div className="p-3 space-y-1">
                      <div className="text-[10px] text-slate-400 font-medium text-center uppercase tracking-wide">LGA</div>
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <input
                          type="text"
                          value={leftEdit?.lga ?? ''}
                          onChange={(e) => handleLeftChange('lga', e.target.value)}
                          className={getInputClass('left', 'lga')}
                        />
                        <input
                          type="text"
                          value={rightEdit?.lga ?? ''}
                          onChange={(e) => handleRightChange('lga', e.target.value)}
                          className={getInputClass('right', 'lga')}
                        />
                      </div>
                    </div>

                    {/* Coordinates */}
                    <div className="p-3 space-y-1">
                      <div className="text-[10px] text-slate-400 font-medium text-center uppercase tracking-wide">GPS Coordinates</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-bold text-slate-400 w-6">LAT:</span>
                            <input
                              type="number"
                              step="0.000001"
                              value={leftEdit?.latitude ?? 0}
                              onChange={(e) => handleLeftChange('latitude', parseFloat(e.target.value) || 0)}
                              className={getInputClass('left', 'latitude')}
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-bold text-slate-400 w-6">LNG:</span>
                            <input
                              type="number"
                              step="0.000001"
                              value={leftEdit?.longitude ?? 0}
                              onChange={(e) => handleLeftChange('longitude', parseFloat(e.target.value) || 0)}
                              className={getInputClass('left', 'longitude')}
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-bold text-slate-400 w-6">LAT:</span>
                            <input
                              type="number"
                              step="0.000001"
                              value={rightEdit?.latitude ?? 0}
                              onChange={(e) => handleRightChange('latitude', parseFloat(e.target.value) || 0)}
                              className={getInputClass('right', 'latitude')}
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-bold text-slate-400 w-6">LNG:</span>
                            <input
                              type="number"
                              step="0.000001"
                              value={rightEdit?.longitude ?? 0}
                              onChange={(e) => handleRightChange('longitude', parseFloat(e.target.value) || 0)}
                              className={getInputClass('right', 'longitude')}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="p-3 space-y-1">
                      <div className="text-[10px] text-slate-400 font-medium text-center uppercase tracking-wide">Description</div>
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <textarea
                          rows={2}
                          value={leftEdit?.description ?? ''}
                          onChange={(e) => handleLeftChange('description', e.target.value)}
                          className={getInputClass('left', 'description')}
                        />
                        <textarea
                          rows={2}
                          value={rightEdit?.description ?? ''}
                          onChange={(e) => handleRightChange('description', e.target.value)}
                          className={getInputClass('right', 'description')}
                        />
                      </div>
                    </div>

                    {/* Review Status */}
                    <div className="p-3 space-y-1">
                      <div className="text-[10px] text-slate-400 font-medium text-center uppercase tracking-wide">Review Status</div>
                      <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-semibold">
                        <div className={`p-1 rounded-lg border ${
                          selectedCandidate.left.reviewStatus === 'pending_review'
                            ? 'bg-amber-50 border-amber-200 text-amber-700'
                            : 'bg-slate-100 border-slate-200 text-slate-500'
                        }`}>
                          {(selectedCandidate.left.reviewStatus || 'none').replace('_', ' ')}
                        </div>
                        <div className={`p-1 rounded-lg border ${
                          selectedCandidate.right.reviewStatus === 'pending_review'
                            ? 'bg-amber-50 border-amber-200 text-amber-700'
                            : 'bg-slate-100 border-slate-200 text-slate-500'
                        }`}>
                          {(selectedCandidate.right.reviewStatus || 'none').replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Direct Action inside Comparison Workspace */}
                {selectedQueueItem ? (
                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 justify-center">
                      <Info className="w-3.5 h-3.5 text-brand-600" />
                      <span>This selected pair contains a pending review candidate.</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => void resolveItem(selectedQueueItem, 'keep')}
                        disabled={resolvingId === selectedQueueItem.id}
                        className="w-full inline-flex justify-center items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border border-teal-200 text-teal-700 hover:bg-teal-50 active:bg-teal-100 disabled:opacity-60 transition-all shadow-sm"
                      >
                        <Check className="w-4 h-4" />
                        Keep Distinct
                      </button>
                      <button
                        onClick={() => setMergeConfirmTarget(selectedQueueItem)}
                        disabled={resolvingId === selectedQueueItem.id}
                        className="w-full inline-flex justify-center items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-sm hover:shadow active:bg-amber-700 disabled:opacity-60 transition-all"
                      >
                        <GitMerge className="w-4 h-4" />
                        Mark Merged
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-xl border border-slate-100 p-3 text-center text-xs text-slate-500">
                    <HelpCircle className="w-4 h-4 text-slate-400 mx-auto mb-1.5" />
                    To resolve this pair, look for the item in the <strong>Pending Duplicate Review Queue</strong> above.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!mergeConfirmTarget}
        title="Confirm duplicate merge resolution"
        message={
          mergeConfirmTarget
            ? `Mark "${mergeConfirmTarget.name}" as merged duplicate into candidate "${mergeConfirmTarget.duplicate_review?.candidate_waterpoint_name ?? mergeConfirmTarget.duplicate_review?.candidate_waterpoint_id}"?`
            : ''
        }
        confirmLabel="Yes, mark as merged"
        confirmVariant="danger"
        loading={resolvingId === mergeConfirmTarget?.id}
        onCancel={() => setMergeConfirmTarget(null)}
        onConfirm={() => {
          if (!mergeConfirmTarget) return;
          void resolveItem(mergeConfirmTarget, 'merge');
          setMergeConfirmTarget(null);
        }}
      />
    </div>
  );
}

// KPI Subcomponent
function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
  desc,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: 'amber' | 'teal' | 'red' | 'slate';
  desc: string;
}) {
  const containerClass = {
    amber: 'border-amber-100 bg-gradient-to-br from-amber-500/5 to-orange-500/5 hover:border-amber-300 hover:shadow-amber-50/40',
    teal: 'border-emerald-100 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 hover:border-emerald-300 hover:shadow-emerald-50/40',
    red: 'border-rose-100 bg-gradient-to-br from-rose-500/5 to-pink-500/5 hover:border-rose-300 hover:shadow-rose-50/40',
    slate: 'border-indigo-100 bg-gradient-to-br from-indigo-500/5 to-blue-500/5 hover:border-indigo-300 hover:shadow-indigo-50/40',
  }[tone];

  const iconClass = {
    amber: 'text-amber-600 bg-amber-100/60',
    teal: 'text-emerald-600 bg-emerald-100/60',
    red: 'text-rose-600 bg-rose-100/60',
    slate: 'text-indigo-600 bg-indigo-100/60',
  }[tone];

  const textClass = {
    amber: 'text-amber-800',
    teal: 'text-emerald-800',
    red: 'text-rose-800',
    slate: 'text-indigo-800',
  }[tone];

  return (
    <div className={`rounded-2xl border p-4 transition-all duration-300 hover:shadow-md hover:scale-[1.02] flex items-center justify-between gap-4 ${containerClass}`}>
      <div className="space-y-1">
        <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">{label}</p>
        <p className={`text-3xl font-extrabold tracking-tight ${textClass}`}>{value}</p>
        <p className="text-[10px] text-slate-400 font-medium">{desc}</p>
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${iconClass}`}>
        <Icon className="w-5.5 h-5.5" />
      </div>
    </div>
  );
}
