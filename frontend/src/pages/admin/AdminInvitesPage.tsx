import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../../lib/apiClient';
import {
  createAdminInvite,
  listAdminInvites,
  revokeAdminInvite,
  type AdminInviteListItem,
  type AdminInviteStatusFilter,
} from '../../lib/adminInvitesApi';
import { useToast } from '../../components/ui/ToastProvider';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import {
  UserPlus,
  Loader2,
  Copy,
  Check,
  Mail,
  Clock,
  Ban,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react';

function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  return Promise.resolve();
}

export default function AdminInvitesPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [expiresInHours, setExpiresInHours] = useState(72);
  const [creating, setCreating] = useState(false);
  const [items, setItems] = useState<AdminInviteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<AdminInviteStatusFilter>('active');
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [newToken, setNewToken] = useState<{ email: string; token: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchInvites = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listAdminInvites({ status: filterStatus, limit: 50 });
      setItems(data.items);
    } catch {
      toast('error', 'Failed to load admin invites.');
      setItems([]);
    }
    setLoading(false);
  }, [filterStatus, toast]);

  useEffect(() => {
    void fetchInvites();
  }, [fetchInvites]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      toast('warning', 'Enter the invitee email address.');
      return;
    }
    setCreating(true);
    try {
      const res = await createAdminInvite({ email: trimmed, expiresInHours });
      setNewToken({ email: res.invite.email, token: res.invite.inviteToken });
      setCopied(false);
      setEmail('');
      toast(
        res.emailSent ? 'success' : 'warning',
        res.emailSent
          ? 'Invite created and emailed the token successfully.'
          : 'Invite created, but the token email could not be sent.'
      );
      void fetchInvites();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Could not create invite. Please try again.';
      toast('error', message);
    }
    setCreating(false);
  };

  const handleCopyToken = async () => {
    if (!newToken) return;
    try {
      await copyToClipboard(newToken.token);
      setCopied(true);
      toast('success', 'Token copied to clipboard.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('error', 'Could not copy. Select and copy the token manually.');
    }
  };

  const handleRevoke = async () => {
    if (!revokeId) return;
    setRevoking(true);
    try {
      await revokeAdminInvite(revokeId);
      toast('success', 'Invite revoked.');
      setRevokeId(null);
      void fetchInvites();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to revoke invite.';
      toast('error', message);
    }
    setRevoking(false);
  };

  const isActiveRow = (inv: AdminInviteListItem) =>
    !inv.usedAt && !inv.revokedAt && new Date(inv.expiresAt) > new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-800 text-2xl text-slate-900 tracking-tight">Admin invites</h1>
        <p className="text-sm text-slate-500 mt-1">
          Invite new administrators with a one-time token. They register at the hidden{' '}
          <span className="font-mono text-slate-600">/register</span> page using the same email and the token you
          provide. The token is shown only once when you create the invite.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200/70 rounded-xl p-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900">
          <p className="font-semibold">Security</p>
          <p className="mt-1 text-amber-800/90">
            Send the token through a secure channel (in person, official email, or internal tool). Do not post it on
            public pages. Revoke unused invites if they may have been exposed.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-heading font-700 text-base text-slate-900 tracking-tight mb-4 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-teal-600" />
          Create invite
        </h2>
        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-4 sm:items-end">
          <div className="flex-1 min-w-0">
            <label htmlFor="invite-email" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Invitee email
            </label>
            <input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              placeholder="new.admin@example.gov.ng"
              autoComplete="off"
            />
          </div>
          <div className="w-full sm:w-40">
            <label htmlFor="invite-expiry" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Valid for (hours)
            </label>
            <input
              id="invite-expiry"
              type="number"
              min={1}
              max={168}
              value={expiresInHours}
              onChange={(e) => setExpiresInHours(Math.min(168, Math.max(1, Number(e.target.value) || 72)))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-60"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {creating ? 'Creating…' : 'Create invite'}
          </button>
        </form>

        {newToken && (
          <div className="mt-6 p-4 rounded-xl border border-teal-200 bg-teal-50/50">
            <p className="text-sm font-semibold text-teal-900">One-time invite token for {newToken.email}</p>
            <p className="text-xs text-teal-800/80 mt-1 mb-3">
              This token is not stored in full on the server. Copy it now; you will not be able to retrieve it again.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <code className="flex-1 text-xs sm:text-sm font-mono bg-white border border-teal-200/60 rounded-lg px-3 py-2 break-all text-slate-800">
                {newToken.token}
              </code>
              <button
                type="button"
                onClick={() => void handleCopyToken()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-teal-300 bg-white text-teal-800 text-sm font-semibold hover:bg-teal-50 transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setNewToken(null)}
              className="mt-3 text-sm font-medium text-teal-700 hover:text-teal-900"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <h2 className="font-heading font-700 text-base text-slate-900 tracking-tight">Invites</h2>
          <div className="relative sm:ml-auto">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as AdminInviteStatusFilter)}
              className="appearance-none pl-3 pr-9 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            >
              <option value="active">Active</option>
              <option value="all">All</option>
              <option value="used">Used</option>
              <option value="revoked">Revoked</option>
              <option value="expired">Expired</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-12">No invites match this filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3 hidden md:table-cell">Created</th>
                  <th className="px-5 py-3 hidden lg:table-cell">Expires</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map((inv) => {
                  const active = isActiveRow(inv);
                  let statusLabel = 'Expired';
                  let statusClass = 'bg-slate-100 text-slate-600 border-slate-200/60';
                  if (inv.usedAt) {
                    statusLabel = 'Used';
                    statusClass = 'bg-teal-50 text-teal-800 border-teal-200/60';
                  } else if (inv.revokedAt) {
                    statusLabel = 'Revoked';
                    statusClass = 'bg-red-50 text-red-700 border-red-200/60';
                  } else if (active) {
                    statusLabel = 'Active';
                    statusClass = 'bg-amber-50 text-amber-800 border-amber-200/60';
                  }
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3.5 text-sm font-medium text-slate-900">{inv.email}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-600 hidden md:table-cell">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(inv.createdAt).toLocaleString('en-NG', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-600 hidden lg:table-cell">
                        {new Date(inv.expiresAt).toLocaleString('en-NG', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {active ? (
                          <button
                            type="button"
                            onClick={() => setRevokeId(inv.id)}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            Revoke
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!revokeId}
        title="Revoke invite"
        message="This invite will no longer work. The recipient will need a new invite if they have not registered yet."
        confirmLabel="Revoke"
        confirmVariant="danger"
        onConfirm={handleRevoke}
        onCancel={() => setRevokeId(null)}
        loading={revoking}
      />
    </div>
  );
}
