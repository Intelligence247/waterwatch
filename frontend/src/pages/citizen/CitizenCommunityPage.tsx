import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/ToastProvider';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { createComment, deleteComment as deleteCommentApi, listComments } from '../../lib/commentsApi';
import { listWaterpoints } from '../../lib/waterpointsApi';
import {
  MessageSquare,
  Send,
  Loader2,
  MapPin,
  Clock,
  Trash2,
} from 'lucide-react';

interface Comment {
  id: string;
  waterpoint_id: string | null;
  author_id: string;
  content: string;
  created_at: string;
  citizen_profiles?: { full_name: string; community: string } | null;
  waterpoints?: { name: string } | null;
}

export default function CitizenCommunityPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [waterpoints, setWaterpoints] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [selectedWaterpoint, setSelectedWaterpoint] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listComments({ limit: 50 });
      setComments((data.items as Comment[]) || []);
    } catch {
      setComments([]);
      toast('error', 'Failed to load community comments.');
    }
    setLoading(false);
  }, [toast]);

  const fetchWaterpoints = useCallback(async () => {
    try {
      const data = await listWaterpoints({ limit: 100, auth: true });
      setWaterpoints(data.items.map((item) => ({ id: item.id, name: item.name })));
    } catch {
      setWaterpoints([]);
    }
  }, []);

  useEffect(() => { fetchComments(); fetchWaterpoints(); }, [fetchComments, fetchWaterpoints]);

  const submitComment = async () => {
    if (!user || !newComment.trim()) return;
    setSubmitting(true);
    try {
      await createComment({
        ...(selectedWaterpoint ? { waterpointId: selectedWaterpoint } : {}),
        content: newComment.trim(),
      });
      setNewComment('');
      setSelectedWaterpoint('');
      fetchComments();
    } catch {
      toast('error', 'Failed to post comment. Please try again.');
    }
    setSubmitting(false);
  };

  const deleteComment = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    let failed = false;
    try {
      await deleteCommentApi(deleteTarget);
    } catch {
      failed = true;
    }
    setDeleting(false);
    if (failed) {
      toast('error', 'Failed to delete comment.');
    } else {
      toast('success', 'Comment deleted.');
    }
    setDeleteTarget(null);
    fetchComments();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading font-800 text-2xl text-slate-900 tracking-tight flex items-center gap-2">
          Community Feed
        </h1>
        <p className="text-sm text-slate-500 mt-1">Discuss water issues, coordinate reports, and share updates with neighbors in your local area{profile?.lga ? ` (${profile.lga} LGA)` : ''}.</p>
      </div>

      {/* Post Comment */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 text-teal-800 font-bold border border-teal-200/40">
            {profile?.full_name?.charAt(0)?.toUpperCase() || 'C'}
          </div>
          <div className="flex-1 space-y-3.5">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full p-3.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-700 placeholder-slate-400 min-h-[90px] resize-none"
              placeholder="Share a water update, alert neighbors of outages, or ask about local borehole service status..."
              required
            />
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <select
                  value={selectedWaterpoint}
                  onChange={(e) => setSelectedWaterpoint(e.target.value)}
                  className="w-full appearance-none pl-3.5 pr-8 py-2.5 border border-slate-200 rounded-xl bg-white text-xs text-slate-600 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  <option value="">General neighborhood discussion</option>
                  {waterpoints.map((wp) => (
                    <option key={wp.id} value={wp.id}>Tag: {wp.name}</option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={submitComment}
                disabled={submitting || !newComment.trim()}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-60"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Post Update
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments Feed */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-7 h-7 text-teal-600 animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 text-center py-16 shadow-sm">
          <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">No community posts yet</p>
          <p className="text-xs text-slate-400 mt-1">Be the first to post a neighborhood update or ask a water-related question.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:border-slate-300 transition-all duration-200 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-700 font-bold border border-slate-200">
                  {comment.citizen_profiles?.full_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-800">
                      {comment.citizen_profiles?.full_name || 'Anonymous'}
                    </span>
                    {comment.citizen_profiles?.community && (
                      <span className="inline-flex px-2 py-0.5 bg-slate-50 text-slate-500 rounded-full text-[10px] font-bold border border-slate-150">
                        {comment.citizen_profiles.community}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium ml-auto sm:ml-0">
                      <Clock className="w-3.5 h-3.5 text-slate-300" />
                      {new Date(comment.created_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  {comment.waterpoints?.name && (
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-100/60">
                        <MapPin className="w-3.5 h-3.5" />
                        {comment.waterpoints.name}
                      </span>
                    </div>
                  )}

                  <p className="text-xs sm:text-sm text-slate-700 mt-3 leading-relaxed bg-slate-50/30 p-3 rounded-xl border border-slate-100/60">
                    {comment.content}
                  </p>

                  {/* Delete own comment */}
                  {comment.author_id === user?.id && (
                    <div className="mt-3.5 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(comment.id)}
                        className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-semibold transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Post
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={deleteComment}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
