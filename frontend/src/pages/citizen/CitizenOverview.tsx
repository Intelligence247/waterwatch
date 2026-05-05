import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getCitizenOverview } from '../../lib/analyticsApi';
import {
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  MessageSquare,
  Droplets,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';

interface Stats {
  totalWaterpoints: number;
  functional: number;
  faulty: number;
  underRepair: number;
  myReports: number;
  pendingReports: number;
  resolvedReports: number;
  communityComments: number;
}

export default function CitizenOverview() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalWaterpoints: 0, functional: 0, faulty: 0, underRepair: 0,
    myReports: 0, pendingReports: 0, resolvedReports: 0, communityComments: 0,
  });
  const [nearbyWaterpoints, setNearbyWaterpoints] = useState<Array<{ id: string; name: string; type: string; status: string; community: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        const overview = await getCitizenOverview();
        setStats((prev) => ({
          ...prev,
          totalWaterpoints: overview.stats.totalWaterpoints,
          functional: overview.stats.functional,
          faulty: overview.stats.faulty,
          underRepair: overview.stats.underRepair,
          myReports: overview.stats.myReports,
          pendingReports: overview.stats.pendingReports,
          resolvedReports: overview.stats.resolvedReports,
          communityComments: 0,
        }));
        const nearby = profile?.community
          ? overview.nearbyWaterpoints.filter((wp) => wp.community === profile.community)
          : overview.nearbyWaterpoints;
        setNearbyWaterpoints(nearby);
      } catch {
        setNearbyWaterpoints([]);
      }

      setLoading(false);
    }
    if (user) fetch();
  }, [user, profile]);

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; color: string; bg: string }> = {
      functional: { label: 'Functional', color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200/60' },
      faulty: { label: 'Faulty', color: 'text-red-600', bg: 'bg-red-50 border-red-200/60' },
      under_repair: { label: 'Under Repair', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200/60' },
    };
    const cfg = map[status] || map.functional;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color}`}>
        {cfg.label}
      </span>
    );
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="font-heading font-800 text-2xl text-slate-900 tracking-tight">
          Welcome back, {profile?.full_name?.split(' ')[0] || 'Citizen'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor water infrastructure and report issues in your community.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/citizen/explore"
          className="flex items-center gap-4 p-5 rounded-xl bg-white border border-slate-200 hover:shadow-md transition-all group"
        >
          <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-200/60 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-teal-700" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 group-hover:text-teal-700 transition-colors">Explore Map</p>
            <p className="text-xs text-slate-500">Find water points near you</p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-300 ml-auto group-hover:text-teal-500 transition-colors" />
        </Link>

        <Link
          to="/citizen/reports"
          className="flex items-center gap-4 p-5 rounded-xl bg-white border border-slate-200 hover:shadow-md transition-all group"
        >
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 group-hover:text-amber-600 transition-colors">Report a Fault</p>
            <p className="text-xs text-slate-500">Submit a water issue</p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-300 ml-auto group-hover:text-amber-500 transition-colors" />
        </Link>

        <Link
          to="/citizen/community"
          className="flex items-center gap-4 p-5 rounded-xl bg-white border border-slate-200 hover:shadow-md transition-all group"
        >
          <div className="w-11 h-11 rounded-xl bg-cyan-50 border border-cyan-200/60 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-5 h-5 text-cyan-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 group-hover:text-cyan-600 transition-colors">Community Feed</p>
            <p className="text-xs text-slate-500">Discuss with neighbors</p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-300 ml-auto group-hover:text-cyan-500 transition-colors" />
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={MapPin} label="Water Points" value={stats.totalWaterpoints} accent="teal" loading={loading} />
        <StatCard icon={CheckCircle2} label="Functional" value={stats.functional} accent="teal" loading={loading} />
        <StatCard icon={AlertTriangle} label="Faulty" value={stats.faulty} accent="red" loading={loading} />
        <StatCard icon={Wrench} label="Under Repair" value={stats.underRepair} accent="amber" loading={loading} />
      </div>

      {/* Two-column section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Reports Summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading font-700 text-base text-slate-900 tracking-tight">My Reports</h2>
            <Link
              to="/citizen/reports"
              className="inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:text-teal-800 transition-colors"
            >
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="font-heading font-700 text-xl text-slate-900 tracking-tight">{stats.myReports}</p>
              <p className="text-xs text-slate-500 mt-0.5">Total</p>
            </div>
            <div className="text-center">
              <p className="font-heading font-700 text-xl text-amber-600 tracking-tight">{stats.pendingReports}</p>
              <p className="text-xs text-slate-500 mt-0.5">Pending</p>
            </div>
            <div className="text-center">
              <p className="font-heading font-700 text-xl text-teal-700 tracking-tight">{stats.resolvedReports}</p>
              <p className="text-xs text-slate-500 mt-0.5">Resolved</p>
            </div>
          </div>
        </div>

        {/* Community Activity */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading font-700 text-base text-slate-900 tracking-tight">Community Activity</h2>
            <Link
              to="/citizen/community"
              className="inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:text-teal-800 transition-colors"
            >
              View feed <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-200/60 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-cyan-600" />
            </div>
            <div>
              <p className="font-heading font-700 text-xl text-slate-900 tracking-tight">{stats.communityComments}</p>
              <p className="text-xs text-slate-500">Community comments</p>
            </div>
          </div>
        </div>
      </div>

      {/* Nearby Waterpoints */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading font-700 text-base text-slate-900 tracking-tight">
            {profile?.community ? `Water Points in ${profile.community}` : 'Water Points'}
          </h2>
          <Link
            to="/citizen/explore"
            className="inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:text-teal-800 transition-colors"
          >
            Explore map <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : nearbyWaterpoints.length === 0 ? (
          <div className="text-center py-8">
            <Droplets className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No water points found in your area.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {nearbyWaterpoints.map((wp) => (
              <div
                key={wp.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <Droplets className="w-4 h-4 text-teal-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{wp.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{wp.type}</p>
                </div>
                {statusBadge(wp.status)}
              </div>
            ))}
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
  loading,
}: {
  icon: typeof MapPin;
  label: string;
  value: number;
  accent: 'teal' | 'red' | 'amber' | 'cyan';
  loading: boolean;
}) {
  const colors = {
    teal: 'bg-teal-50 border-teal-200/60 text-teal-700',
    red: 'bg-red-50 border-red-200/60 text-red-600',
    amber: 'bg-amber-50 border-amber-200/60 text-amber-600',
    cyan: 'bg-cyan-50 border-cyan-200/60 text-cyan-600',
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
      </div>
    </div>
  );
}
