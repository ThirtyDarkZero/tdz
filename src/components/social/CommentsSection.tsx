import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, MoreHorizontal, Pin, Flag, Loader2, Send } from 'lucide-react';
import { useComments, Comment } from '@/hooks/useSocialData';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CommentsSectionProps {
  parentType: 'track' | 'playlist' | 'album' | 'post';
  parentId: string;
  title?: string;
  className?: string;
}

export function CommentsSection({ parentType, parentId, title = 'Comments', className }: CommentsSectionProps) {
  const { comments, loading, addComment, likeComment } = useComments(parentType, parentId);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    await addComment(newComment.trim());
    setNewComment('');
    setIsSubmitting(false);
  };

  const handleSubmitReply = async (commentId: string) => {
    if (!replyContent.trim()) return;
    setIsSubmitting(true);
    await addComment(replyContent.trim(), commentId);
    setReplyContent('');
    setReplyingTo(null);
    setIsSubmitting(false);
  };

  const getAvatarUrl = (path: string | null | undefined) => {
    if (!path) return null;
    return supabase.storage.from('listener-images').getPublicUrl(path).data.publicUrl;
  };

  if (loading) {
    return (
      <Card className={cn("bg-card/50 backdrop-blur-sm", className)}>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("bg-card/50 backdrop-blur-sm border-border/50", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          {title} ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* New Comment Input */}
        <div className="flex gap-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary/20 text-primary text-xs">U</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[60px] bg-background/50 border-border/50 resize-none text-sm"
            />
            <div className="flex justify-end">
              <Button 
                size="sm" 
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
                Comment
              </Button>
            </div>
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 text-sm">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onLike={() => likeComment(comment.id)}
                onReply={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                isReplying={replyingTo === comment.id}
                replyContent={replyContent}
                onReplyContentChange={setReplyContent}
                onSubmitReply={() => handleSubmitReply(comment.id)}
                isSubmitting={isSubmitting}
                getAvatarUrl={getAvatarUrl}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface CommentItemProps {
  comment: Comment;
  onLike: () => void;
  onReply: () => void;
  isReplying: boolean;
  replyContent: string;
  onReplyContentChange: (content: string) => void;
  onSubmitReply: () => void;
  isSubmitting: boolean;
  getAvatarUrl: (path: string | null | undefined) => string | null;
  isReply?: boolean;
}

function CommentItem({
  comment,
  onLike,
  onReply,
  isReplying,
  replyContent,
  onReplyContentChange,
  onSubmitReply,
  isSubmitting,
  getAvatarUrl,
  isReply = false
}: CommentItemProps) {
  const [liked, setLiked] = useState(false);

  const handleLike = () => {
    setLiked(!liked);
    onLike();
  };

  return (
    <div className={cn("space-y-3", isReply && "ml-10 pl-4 border-l border-border/50")}>
      <div className="flex gap-3">
        <Avatar className={cn("ring-2 ring-primary/10", isReply ? "w-7 h-7" : "w-8 h-8")}>
          <AvatarImage src={getAvatarUrl(comment.user?.profile_image_path)} />
          <AvatarFallback className="bg-primary/20 text-primary text-xs">
            {comment.user?.display_name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{comment.user?.display_name || 'User'}</span>
              {(comment as any).is_pinned && (
                <span className="flex items-center gap-1 text-xs text-primary">
                  <Pin className="w-3 h-3" /> Pinned
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreHorizontal className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-destructive">
                  <Flag className="w-3 h-3 mr-2" /> Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-sm text-foreground mt-1">{comment.content}</p>
          <div className="flex items-center gap-3 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={cn(
                "h-7 px-2 gap-1 text-xs",
                liked ? "text-red-500" : "text-muted-foreground"
              )}
            >
              <Heart className={cn("w-3 h-3", liked && "fill-current")} />
              {comment.like_count || 0}
            </Button>
            {!isReply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReply}
                className="h-7 px-2 gap-1 text-xs text-muted-foreground"
              >
                <MessageCircle className="w-3 h-3" />
                Reply {comment.reply_count > 0 && `(${comment.reply_count})`}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Reply Input */}
      {isReplying && (
        <div className="ml-10 pl-4 border-l border-border/50">
          <div className="flex gap-2">
            <Avatar className="w-6 h-6">
              <AvatarFallback className="bg-primary/20 text-primary text-xs">U</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => onReplyContentChange(e.target.value)}
                className="min-h-[50px] bg-background/50 border-border/50 resize-none text-sm"
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={onReply}>Cancel</Button>
                <Button 
                  size="sm" 
                  onClick={onSubmitReply}
                  disabled={!replyContent.trim() || isSubmitting}
                >
                  Reply
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onLike={() => {}}
              onReply={() => {}}
              isReplying={false}
              replyContent=""
              onReplyContentChange={() => {}}
              onSubmitReply={() => {}}
              isSubmitting={false}
              getAvatarUrl={getAvatarUrl}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
}
