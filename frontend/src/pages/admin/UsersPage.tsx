import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  ChevronDown,
  ChevronRight,
  Shield,
  Clock,
  MapPin,
  Phone,
  AlertTriangle,
  Loader2,
  Ban,
  Activity,
  CheckCircle,
  XCircle,
  ChevronLeft,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/ToastProvider';
import { listUsers, updateUserStatus, type UserListParams } from '../../lib/usersApi';
import type { User, UserStatus } from '../../lib/types';
import { ApiError } from '../../lib/apiClient';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  // State
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'admin' | 'citizen' | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'fullName' | 'email'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Status Action Modal State
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [actionStatus, setActionStatus] = useState<UserStatus | null>(null);
  const [reason, setReason] = useState('');
  const [updating, setUpdating] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    suspended: 0,
    blocked: 0,
  });

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: UserListParams = {
        page,
        limit,
        sortBy,
        sortOrder,
      };

      if (search.trim()) params.q = search.trim();
      if (roleFilter !== 'all') params.role = roleFilter;
      if (statusFilter !== 'all') params.status = statusFilter;

      const data = await listUsers(params);
      setUsers(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to fetch users';
      toast('error', msg);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, roleFilter, statusFilter, sortBy, sortOrder, toast]);

  // Load stats dynamically from database
  const fetchStats = useCallback(async () => {
    try {
      // Run quick lightweight requests to get totals
      const [totalRes, activeRes, suspendedRes, blockedRes] = await Promise.all([
        listUsers({ limit: 1 }),
        listUsers({ status: 'active', limit: 1 }),
        listUsers({ status: 'suspended', limit: 1 }),
        listUsers({ status: 'blocked', limit: 1 }),
      ]);

      setStats({
        total: totalRes.total,
        active: activeRes.total,
        suspended: suspendedRes.total,
        blocked: blockedRes.total,
      });
    } catch {
      // Fallback silently if stats fetch fails
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  // Trigger search on typing (can be debounced)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page
  };

  const handleRoleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleFilter(e.target.value as 'admin' | 'citizen' | 'all');
    setPage(1);
  };

  const handleStatusTabChange = (status: UserStatus | 'all') => {
    setStatusFilter(status);
    setPage(1);
  };

  // Open confirmation modal for block/suspend
  const initiateStatusChange = (u: User, newStatus: UserStatus) => {
    if (u.id === currentUser?.id) {
      toast('error', 'You cannot modify your own administrator account status.');
      return;
    }
    setTargetUser(u);
    setActionStatus(newStatus);
    setReason('');
  };

  // Confirm and save status change
  const handleConfirmStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser || !actionStatus) return;

    if (actionStatus !== 'active' && !reason.trim()) {
      toast('warning', 'Please provide a reason for this account action.');
      return;
    }

    setUpdating(true);
    try {
      const res = await updateUserStatus(targetUser.id, {
        status: actionStatus,
        reason: actionStatus === 'active' ? null : reason.trim(),
      });

      toast('success', res.message);
      setTargetUser(null);
      setActionStatus(null);
      setReason('');

      // Refresh data
      void fetchUsers();
      void fetchStats();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to update user status';
      toast('error', msg);
    } finally {
      setUpdating(false);
    }
  };

  // Quick activation with no modal
  const handleQuickActivate = async (u: User) => {
    if (u.id === currentUser?.id) return;
    setLoading(true);
    try {
      const res = await updateUserStatus(u.id, {
        status: 'active',
      });
      toast('success', res.message);
      void fetchUsers();
      void fetchStats();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to activate user';
      toast('error', msg);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title Header */}
      <div>
        <h1 className="font-heading font-800 text-2xl text-slate-900 tracking-tight flex items-center gap-2">
          <Users className="w-7 h-7 text-teal-600" />
          User Management
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor registered system accounts, review communities, and handle administrative actions like suspension or blocking.
        </p>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Users</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">{stats.total}</p>
          </div>
        </div>

        {/* Card 2: Active */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-green-700 flex-shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">{stats.active}</p>
          </div>
        </div>

        {/* Card 3: Suspended */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Suspended</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">{stats.suspended}</p>
          </div>
        </div>

        {/* Card 4: Blocked */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-700 flex-shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Blocked</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">{stats.blocked}</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-100 space-y-4">
          {/* Top Row: Search and Select Options */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
              <input
                type="text"
                value={search}
                onChange={handleSearchChange}
                placeholder="Search users by name, email, or community..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-700"
              />
            </div>

            {/* Select options wrapper */}
            <div className="flex gap-2.5">
              {/* Role Select */}
              <div className="relative w-36">
                <select
                  value={roleFilter}
                  onChange={handleRoleFilterChange}
                  className="w-full appearance-none pl-3.5 pr-9 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Administrators</option>
                  <option value="citizen">Citizens</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Sorting Select */}
              <div className="relative w-40">
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field as any);
                    setSortOrder(order as any);
                  }}
                  className="w-full appearance-none pl-3.5 pr-9 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  <option value="createdAt-desc">Newest Joined</option>
                  <option value="createdAt-asc">Oldest Joined</option>
                  <option value="fullName-asc">Name A-Z</option>
                  <option value="fullName-desc">Name Z-A</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Bottom Row: Status Tabs */}
          <div className="flex border-b border-slate-100 -mx-4 px-4 overflow-x-auto scrollbar-none">
            <div className="flex gap-6">
              {(['all', 'active', 'suspended', 'blocked'] as const).map((status) => {
                const isActive = statusFilter === status;
                const label = status.charAt(0).toUpperCase() + status.slice(1);
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleStatusTabChange(status)}
                    className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 flex-shrink-0 ${
                      isActive
                        ? 'border-teal-600 text-teal-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Table / List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-7 h-7 text-teal-600 animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-600">No users found</p>
            <p className="text-xs text-slate-400 mt-1">Try modifying your search query or filter options.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">User Details</th>
                  <th className="px-6 py-4">System Role</th>
                  <th className="px-6 py-4">Location / Contact</th>
                  <th className="px-6 py-4">Joined Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Account Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {users.map((u) => {
                  const isSelf = u.id === currentUser?.id;

                  // Status Badge Formatting
                  let statusClass = 'bg-green-50 text-green-700 border-green-200/60';
                  if (u.status === 'suspended') {
                    statusClass = 'bg-amber-50 text-amber-700 border-amber-200/60';
                  } else if (u.status === 'blocked') {
                    statusClass = 'bg-red-50 text-red-700 border-red-200/60';
                  }

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/40 transition-colors">
                      {/* Name / Email Avatar */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-800 font-bold text-sm uppercase flex-shrink-0">
                            {u.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                              {u.fullName}
                              {isSelf && (
                                <span className="inline-flex px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* System Role */}
                      <td className="px-6 py-4">
                        {u.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                            <Shield className="w-3 h-3" />
                            Administrator
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-100">
                            <Activity className="w-3 h-3" />
                            Citizen Reporter
                          </span>
                        )}
                      </td>

                      {/* Community / Contact */}
                      <td className="px-6 py-4">
                        {u.role === 'citizen' ? (
                          <div className="space-y-1">
                            {u.community && (
                              <p className="text-slate-600 flex items-center gap-1 text-xs">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                {u.community}
                              </p>
                            )}
                            {u.phone && (
                              <p className="text-slate-400 flex items-center gap-1 text-xs">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {u.phone}
                              </p>
                            )}
                            {!u.community && !u.phone && <span className="text-slate-400 text-xs">—</span>}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-slate-500 text-xs">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(u.createdAt).toLocaleDateString('en-NG', {
                            dateStyle: 'medium',
                          })}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-4">
                        <div>
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${statusClass} uppercase`}>
                            {u.status}
                          </span>
                          {u.status !== 'active' && u.statusReason && (
                            <p className="text-[10px] text-slate-400 italic mt-1 max-w-[150px] truncate" title={u.statusReason}>
                              "{u.statusReason}"
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Account Actions */}
                      <td className="px-6 py-4 text-right">
                        {isSelf ? (
                          <span className="text-xs text-slate-400 italic font-medium">No actions</span>
                        ) : (
                          <div className="flex justify-end gap-2">
                            {u.status === 'active' ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => initiateStatusChange(u, 'suspended')}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-200 text-xs font-semibold text-amber-600 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                                >
                                  Suspend
                                </button>
                                <button
                                  type="button"
                                  onClick={() => initiateStatusChange(u, 'blocked')}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                                >
                                  Block
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleQuickActivate(u)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-green-200 text-xs font-semibold text-green-600 hover:bg-green-50 hover:text-green-700 transition-colors"
                                >
                                  Activate
                                </button>
                                {u.status === 'suspended' && (
                                  <button
                                    type="button"
                                    onClick={() => initiateStatusChange(u, 'blocked')}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                                  >
                                    Block
                                  </button>
                                )}
                                {u.status === 'blocked' && (
                                  <button
                                    type="button"
                                    onClick={() => initiateStatusChange(u, 'suspended')}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-200 text-xs font-semibold text-amber-600 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                                  >
                                    Suspend
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">
              Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} of {total} users
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Account Action Status Modal */}
      {targetUser && actionStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => {
              if (!updating) {
                setTargetUser(null);
                setActionStatus(null);
              }
            }}
          />

          {/* Modal Container */}
          <div className="relative bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md p-6 overflow-hidden">
            <div className="flex items-start gap-4">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  actionStatus === 'blocked'
                    ? 'bg-red-50 text-red-600 border border-red-100'
                    : 'bg-amber-50 text-amber-600 border border-amber-100'
                }`}
              >
                {actionStatus === 'blocked' ? <Ban className="w-5.5 h-5.5" /> : <AlertTriangle className="w-5.5 h-5.5" />}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-800 text-lg text-slate-900 tracking-tight">
                  {actionStatus === 'blocked' ? 'Block Account' : 'Suspend Account'}
                </h3>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  You are about to {actionStatus} the account belonging to{' '}
                  <span className="font-bold text-slate-800">{targetUser.fullName}</span> ({targetUser.email}).
                  {actionStatus === 'blocked'
                    ? ' This will immediately log the user out and block them from logging back in or using the app.'
                    : ' This will temporarily disable their account privileges until reactivated.'}
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmStatusChange} className="mt-5 space-y-4">
              <div>
                <label htmlFor="action-reason" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Reason for {actionStatus === 'blocked' ? 'blocking' : 'suspending'}
                </label>
                <textarea
                  id="action-reason"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Specify the exact reason (e.g. reported for posting duplicate/spam reports, profile abuse)..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-700 placeholder-slate-400"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => {
                    setTargetUser(null);
                    setActionStatus(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-60 ${
                    actionStatus === 'blocked' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {updating && <Loader2 className="w-4 h-4 animate-spin" />}
                  {actionStatus === 'blocked' ? 'Block Account' : 'Suspend Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
