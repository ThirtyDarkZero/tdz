import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share2, MoreHorizontal, Music, ListMusic, User, Send, Loader2 } from 'lucide-react';
import { useSocialData, Post } from '@/hooks/useSocialData';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface SocialFeedProps {
  variant?: 'full' | 'compact' | 'sidebar';
  className?: string;
}

export function SocialFeed({ variant = 'full', className }: SocialFeedProps) {
  const { posts, loading, user, createPost, likePost } = useSocialData();
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    setIsPosting(true);
    await createPost(newPostContent.trim());
    setNewPostContent('');
    setIsPosting(false);
  };

  const getPostIcon = (postType: string) => {
    switch (postType) {
      case 'share_track': return <Music className="w-4 h-4 text-primary" />;
      case 'share_playlist': return <ListMusic className="w-4 h-4 text-primary" />;
      case 'share_artist': return <User className="w-4 h-4 text-primary" />;
      default: return null;
    }
  };

  const getAvatarUrl = (path: string | null | undefined) => {
    if (!path) return null;
    return supabase.storage.from('listener-images').getPublicUrl(path).data.publicUrl;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Create Post */}
      {user && variant !== 'sidebar' && (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="pt-4">
            <div className="flex gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={getAvatarUrl(user.user_metadata?.avatar_url)} />
                <AvatarFallback className="bg-primary/20 text-primary">
                  {user.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea
                  placeholder="Share what you're listening to..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="min-h-[80px] bg-background/50 border-border/50 resize-none"
                />
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      <Music className="w-4 h-4 mr-1" /> Share Track
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      <ListMusic className="w-4 h-4 mr-1" /> Share Playlist
                    </Button>
                  </div>
                  <Button 
                    onClick={handleCreatePost} 
                    disabled={!newPostContent.trim() || isPosting}
                    size="sm"
                  >
                    {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
                    Post
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posts List */}
      <div className="space-y-3">
        {posts.length === 0 ? (
          <Card className="bg-card/30 border-border/30">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No posts yet. Be the first to share!</p>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post} 
              onLike={() => likePost(post.id)}
              variant={variant}
              getAvatarUrl={getAvatarUrl}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface PostCardProps {
  post: Post;
  onLike: () => void;
  variant: 'full' | 'compact' | 'sidebar';
  getAvatarUrl: (path: string | null | undefined) => string | null;
}

function PostCard({ post, onLike, variant, getAvatarUrl }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike();
  };

  if (variant === 'sidebar') {
    return (
      <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors">
        <Avatar className="w-8 h-8">
          <AvatarImage src={getAvatarUrl(post.user?.profile_image_path)} />
          <AvatarFallback className="bg-primary/20 text-primary text-xs">
            {post.user?.display_name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{post.user?.display_name || 'User'}</p>
          <p className="text-xs text-muted-foreground line-clamp-2">{post.content}</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all">
      <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 ring-2 ring-primary/20">
                  <AvatarImage src={getAvatarUrl(post.user?.profile_image_path)} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {post.user?.display_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{post.user?.display_name || 'User'}</span>
                    {post.post_type === 'share_track' && <Music className="w-4 h-4 text-primary" />}
                    {post.post_type === 'share_playlist' && <ListMusic className="w-4 h-4 text-primary" />}
                  </div>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {post.content && (
          <p className={cn(
            "text-foreground",
            variant === 'compact' && "line-clamp-3"
          )}>
            {post.content}
          </p>
        )}

        {/* Shared Content Preview */}
        {post.shared_track && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/30 border border-border/50">
            <div className="w-12 h-12 rounded bg-primary/20 flex items-center justify-center">
              <Music className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">{post.shared_track.title}</p>
              <p className="text-xs text-muted-foreground">{post.shared_track.artist_name}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={cn(
              "gap-1.5 text-muted-foreground hover:text-primary",
              isLiked && "text-red-500 hover:text-red-500"
            )}
          >
            <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
            {post.like_count || 0}
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-primary">
            <MessageCircle className="w-4 h-4" />
            {post.comment_count || 0}
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-primary">
            <Share2 className="w-4 h-4" />
            {post.share_count || 0}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
