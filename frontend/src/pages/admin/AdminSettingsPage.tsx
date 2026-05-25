import { useEffect, useState } from 'react';
import {
  Settings,
  ShieldAlert,
  Loader2,
  Save,
  Undo2,
  HelpCircle as InfoIcon,
  CircleDot,
  Settings2,
} from 'lucide-react';
import { settingsApi, type SystemSettings } from '../../lib/settingsApi';
import { useToast } from '../../components/ui/ToastProvider';
import { ApiError } from '../../lib/apiClient';

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dbSettings, setDbSettings] = useState<SystemSettings | null>(null);
  
  // Form states
  const [minDist, setMinDist] = useState<number>(10);
  const [reviewDist, setReviewDist] = useState<number>(30);
  const [auditDist, setAuditDist] = useState<number>(50);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res = await settingsApi.getSettings();
        setDbSettings(res.settings);
        setMinDist(res.settings.waterpointMinDistanceMeters);
        setReviewDist(res.settings.waterpointReviewDistanceMeters);
        setAuditDist(res.settings.waterpointAuditDistanceMeters);
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Failed to load system settings.';
        toast('error', message);
      } finally {
        setLoading(false);
      }
    };

    void fetchSettings();
  }, [toast]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (minDist > reviewDist) {
      toast('error', 'Auto-flagging threshold cannot be larger than the review threshold.');
      return;
    }
    setSaving(true);
    try {
      const res = await settingsApi.updateSettings({
        waterpointMinDistanceMeters: minDist,
        waterpointReviewDistanceMeters: reviewDist,
        waterpointAuditDistanceMeters: auditDist,
      });
      setDbSettings(res.settings);
      toast('success', 'System settings saved successfully.');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to save settings.';
      toast('error', message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (dbSettings) {
      setMinDist(dbSettings.waterpointMinDistanceMeters);
      setReviewDist(dbSettings.waterpointReviewDistanceMeters);
      setAuditDist(dbSettings.waterpointAuditDistanceMeters);
      toast('warning', 'Settings reset to last saved values.');
    }
  };

  const hasChanges = dbSettings && (
    minDist !== dbSettings.waterpointMinDistanceMeters ||
    reviewDist !== dbSettings.waterpointReviewDistanceMeters ||
    auditDist !== dbSettings.waterpointAuditDistanceMeters
  );

  // SVG radius scaling (minDist up to 500, reviewDist up to 2000)
  const maxVisualDist = Math.max(auditDist, reviewDist, 100);
  const getVisualRadius = (distance: number) => {
    // base scaling factor
    const percentage = Math.min(100, Math.max(10, (distance / maxVisualDist) * 100));
    return percentage * 0.9; // scale slightly down to fit SVG padding
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-500">Loading system settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="font-heading font-800 text-3xl text-slate-900 tracking-tight flex items-center gap-2.5">
          <span className="p-2 bg-brand-50 text-brand-600 rounded-xl border border-brand-100/50">
            <Settings className="w-6 h-6" />
          </span>
          System Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure administrative behaviors, proximity duplication policies, and system thresholds.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Settings Form */}
        <form onSubmit={(e) => void handleSave(e)} className="md:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-brand-600" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">Duplicate & Proximity Control</h2>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Settings governing automated quality and duplicate flagging.
                </p>
              </div>
            </div>

            {/* Inputs Body */}
            <div className="p-5 space-y-5">
              {/* Auto Flagging Threshold */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="minDist" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <CircleDot className="w-3.5 h-3.5 text-red-500" />
                    Auto-Flagging Range (Critical)
                  </label>
                  <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                    {minDist}m
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  New submissions closer than this distance to an existing waterpoint are automatically flagged as duplicates, regardless of community name match.
                </p>
                <div className="flex items-center gap-4">
                  <input
                    id="minDist"
                    type="range"
                    min="1"
                    max="100"
                    value={minDist}
                    onChange={(e) => setMinDist(Number(e.target.value))}
                    className="flex-1 accent-teal-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                  />
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={minDist}
                    onChange={(e) => setMinDist(Math.max(1, Math.min(500, Number(e.target.value))))}
                    className="w-16 px-2 py-1 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg text-center outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Review Threshold */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="reviewDist" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <CircleDot className="w-3.5 h-3.5 text-amber-500" />
                    Review Range (Same Community)
                  </label>
                  <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                    {reviewDist}m
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Submissions within this range of an existing waterpoint *and* located in the same community will be flagged for review.
                </p>
                <div className="flex items-center gap-4">
                  <input
                    id="reviewDist"
                    type="range"
                    min="10"
                    max="200"
                    value={reviewDist}
                    onChange={(e) => setReviewDist(Number(e.target.value))}
                    className="flex-1 accent-teal-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                  />
                  <input
                    type="number"
                    min="10"
                    max="2000"
                    value={reviewDist}
                    onChange={(e) => setReviewDist(Math.max(10, Math.min(2000, Number(e.target.value))))}
                    className="w-16 px-2 py-1 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg text-center outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Default Audit Distance */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="auditDist" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <CircleDot className="w-3.5 h-3.5 text-teal-500" />
                    Default Audit Scope Range
                  </label>
                  <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                    {auditDist}m
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  The default scan radius (in meters) when generating database-wide proximity alerts on the Data Integrity dashboard.
                </p>
                <div className="flex items-center gap-4">
                  <input
                    id="auditDist"
                    type="range"
                    min="10"
                    max="300"
                    value={auditDist}
                    onChange={(e) => setAuditDist(Number(e.target.value))}
                    className="flex-1 accent-teal-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                  />
                  <input
                    type="number"
                    min="10"
                    max="2000"
                    value={auditDist}
                    onChange={(e) => setAuditDist(Math.max(10, Math.min(2000, Number(e.target.value))))}
                    className="w-16 px-2 py-1 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg text-center outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleReset}
                disabled={!hasChanges || saving}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-700 hover:bg-white active:bg-slate-100 rounded-xl disabled:opacity-50 transition-all shadow-sm"
              >
                <Undo2 className="w-3.5 h-3.5" />
                Reset Defaults
              </button>

              <button
                type="submit"
                disabled={!hasChanges || saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-xs font-bold text-white rounded-xl disabled:opacity-50 transition-all shadow-md"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Save Configuration
              </button>
            </div>
          </div>
        </form>

        {/* Visualizer Panel */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 flex flex-col items-center justify-center min-h-[300px]">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 self-start flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-brand-600" />
              Proximity Visualizer
            </h3>
            <p className="text-[11px] text-slate-400 mb-6 text-center self-start">
              Concentric circles showing proximity policy bounds from a central water point.
            </p>

            {/* SVG Visualizer */}
            <div className="relative w-full aspect-square max-w-[240px] border border-slate-100 rounded-full flex items-center justify-center bg-slate-50/50 shadow-inner">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                {/* Center dot representing existing waterpoint */}
                <circle cx="50" cy="50" r="1.5" className="fill-brand-600 stroke-white stroke-[0.5]" />
                
                {/* Auto flagging outer circle */}
                <circle
                  cx="50"
                  cy="50"
                  r={getVisualRadius(minDist) / 2}
                  className="fill-red-50/20 stroke-red-400 stroke-[0.75] stroke-dashed transition-all duration-300"
                />
                
                {/* Same community review circle */}
                <circle
                  cx="50"
                  cy="50"
                  r={getVisualRadius(reviewDist) / 2}
                  className="fill-amber-50/10 stroke-amber-400 stroke-[0.75] transition-all duration-300"
                />

                {/* Audit bounds circle */}
                <circle
                  cx="50"
                  cy="50"
                  r={getVisualRadius(auditDist) / 2}
                  className="fill-teal-50/5 stroke-teal-300 stroke-[0.5] stroke-dashed transition-all duration-300"
                />
              </svg>

              {/* Labels overlay */}
              <div className="absolute bottom-2 text-[9px] font-bold text-slate-500 bg-white border border-slate-100 px-2 py-0.5 rounded-full shadow-sm flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Auto-Flag ({minDist}m)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Review ({reviewDist}m)
                </span>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-teal-50/30 rounded-2xl border border-teal-100/50 p-4 flex gap-3 text-xs text-teal-800">
            <InfoIcon className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Dynamic Evaluation</p>
              <p className="text-teal-900/80 leading-relaxed">
                Updating these settings affects new waterpoint registrations immediately. Existing listings and logs are not deleted, but scanning filters on the Data Integrity page will adjust instantly to the new bounds.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
