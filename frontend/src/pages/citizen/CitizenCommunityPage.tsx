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
  fault_report_id: string | null;
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
      const data = await listWaterpoints({ limit: 100 });
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
        <h1 className="font-heading font-800 text-2xl text-slate-900 tracking-tight">Community Feed</h1>
        <p className="text-sm text-slate-500 mt-1">Discuss water issues with your neighbors and community members.</p>
      </div>

      {/* Post Comment */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-100 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-cyan-700">
              {profile?.full_name?.charAt(0)?.toUpperCase() || 'C'}
            </span>
          </div>
          <div className="flex-1 space-y-3">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="field-input min-h-[80px] resize-none"
              placeholder="Share an update, ask a question, or report a water issue in your community..."
            />
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <select
                  value={selectedWaterpoint}
                  onChange={(e) => setSelectedWaterpoint(e.target.value)}
                  className="field-input text-sm"
                >
                  <option value="">General discussion</option>
                  {waterpoints.map((wp) => (
                    <option key={wp.id} value={wp.id}>{wp.name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={submitComment}
                disabled={submitting || !newComment.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-60"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Post
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments Feed */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 text-center py-16">
          <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No community posts yet. Be the first to start a conversation!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-slate-600">
                    {comment.citizen_profiles?.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-900">
                      {comment.citizen_profiles?.full_name || 'Anonymous'}
                    </span>
                    {comment.citizen_profiles?.community && (
                      <span className="text-xs text-slate-400">in {comment.citizen_profiles.community}</span>
                    )}
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(comment.created_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  {comment.waterpoints?.name && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <MapPin className="w-3 h-3 text-teal-500" />
                      <span className="text-xs font-medium text-teal-700">{comment.waterpoints.name}</span>
                    </div>
                  )}

                  <p className="text-sm text-slate-700 mt-2 leading-relaxed">{comment.content}</p>

                  {/* Delete own comment */}
                  {comment.author_id === user?.id && (
                    <button
                      onClick={() => setDeleteTarget(comment.id)}
                      className="mt-2 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
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
