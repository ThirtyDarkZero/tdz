import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Heart, Trash2, Send, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  listener_profiles?: {
    display_name: string;
    profile_image_path: string | null;
  };
  comment_likes?: { count: number }[];
}

interface CommentsSectionProps {
  trackId: string;
}

export const CommentsSection = ({ trackId }: CommentsSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [user, setUser] = useState<any>(null);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUser();
    loadComments();
  }, [trackId]);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      loadLikedComments(user.id);
    }
  };

  const loadComments = async () => {
    const { data, error } = await supabase
      .from("track_comments")
      .select("*")
      .eq("track_id", trackId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Fetch profiles and like counts for each comment
      const enrichedComments = await Promise.all(
        data.map(async (comment) => {
          const { data: profile } = await supabase
            .from("listener_profiles")
            .select("display_name, profile_image_path")
            .eq("user_id", comment.user_id)
            .single();

          const { count } = await supabase
            .from("comment_likes")
            .select("*", { count: "exact", head: true })
            .eq("comment_id", comment.id);

          return {
            ...comment,
            listener_profiles: profile,
            comment_likes: [{ count: count || 0 }],
          };
        })
      );
      setComments(enrichedComments as any);
    }
  };

  const loadLikedComments = async (userId: string) => {
    const { data } = await supabase
      .from("comment_likes")
      .select("comment_id")
      .eq("user_id", userId);

    if (data) {
      setLikedComments(new Set(data.map(l => l.comment_id)));
    }
  };

  const handlePostComment = async () => {
    if (!user) {
      toast.error("Please sign in to comment");
      return;
    }

    if (!newComment.trim() || newComment.length > 1000) {
      toast.error("Comment must be between 1-1000 characters");
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("track_comments")
      .insert({
        user_id: user.id,
        track_id: trackId,
        content: newComment.trim()
      });

    if (error) {
      toast.error("Failed to post comment");
    } else {
      toast.success("Comment posted!");
      setNewComment("");
      loadComments();
    }
    setLoading(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    const { error } = await supabase
      .from("track_comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      toast.error("Failed to delete comment");
    } else {
      toast.success("Comment deleted");
      loadComments();
    }
  };

  const toggleCommentLike = async (commentId: string) => {
    if (!user) {
      toast.error("Please sign in to like comments");
      return;
    }

    const isLiked = likedComments.has(commentId);

    if (isLiked) {
      await supabase
        .from("comment_likes")
        .delete()
        .eq("user_id", user.id)
        .eq("comment_id", commentId);

      setLikedComments(prev => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    } else {
      await supabase
        .from("comment_likes")
        .insert({ user_id: user.id, comment_id: commentId });

      setLikedComments(prev => new Set(prev).add(commentId));
    }
    loadComments();
  };

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold">Comments</h3>

      {/* Post Comment */}
      <Card className="glass-card p-4">
        <div className="flex gap-4">
          <Avatar>
            <AvatarFallback>
              <User className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              maxLength={1000}
              rows={3}
            />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {newComment.length}/1000
              </span>
              <Button
                onClick={handlePostComment}
                disabled={!newComment.trim() || loading}
                size="sm"
              >
                <Send className="w-4 h-4 mr-2" />
                Post
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <Card key={comment.id} className="glass-card p-4">
            <div className="flex gap-4">
              <Avatar>
                {comment.listener_profiles?.profile_image_path ? (
                  <AvatarImage src={comment.listener_profiles.profile_image_path} />
                ) : (
                  <AvatarFallback>
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">
                      {comment.listener_profiles?.display_name || "Anonymous"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {user?.id === comment.user_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteComment(comment.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <p className="text-sm">{comment.content}</p>
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleCommentLike(comment.id)}
                    className={likedComments.has(comment.id) ? "text-primary" : ""}
                  >
                    <Heart
                      className="w-4 h-4 mr-1"
                      fill={likedComments.has(comment.id) ? "currentColor" : "none"}
                    />
                    {comment.comment_likes?.[0]?.count || 0}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
