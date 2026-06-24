import { useEffect, useState } from 'react';
import { getAdminOverview } from '../../lib/analyticsApi';
import type { Waterpoint, WaterpointStatus } from '../../lib/types';
import {
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  Droplets,
  ArrowUpRight,
  Clock,
  TrendingUp,
  Activity,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalWaterpoints: number;
  functional: number;
  faulty: number;
  underRepair: number;
  totalReports: number;
  pendingReports: number;
  verifiedReports: number;
  resolvedReports: number;
  dismissedReports: number;
}

// ─── Count-up hook ────────────────────────────────────────────────────────────

function useCountUp(target: number, active: boolean, delay = 0): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf: number;
    const timer = setTimeout(() => {
      const t0 = performance.now();
      const dur = 950;
      const tick = (now: number) => {
        const p = Math.min((now - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3); // cubic ease-out
        setVal(Math.round(eased * target));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => { clearTimeout(timer); cancelAnimationFrame(raf); };
  }, [target, active, delay]);
  return val;
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────

function DonutChart({
  functional,
  faulty,
  underRepair,
  total,
  animate,
}: {
  functional: number;
  faulty: number;
  underRepair: number;
  total: number;
  animate: boolean;
}) {
  const S = 196;
  const SW = 20;
  const R = (S - SW) / 2;
  const C = 2 * Math.PI * R;
  const CX = S / 2;
  const CY = S / 2;

  const activeSegments = [functional, faulty, underRepair].filter((v) => v > 0).length;
  // 4° gap between each segment converted to arc-length
  const GAP = activeSegments > 1 ? (4 / 360) * C : 0;

  const raw = [
    { v: functional,  color: '#2dd4bf' }, // teal-400
    { v: faulty,      color: '#fb7185' }, // rose-400
    { v: underRepair, color: '#fbbf24' }, // amber-400
  ];

  let angle = -90;
  const arcs = raw.map((seg) => {
    const pct = total > 0 ? seg.v / total : 0;
    const arcLen = Math.max(pct * C - (seg.v > 0 ? GAP : 0), 0);
    const rot = angle;
    angle += pct * 360;
    return { color: seg.color, arcLen, rot };
  });

  const opPct = total > 0 ? Math.round((functional / total) * 100) : 0;

  return (
    <div className="relative flex-shrink-0" style={{ width: S, height: S }}>
      <svg width={S} height={S}>
        {/* Background ring */}
        <circle
          cx={CX} cy={CY} r={R}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={SW}
        />
        {total > 0 && arcs.map((arc, i) =>
          arc.arcLen <= 0 ? null : (
            <circle
              key={i}
              cx={CX} cy={CY} r={R}
              fill="none"
              stroke={arc.color}
              strokeWidth={SW}
              strokeLinecap="butt"
              strokeDasharray={animate ? `${arc.arcLen} ${C}` : `0 ${C}`}
              transform={`rotate(${arc.rot} ${CX} ${CY})`}
              style={{
                transition: `stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1) ${i * 160}ms`,
              }}
            />
          )
        )}
      </svg>

      {/* Centre label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
        <span className="font-heading text-4xl font-extrabold text-slate-900 tracking-tight leading-none tabular-nums">
          {opPct}
          <span className="text-2xl font-semibold text-slate-400">%</span>
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mt-1.5">
          operational
        </span>
      </div>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

type Accent = 'teal' | 'rose' | 'amber' | 'cyan';

const accentStyles: Record<Accent, {
  iconBox: string;
  glow: string;
  subtext: string;
  bar: string;
}> = {
  teal: {
    iconBox: 'bg-teal-50 border-teal-200/70 text-teal-600',
    glow:    'from-teal-500/[0.05] via-transparent to-transparent',
    subtext: 'text-teal-600',
    bar:     'bg-teal-400',
  },
  rose: {
    iconBox: 'bg-rose-50 border-rose-200/70 text-rose-600',
    glow:    'from-rose-500/[0.05] via-transparent to-transparent',
    subtext: 'text-rose-600',
    bar:     'bg-rose-400',
  },
  amber: {
    iconBox: 'bg-amber-50 border-amber-200/70 text-amber-600',
    glow:    'from-amber-500/[0.05] via-transparent to-transparent',
    subtext: 'text-amber-600',
    bar:     'bg-amber-400',
  },
  cyan: {
    iconBox: 'bg-cyan-50 border-cyan-200/70 text-cyan-600',
    glow:    'from-cyan-500/[0.05] via-transparent to-transparent',
    subtext: 'text-cyan-600',
    bar:     'bg-cyan-400',
  },
};

function KpiCard({
  label,
  value,
  icon: Icon,
  accent,
  subtext,
  loading,
}: {
  label: string;
  value: number;
  icon: typeof MapPin;
  accent: Accent;
  subtext?: string;
  loading: boolean;
}) {
  const s = accentStyles[accent];
  return (
    <div className="relative bg-white rounded-2xl border border-slate-200/80 p-5 overflow-hidden hover:shadow-lg hover:shadow-slate-100 transition-shadow duration-200">
      {/* Subtle gradient bleed from top-left */}
      <div className={`absolute inset-0 bg-gradient-to-br ${s.glow} pointer-events-none`} />

      <div className="relative flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${s.iconBox}`}>
          <Icon className="w-5 h-5" />
        </div>
        <TrendingUp className="w-3.5 h-3.5 text-slate-200" />
      </div>

      <div className="relative">
        {loading ? (
          <div className="h-9 w-20 rounded-lg bg-slate-100 animate-pulse" />
        ) : (
          <p className="font-heading text-3xl font-extrabold text-slate-900 tracking-tight leading-none tabular-nums">
            {value.toLocaleString()}
          </p>
        )}
        <p className="text-xs font-medium text-slate-500 mt-2">{label}</p>
        {subtext && !loading && (
          <p className={`text-xs font-semibold mt-0.5 ${s.subtext}`}>{subtext}</p>
        )}
      </div>
    </div>
  );
}

// ─── Report Pipeline Row ──────────────────────────────────────────────────────

function PipelineRow({
  label,
  count,
  detail,
  colorClass,
  dotClass,
  loading,
}: {
  label: string;
  count: number;
  detail: string;
  colorClass: string;
  dotClass: string;
  loading: boolean;
}) {
  return (
    <div className={`flex items-center justify-between px-4 py-3.5 rounded-xl border ${colorClass}`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotClass}`} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{label}</p>
          <p className="text-xs text-slate-400">{detail}</p>
        </div>
      </div>
      {loading ? (
        <div className="h-7 w-10 rounded-lg bg-slate-100 animate-pulse flex-shrink-0" />
      ) : (
        <span className="text-2xl font-extrabold tabular-nums text-slate-900 tracking-tight flex-shrink-0">
          {count}
        </span>
      )}
    </div>
  );
}

// ─── Table Skeleton ───────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="p-6 space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-slate-100 animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-slate-100 rounded-md animate-pulse w-1/3" />
            <div className="h-2.5 bg-slate-100 rounded-md animate-pulse w-1/5" />
          </div>
          <div className="h-6 w-24 bg-slate-100 rounded-full animate-pulse" />
          <div className="h-4 w-16 bg-slate-100 rounded-md animate-pulse" />
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats>({
    totalWaterpoints: 0,
    functional:       0,
    faulty:           0,
    underRepair:      0,
    totalReports:     0,
    pendingReports:   0,
    verifiedReports:  0,
    resolvedReports:  0,
    dismissedReports: 0,
  });
  const [recentWaterpoints, setRecentWaterpoints] = useState<Waterpoint[]>([]);
  const [loading, setLoading]   = useState(true);
  const [animate, setAnimate]   = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const overview = await getAdminOverview();
        const s = overview.stats;
        setStats({
          totalWaterpoints: s.totalWaterpoints,
          functional:       s.functional,
          faulty:           s.faulty,
          underRepair:      s.underRepair,
          totalReports:     s.totalReports,
          pendingReports:   s.pendingReports,
          verifiedReports:  s.verifiedReports,
          resolvedReports:  s.resolvedReports,
          dismissedReports: s.dismissedReports ?? Math.max(
            0,
            s.totalReports - s.pendingReports - s.verifiedReports - s.resolvedReports,
          ),
        });
        setRecentWaterpoints(overview.recentWaterpoints as Waterpoint[]);
      } catch {
        setRecentWaterpoints([]);
      }
      setLoading(false);
    }
    load();
  }, []);

  // Trigger animations shortly after data loads
  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setAnimate(true), 120);
      return () => clearTimeout(t);
    }
  }, [loading]);

  // Animated counters (staggered)
  const totalWp    = useCountUp(stats.totalWaterpoints, animate, 0);
  const funcCount  = useCountUp(stats.functional,       animate, 80);
  const faultCount = useCountUp(stats.faulty,           animate, 140);
  const repairCount= useCountUp(stats.underRepair,      animate, 200);

  const opPct = stats.totalWaterpoints > 0
    ? Math.round((stats.functional / stats.totalWaterpoints) * 100)
    : 0;

  const resolutionRate = stats.totalReports > 0
    ? Math.round((stats.resolvedReports / stats.totalReports) * 100)
    : 0;

  const today = new Date().toLocaleDateString('en-NG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const breakdown: Array<{
    status: WaterpointStatus;
    label: string;
    count: number;
    bar:   string;
    dot:   string;
  }> = [
    { status: 'functional',  label: 'Functional',   count: stats.functional,  bar: 'bg-teal-400',  dot: 'bg-teal-400'  },
    { status: 'faulty',      label: 'Faulty',        count: stats.faulty,      bar: 'bg-rose-400',  dot: 'bg-rose-400'  },
    { status: 'under_repair',label: 'Under Repair',  count: stats.underRepair, bar: 'bg-amber-400', dot: 'bg-amber-400' },
  ];

  const reportRows = [
    { label: 'Pending Review', count: stats.pendingReports,   detail: 'Awaiting action',   colorClass: 'bg-amber-50/70 border-amber-200/60', dotClass: 'bg-amber-400' },
    { label: 'Verified',       count: stats.verifiedReports,  detail: 'Confirmed issues',  colorClass: 'bg-blue-50/70 border-blue-200/60',   dotClass: 'bg-blue-400'  },
    { label: 'Resolved',       count: stats.resolvedReports,  detail: 'Fixed & closed',    colorClass: 'bg-teal-50/70 border-teal-200/60',   dotClass: 'bg-teal-400'  },
    { label: 'Dismissed',      count: stats.dismissedReports, detail: 'Not actioned',      colorClass: 'bg-slate-50/70 border-slate-200/60', dotClass: 'bg-slate-300' },
  ];

  const statusMap: Record<WaterpointStatus, {
    label: string;
    pill: string;
    dot: string;
  }> = {
    functional:  { label: 'Functional',   pill: 'bg-teal-50 text-teal-700 border-teal-200/60',   dot: 'bg-teal-500'  },
    faulty:      { label: 'Faulty',       pill: 'bg-rose-50 text-rose-600 border-rose-200/60',    dot: 'bg-rose-500'  },
    under_repair:{ label: 'Under Repair', pill: 'bg-amber-50 text-amber-600 border-amber-200/60', dot: 'bg-amber-400' },
  };

  return (
    <div
      className="space-y-6 lg:space-y-7"
      style={{
        opacity:   animate ? 1 : 0,
        transform: animate ? 'translateY(0)' : 'translateY(6px)',
        transition: 'opacity 0.45s ease, transform 0.45s ease',
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            {/* Vertical accent bar */}
            <div className="w-1 h-7 rounded-full bg-gradient-to-b from-teal-400 to-cyan-500 flex-shrink-0" />
            <h1 className="font-heading font-extrabold text-2xl text-slate-900 tracking-tight">
              Dashboard Overview
            </h1>
          </div>
          <p className="text-sm text-slate-500 pl-3.5">
            Monitor water infrastructure and citizen reports across Kwara State.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 pl-3.5 sm:pl-0">
          {/* Live badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200/60">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
            </span>
            <span className="text-xs font-semibold text-teal-700">Live</span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">{today}</p>
        </div>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Water Points"
          value={totalWp}
          icon={MapPin}
          accent="cyan"
          subtext={stats.totalWaterpoints > 0 ? `${opPct}% operational` : undefined}
          loading={loading}
        />
        <KpiCard
          label="Functional"
          value={funcCount}
          icon={CheckCircle2}
          accent="teal"
          subtext={
            stats.totalWaterpoints > 0
              ? `${Math.round((stats.functional / stats.totalWaterpoints) * 100)}% of network`
              : undefined
          }
          loading={loading}
        />
        <KpiCard
          label="Faulty"
          value={faultCount}
          icon={AlertTriangle}
          accent="rose"
          subtext={
            stats.totalWaterpoints > 0
              ? `${Math.round((stats.faulty / stats.totalWaterpoints) * 100)}% of network`
              : undefined
          }
          loading={loading}
        />
        <KpiCard
          label="Under Repair"
          value={repairCount}
          icon={Wrench}
          accent="amber"
          subtext={
            stats.totalWaterpoints > 0
              ? `${Math.round((stats.underRepair / stats.totalWaterpoints) * 100)}% of network`
              : undefined
          }
          loading={loading}
        />
      </div>

      {/* ── Middle Row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Infrastructure Health */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="font-heading font-bold text-base text-slate-900 tracking-tight">
                Infrastructure Health
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Status distribution across all water points
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-center">
              <Activity className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-8">
            {/* Donut */}
            {loading ? (
              <div
                className="rounded-full bg-slate-100 animate-pulse flex-shrink-0"
                style={{ width: 196, height: 196 }}
              />
            ) : (
              <DonutChart
                functional={stats.functional}
                faulty={stats.faulty}
                underRepair={stats.underRepair}
                total={stats.totalWaterpoints}
                animate={animate}
              />
            )}

            {/* Breakdown bars */}
            <div className="flex-1 space-y-4 w-full">
              {breakdown.map(({ label, count, bar, dot }) => {
                const pct = stats.totalWaterpoints > 0
                  ? (count / stats.totalWaterpoints) * 100
                  : 0;
                return (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                        <span className="text-sm font-medium text-slate-700">{label}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-bold text-slate-900 tabular-nums">
                          {loading ? '—' : count}
                        </span>
                        <span className="text-xs text-slate-400 w-8 text-right tabular-nums">
                          {loading ? '' : `${Math.round(pct)}%`}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${bar}`}
                        style={{
                          width:      animate ? `${pct}%` : '0%',
                          transition: 'width 1s cubic-bezier(0.4,0,0.2,1) 200ms',
                        }}
                      />
                    </div>
                  </div>
                );
              })}

              {/* Summary line */}
              {!loading && stats.totalWaterpoints > 0 && (
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                  <p className="text-xs text-slate-500 leading-snug">
                    <span className="font-semibold text-teal-600">{opPct}%</span> of{' '}
                    {stats.totalWaterpoints} water points are fully operational.{' '}
                    {stats.faulty + stats.underRepair > 0 && (
                      <span className="text-slate-400">
                        {stats.faulty + stats.underRepair} need attention.
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fault Reports Pipeline */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="font-heading font-bold text-base text-slate-900 tracking-tight">
                Fault Reports
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {loading ? 'Loading…' : `${stats.totalReports} total submissions`}
              </p>
            </div>
            <Link
              to="/admin/reports"
              className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 transition-colors"
            >
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Pipeline rows */}
          <div className="space-y-2.5 flex-1">
            {reportRows.map((row) => (
              <PipelineRow
                key={row.label}
                label={row.label}
                count={row.count}
                detail={row.detail}
                colorClass={row.colorClass}
                dotClass={row.dotClass}
                loading={loading}
              />
            ))}
          </div>

          {/* Stacked progress bar */}
          {!loading && stats.totalReports > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex h-2 rounded-full overflow-hidden bg-slate-100">
                {[
                  { v: stats.pendingReports,   c: 'bg-amber-400' },
                  { v: stats.verifiedReports,  c: 'bg-blue-400'  },
                  { v: stats.resolvedReports,  c: 'bg-teal-400'  },
                  { v: stats.dismissedReports, c: 'bg-slate-300' },
                ]
                  .filter((s) => s.v > 0)
                  .map((s, i) => (
                    <div
                      key={i}
                      className={`${s.c}`}
                      style={{
                        width:      animate ? `${(s.v / stats.totalReports) * 100}%` : '0%',
                        transition: `width 0.9s cubic-bezier(0.4,0,0.2,1) ${i * 80}ms`,
                      }}
                    />
                  ))}
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-3">
                  {[
                    { label: 'Pending',          color: 'bg-amber-400' },
                    { label: 'Verified/Resolved', color: 'bg-teal-400'  },
                    { label: 'Dismissed',         color: 'bg-slate-300' },
                  ].map(({ label, color }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${color}`} />
                      <span className="text-xs text-slate-400">{label}</span>
                    </div>
                  ))}
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  {resolutionRate}% resolved
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Recently Updated Waterpoints ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        {/* Card header */}
        <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100">
          <div>
            <h2 className="font-heading font-bold text-base text-slate-900 tracking-tight">
              Recently Updated Water Points
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Latest changes across the network</p>
          </div>
          <Link
            to="/admin/waterpoints"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-teal-700 hover:bg-teal-50 border border-transparent hover:border-teal-200/60 transition-all"
          >
            Manage all <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : recentWaterpoints.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-center">
              <Droplets className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-sm text-slate-400">No water points found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  {['Name', 'Type', 'Community', 'Status', 'Updated'].map((h, i) => (
                    <th
                      key={h}
                      className={`text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 ${
                        i === 0 ? 'px-6' : i === 4 ? 'px-4 pr-6' : 'px-4'
                      } ${i === 2 ? 'hidden md:table-cell' : ''}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentWaterpoints.map((wp, i) => {
                  const s = statusMap[wp.status];
                  return (
                    <tr
                      key={wp.id}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors"
                      style={{
                        opacity:   animate ? 1 : 0,
                        transform: animate ? 'translateY(0)' : 'translateY(4px)',
                        transition: `opacity 0.4s ease ${i * 55}ms, transform 0.4s ease ${i * 55}ms, background-color 0.15s`,
                      }}
                    >
                      {/* Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100/80 flex items-center justify-center flex-shrink-0">
                            <Droplets className="w-4 h-4 text-teal-500" />
                          </div>
                          <span className="text-sm font-semibold text-slate-900 truncate max-w-[180px]">
                            {wp.name}
                          </span>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-4">
                        <span className="text-sm text-slate-500 capitalize">{wp.type}</span>
                      </td>

                      {/* Community */}
                      <td className="px-4 py-4 hidden md:table-cell">
                        <span className="text-sm text-slate-500">{wp.community}</span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.pill}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          {s.label}
                        </span>
                      </td>

                      {/* Updated */}
                      <td className="px-4 py-4 pr-6">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 whitespace-nowrap">
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          {new Date(wp.updated_at).toLocaleDateString('en-NG', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
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