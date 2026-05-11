import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, ShieldAlert } from 'lucide-react';
import { ApiError } from '../../lib/apiClient';
import { useToast } from '../../components/ui/ToastProvider';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import {
  getWaterpointDedupeAudit,
  listDuplicateReviewQueue,
  resolveDuplicateReview,
  type DuplicateAuditCandidate,
  type DuplicateAuditResponse,
} from '../../lib/waterpointsApi';
import { getDuplicateReviewInsights } from '../../lib/analyticsApi';
import type { Waterpoint } from '../../lib/types';

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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [queueRes, auditRes, insightsRes] = await Promise.all([
        listDuplicateReviewQueue({ status: 'pending_review', limit: 20, sortOrder: 'desc' }),
        getWaterpointDedupeAudit({ maxItems: 800 }),
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
  }, [toast]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const filteredCandidates = useMemo(() => {
    const all = audit?.proximityCandidates ?? [];
    if (auditFilter === 'all') return all;
    return all.filter((item) => item.recommendation === auditFilter);
  }, [audit?.proximityCandidates, auditFilter]);

  const topCandidates = useMemo(() => filteredCandidates.slice(0, 10), [filteredCandidates]);

  const selectedCandidate = useMemo(() => {
    if (!selectedCandidateKey) return topCandidates[0] ?? null;
    return (
      topCandidates.find((candidate) => `${candidate.left.id}-${candidate.right.id}` === selectedCandidateKey) ?? null
    );
  }, [selectedCandidateKey, topCandidates]);

  const resolveItem = async (item: Waterpoint, action: 'keep' | 'merge') => {
    setResolvingId(item.id);
    try {
      const mergeTargetId = item.duplicate_review?.candidate_waterpoint_id ?? undefined;
      if (action === 'merge' && !mergeTargetId) {
        toast('error', 'No merge candidate available for this record.');
        return;
      }
      await resolveDuplicateReview(item.id, {
        action,
        mergeIntoWaterpointId: mergeTargetId,
        resolutionNote:
          action === 'keep'
            ? 'Resolved via integrity workspace: distinct waterpoint retained.'
            : 'Resolved via integrity workspace: duplicate merged into candidate.',
      });
      toast('success', action === 'keep' ? 'Marked as distinct waterpoint.' : 'Marked as merged duplicate.');
      await fetchData();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to resolve duplicate review.';
      toast('error', message);
    } finally {
      setResolvingId(null);
    }
  };

  const formatCoords = (lat: number, lng: number) => `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

  const recommendationTone = (recommendation: DuplicateAuditCandidate['recommendation']) =>
    recommendation === 'hard_duplicate'
      ? 'text-red-700 bg-red-50 border-red-200'
      : recommendation === 'merge_candidate'
        ? 'text-amber-700 bg-amber-50 border-amber-200'
        : 'text-slate-700 bg-slate-50 border-slate-200';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-800 text-2xl text-slate-900 tracking-tight">Data Integrity</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review proximity duplicates, resolve conflicts, and track quality metrics.
          </p>
        </div>
        <button
          onClick={() => void fetchData()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh workspace
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        <KpiCard label="Pending Review" value={insights?.stats.pendingReview ?? 0} tone="amber" />
        <KpiCard label="Resolved Keep" value={insights?.stats.resolvedKeep ?? 0} tone="teal" />
        <KpiCard label="Resolved Merged" value={insights?.stats.resolvedMerged ?? 0} tone="red" />
        <KpiCard label="Oldest Pending (days)" value={insights?.stats.pendingOldestAgeDays ?? 0} tone="slate" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <h2 className="text-sm font-semibold text-slate-900">Pending Duplicate Review Queue</h2>
          <p className="text-xs text-slate-500 mt-1">Resolve each flagged waterpoint as distinct or merged.</p>
        </div>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
          </div>
        ) : reviewQueue.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-500">No pending duplicate reviews right now.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {reviewQueue.map((item) => (
              <div key={item.id} className="px-5 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    {item.community} • {item.type} • {item.duplicate_review?.distance_meters?.toFixed(1) ?? 'N/A'}m from candidate
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Candidate ID: {item.duplicate_review?.candidate_waterpoint_id ?? 'None'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => void resolveItem(item, 'keep')}
                    disabled={resolvingId === item.id}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-teal-200 text-teal-700 hover:bg-teal-50 disabled:opacity-60"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Keep distinct
                  </button>
                  <button
                    onClick={() => setMergeConfirmTarget(item)}
                    disabled={resolvingId === item.id || !item.duplicate_review?.candidate_waterpoint_id}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-amber-200 text-amber-700 hover:bg-amber-50 disabled:opacity-60"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Mark merged
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <h2 className="text-sm font-semibold text-slate-900">Top Audit Candidates</h2>
          <p className="text-xs text-slate-500 mt-1">
            Closest suspicious pairs from dedupe audit ({audit?.policy.auditDistanceMeters ?? 0}m threshold).
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All' },
              { id: 'hard_duplicate', label: 'Hard duplicate' },
              { id: 'merge_candidate', label: 'Merge candidate' },
              { id: 'review_candidate', label: 'Review candidate' },
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() =>
                  setAuditFilter(chip.id as 'all' | 'hard_duplicate' | 'merge_candidate' | 'review_candidate')
                }
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                  auditFilter === chip.id
                    ? 'bg-teal-50 border-teal-200 text-teal-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
          </div>
        ) : topCandidates.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-500">No high-risk pairs found in current audit scope.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {topCandidates.map((candidate) => (
              <button
                key={`${candidate.left.id}-${candidate.right.id}`}
                onClick={() => setSelectedCandidateKey(`${candidate.left.id}-${candidate.right.id}`)}
                className={`w-full text-left px-5 py-4 transition-colors ${
                  selectedCandidateKey === `${candidate.left.id}-${candidate.right.id}`
                    ? 'bg-teal-50/50'
                    : 'hover:bg-slate-50'
                }`}
              >
                <p className="text-sm font-semibold text-slate-900">
                  {candidate.left.name} ↔ {candidate.right.name}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  {candidate.left.community} • {candidate.left.type} • distance {candidate.distanceMeters.toFixed(1)}m •
                  similarity {(candidate.nameSimilarityScore * 100).toFixed(0)}%
                </p>
                <p
                  className={`text-xs mt-1 inline-flex items-center gap-1 border rounded-full px-2 py-0.5 ${recommendationTone(
                    candidate.recommendation,
                  )}`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Recommendation: {candidate.recommendation.replace('_', ' ')}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <h2 className="text-sm font-semibold text-slate-900">Candidate Comparison</h2>
          <p className="text-xs text-slate-500 mt-1">Inspect the currently selected pair side-by-side before resolving.</p>
        </div>
        {!selectedCandidate ? (
          <p className="px-5 py-8 text-sm text-slate-500">Select a candidate from the list above to compare details.</p>
        ) : (
          <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CompareCard
              title="Candidate A"
              name={selectedCandidate.left.name}
              type={selectedCandidate.left.type}
              community={selectedCandidate.left.community}
              coords={formatCoords(selectedCandidate.left.latitude, selectedCandidate.left.longitude)}
              reviewStatus={selectedCandidate.left.reviewStatus}
            />
            <CompareCard
              title="Candidate B"
              name={selectedCandidate.right.name}
              type={selectedCandidate.right.type}
              community={selectedCandidate.right.community}
              coords={formatCoords(selectedCandidate.right.latitude, selectedCandidate.right.longitude)}
              reviewStatus={selectedCandidate.right.reviewStatus}
            />
            <div className="lg:col-span-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs font-semibold text-amber-900 uppercase tracking-wide">Assessment</p>
              <p className="text-sm text-amber-900 mt-1">
                Distance: {selectedCandidate.distanceMeters.toFixed(1)}m, similarity:{' '}
                {(selectedCandidate.nameSimilarityScore * 100).toFixed(0)}%, recommendation:{' '}
                {selectedCandidate.recommendation.replace('_', ' ')}.
              </p>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!mergeConfirmTarget}
        title="Confirm duplicate merge resolution"
        message={
          mergeConfirmTarget
            ? `Mark "${mergeConfirmTarget.name}" as merged duplicate into candidate ${mergeConfirmTarget.duplicate_review?.candidate_waterpoint_id}?`
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

function CompareCard({
  title,
  name,
  type,
  community,
  coords,
  reviewStatus,
}: {
  title: string;
  name: string;
  type: string;
  community: string;
  coords: string;
  reviewStatus: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</p>
      <p className="text-sm font-semibold text-slate-900 mt-2">{name}</p>
      <div className="mt-2 text-xs text-slate-600 space-y-1">
        <p>Type: {type}</p>
        <p>Community: {community}</p>
        <p>Coordinates: {coords}</p>
        <p>Status: {reviewStatus}</p>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'amber' | 'teal' | 'red' | 'slate';
}) {
  const toneClass =
    tone === 'amber'
      ? 'bg-amber-50 border-amber-200 text-amber-700'
      : tone === 'teal'
        ? 'bg-teal-50 border-teal-200 text-teal-700'
        : tone === 'red'
          ? 'bg-red-50 border-red-200 text-red-700'
          : 'bg-slate-50 border-slate-200 text-slate-700';

  return (
    <div className={`rounded-xl border px-4 py-3 ${toneClass}`}>
      <p className="text-[11px] uppercase tracking-wide font-semibold opacity-80">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
  );
}
