import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Waterpoint, WaterpointStatus } from '../../lib/types';
import {
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  TrendingUp,
  Droplets,
  ArrowUpRight,
  Clock,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardStats {
  totalWaterpoints: number;
  functional: number;
  faulty: number;
  underRepair: number;
  totalReports: number;
  pendingReports: number;
  verifiedReports: number;
  resolvedReports: number;
}

const statusConfig: Record<WaterpointStatus, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  functional: { label: 'Functional', color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200/60', icon: CheckCircle2 },
  faulty: { label: 'Faulty', color: 'text-red-600', bg: 'bg-red-50 border-red-200/60', icon: AlertTriangle },
  under_repair: { label: 'Under Repair', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200/60', icon: Wrench },
};

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats>({
    totalWaterpoints: 0, functional: 0, faulty: 0, underRepair: 0,
    totalReports: 0, pendingReports: 0, verifiedReports: 0, resolvedReports: 0,
  });
  const [recentWaterpoints, setRecentWaterpoints] = useState<Waterpoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      const [wpRes, rptRes, recentRes] = await Promise.all([
        supabase.from('waterpoints').select('status'),
        supabase.from('fault_reports').select('status'),
        supabase.from('waterpoints').select('*').order('updated_at', { ascending: false }).limit(5),
      ]);

      const wps = wpRes.data || [];
      const rpts = rptRes.data || [];

      setStats({
        totalWaterpoints: wps.length,
        functional: wps.filter((w: { status: string }) => w.status === 'functional').length,
        faulty: wps.filter((w: { status: string }) => w.status === 'faulty').length,
        underRepair: wps.filter((w: { status: string }) => w.status === 'under_repair').length,
        totalReports: rpts.length,
        pendingReports: rpts.filter((r: { status: string }) => r.status === 'pending').length,
        verifiedReports: rpts.filter((r: { status: string }) => r.status === 'verified').length,
        resolvedReports: rpts.filter((r: { status: string }) => r.status === 'resolved').length,
      });

      setRecentWaterpoints((recentRes.data as Waterpoint[]) || []);
      setLoading(false);
    }
    fetch();
  }, []);

  const functionalPct = stats.totalWaterpoints > 0 ? Math.round((stats.functional / stats.totalWaterpoints) * 100) : 0;

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Page title */}
      <div>
        <h1 className="font-heading font-800 text-2xl text-slate-900 tracking-tight">Dashboard Overview</h1>
        <p className="text-sm text-slate-500 mt-1">Monitor water infrastructure and citizen reports across Kwara State.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={MapPin}
          label="Total Water Points"
          value={stats.totalWaterpoints}
          accent="teal"
          loading={loading}
        />
        <StatCard
          icon={CheckCircle2}
          label="Functional"
          value={stats.functional}
          accent="teal"
          subtext={`${functionalPct}% operational`}
          loading={loading}
        />
        <StatCard
          icon={AlertTriangle}
          label="Faulty"
          value={stats.faulty}
          accent="red"
          loading={loading}
        />
        <StatCard
          icon={Wrench}
          label="Under Repair"
          value={stats.underRepair}
          accent="amber"
          loading={loading}
        />
      </div>

      {/* Two-column section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Breakdown */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-heading font-700 text-base text-slate-900 tracking-tight mb-5">Status Breakdown</h2>
          <div className="space-y-4">
            {(['functional', 'faulty', 'under_repair'] as WaterpointStatus[]).map((status) => {
              const cfg = statusConfig[status];
              const count = status === 'functional' ? stats.functional : status === 'faulty' ? stats.faulty : stats.underRepair;
              const pct = stats.totalWaterpoints > 0 ? Math.round((count / stats.totalWaterpoints) * 100) : 0;
              const Icon = cfg.icon;
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                      <span className="text-sm font-medium text-slate-700">{cfg.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{count}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        status === 'functional' ? 'bg-teal-500' : status === 'faulty' ? 'bg-red-400' : 'bg-amber-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fault Reports Summary */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading font-700 text-base text-slate-900 tracking-tight">Fault Reports</h2>
            <Link
              to="/admin/reports"
              className="inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:text-teal-800 transition-colors"
            >
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <MiniStat label="Total" value={stats.totalReports} />
            <MiniStat label="Pending" value={stats.pendingReports} accent="amber" />
            <MiniStat label="Verified" value={stats.verifiedReports} accent="teal" />
            <MiniStat label="Resolved" value={stats.resolvedReports} accent="teal" />
          </div>

          {/* Quick report status bar */}
          <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-slate-100">
            {stats.totalReports > 0 && (
              <>
                <div
                  className="bg-amber-400 transition-all duration-500"
                  style={{ width: `${(stats.pendingReports / stats.totalReports) * 100}%` }}
                  title={`Pending: ${stats.pendingReports}`}
                />
                <div
                  className="bg-teal-500 transition-all duration-500"
                  style={{ width: `${((stats.verifiedReports + stats.resolvedReports) / stats.totalReports) * 100}%` }}
                  title={`Verified/Resolved: ${stats.verifiedReports + stats.resolvedReports}`}
                />
                <div
                  className="bg-slate-300 transition-all duration-500"
                  style={{ width: `${(stats.totalReports - stats.pendingReports - stats.verifiedReports - stats.resolvedReports) / stats.totalReports * 100}%` }}
                  title="Dismissed"
                />
              </>
            )}
          </div>
          <div className="flex gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-xs text-slate-500">Pending</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />
              <span className="text-xs text-slate-500">Verified/Resolved</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <span className="text-xs text-slate-500">Dismissed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recently Updated Waterpoints */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading font-700 text-base text-slate-900 tracking-tight">Recently Updated Water Points</h2>
          <Link
            to="/admin/waterpoints"
            className="inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:text-teal-800 transition-colors"
          >
            Manage all <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recentWaterpoints.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No water points found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide pb-3 pr-4">Name</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide pb-3 pr-4">Type</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide pb-3 pr-4">Community</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide pb-3 pr-4">Status</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide pb-3">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentWaterpoints.map((wp) => {
                  const cfg = statusConfig[wp.status];
                  const StatusIcon = cfg.icon;
                  return (
                    <tr key={wp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2.5">
                          <Droplets className="w-4 h-4 text-teal-500 flex-shrink-0" />
                          <span className="text-sm font-medium text-slate-900">{wp.name}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-sm text-slate-600 capitalize">{wp.type}</td>
                      <td className="py-3 pr-4 text-sm text-slate-600">{wp.community}</td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(wp.updated_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}
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
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  subtext,
  loading,
}: {
  icon: typeof MapPin;
  label: string;
  value: number;
  accent: 'teal' | 'red' | 'amber';
  subtext?: string;
  loading: boolean;
}) {
  const colors = {
    teal: 'bg-teal-50 border-teal-200/60 text-teal-700',
    red: 'bg-red-50 border-red-200/60 text-red-600',
    amber: 'bg-amber-50 border-amber-200/60 text-amber-600',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${colors[accent]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <TrendingUp className="w-4 h-4 text-slate-300" />
      </div>
      <div className="mt-4">
        {loading ? (
          <div className="h-7 w-16 bg-slate-100 rounded animate-pulse" />
        ) : (
          <p className="font-heading font-800 text-2xl text-slate-900 tracking-tight">{value}</p>
        )}
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
        {subtext && <p className="text-xs text-teal-600 font-medium mt-1">{subtext}</p>}
      </div>
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: number; accent?: 'teal' | 'amber' }) {
  return (
    <div className="text-center">
      <p className={`font-heading font-700 text-xl tracking-tight ${accent === 'teal' ? 'text-teal-700' : accent === 'amber' ? 'text-amber-600' : 'text-slate-900'}`}>
        {value}
      </p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}
