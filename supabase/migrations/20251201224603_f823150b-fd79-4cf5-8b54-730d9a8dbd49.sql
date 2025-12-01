-- Social Feed Posts Table
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  content TEXT,
  post_type TEXT NOT NULL DEFAULT 'text' CHECK (post_type IN ('text', 'share_track', 'share_album', 'share_playlist', 'share_artist', 'activity')),
  shared_track_id UUID REFERENCES public.tracks(id) ON DELETE SET NULL,
  shared_album_id UUID REFERENCES public.albums(id) ON DELETE SET NULL,
  shared_playlist_id UUID REFERENCES public.playlists(id) ON DELETE SET NULL,
  shared_artist_id UUID,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
  is_pinned BOOLEAN DEFAULT false,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Post Media (images, videos for posts)
CREATE TABLE public.post_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'gif')),
  media_path TEXT NOT NULL,
  media_bucket TEXT DEFAULT 'post-media',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unified Comments Table (for posts, tracks, playlists)
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_type TEXT NOT NULL CHECK (parent_type IN ('post', 'track', 'playlist', 'album')),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  track_id UUID REFERENCES public.tracks(id) ON DELETE CASCADE,
  playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE,
  album_id UUID REFERENCES public.albums(id) ON DELETE CASCADE,
  reply_to_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  is_pinned BOOLEAN DEFAULT false,
  like_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reactions Table (for posts, comments, playlists)
CREATE TABLE public.reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  reaction_type TEXT NOT NULL DEFAULT 'like' CHECK (reaction_type IN ('like', 'love', 'fire', 'mind_blown', 'sad')),
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'playlist')),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, target_type, post_id, comment_id, playlist_id)
);

-- Fan Follows (fan-to-fan following)
CREATE TABLE public.fan_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Notifications Table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  actor_id UUID,
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'like', 'comment', 'reply', 'follow', 'mention', 'share',
    'playlist_add', 'playlist_like', 'playlist_comment',
    'track_added_to_playlist', 'new_follower', 'artist_release'
  )),
  target_type TEXT CHECK (target_type IN ('post', 'comment', 'track', 'playlist', 'album', 'profile')),
  target_id UUID,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Motion Covers for Playlists
CREATE TABLE public.playlist_motion_covers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  media_path TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('video', 'gif', 'animated_webp')),
  is_ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(playlist_id)
);

-- User Shares (track sharing activity)
CREATE TABLE public.user_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  share_type TEXT NOT NULL CHECK (share_type IN ('track', 'album', 'playlist', 'artist', 'post')),
  track_id UUID REFERENCES public.tracks(id) ON DELETE CASCADE,
  album_id UUID REFERENCES public.albums(id) ON DELETE CASCADE,
  playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE,
  artist_id UUID,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  share_method TEXT CHECK (share_method IN ('internal', 'external', 'qr_code', 'dm')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Activity Log (for activity feeds)
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'listened', 'liked_track', 'liked_playlist', 'followed_artist', 'followed_fan',
    'created_playlist', 'added_to_playlist', 'commented', 'shared', 'posted'
  )),
  target_type TEXT CHECK (target_type IN ('track', 'album', 'playlist', 'artist', 'fan', 'post', 'comment')),
  target_id UUID,
  metadata JSONB,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Blocks
CREATE TABLE public.user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL,
  blocked_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- Reports Table
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL,
  reported_user_id UUID,
  report_type TEXT NOT NULL CHECK (report_type IN ('spam', 'harassment', 'inappropriate', 'copyright', 'other')),
  target_type TEXT NOT NULL CHECK (target_type IN ('user', 'post', 'comment', 'playlist')),
  target_id UUID NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- Fan Badges
CREATE TABLE public.fan_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  badge_type TEXT NOT NULL CHECK (badge_type IN (
    'early_adopter', 'curator', 'tastemaker', 'collector', 'top_commenter',
    'playlist_master', 'social_butterfly', 'music_explorer', 'super_fan'
  )),
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_type)
);

-- Fan XP/Levels
CREATE TABLE public.fan_engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  xp_total INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  playlists_created INTEGER DEFAULT 0,
  comments_made INTEGER DEFAULT 0,
  likes_given INTEGER DEFAULT 0,
  shares_made INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add social columns to listener_profiles
ALTER TABLE public.listener_profiles
ADD COLUMN IF NOT EXISTS banner_image_path TEXT,
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- Add like_count to playlists
ALTER TABLE public.playlists
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

-- Create indexes for performance
CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_posts_post_type ON public.posts(post_type);
CREATE INDEX idx_comments_parent ON public.comments(parent_type, post_id, track_id, playlist_id);
CREATE INDEX idx_comments_user_id ON public.comments(user_id);
CREATE INDEX idx_reactions_user ON public.reactions(user_id);
CREATE INDEX idx_reactions_target ON public.reactions(target_type, post_id, comment_id, playlist_id);
CREATE INDEX idx_fan_follows_follower ON public.fan_follows(follower_id);
CREATE INDEX idx_fan_follows_following ON public.fan_follows(following_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX idx_activity_log_user ON public.activity_log(user_id, created_at DESC);
CREATE INDEX idx_activity_log_public ON public.activity_log(is_public, created_at DESC);

-- Enable RLS on all new tables
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fan_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_motion_covers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fan_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fan_engagement ENABLE ROW LEVEL SECURITY;

-- RLS Policies for posts
CREATE POLICY "Public posts are viewable by everyone" ON public.posts FOR SELECT USING (visibility = 'public');
CREATE POLICY "Users can view their own posts" ON public.posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for post_media
CREATE POLICY "Post media viewable with post" ON public.post_media FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.posts WHERE posts.id = post_media.post_id AND (posts.visibility = 'public' OR posts.user_id = auth.uid()))
);
CREATE POLICY "Users can add media to their posts" ON public.post_media FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.posts WHERE posts.id = post_media.post_id AND posts.user_id = auth.uid())
);
CREATE POLICY "Users can delete their post media" ON public.post_media FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.posts WHERE posts.id = post_media.post_id AND posts.user_id = auth.uid())
);

-- RLS Policies for comments
CREATE POLICY "Comments are viewable by everyone" ON public.comments FOR SELECT USING (is_hidden = false);
CREATE POLICY "Users can create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for reactions
CREATE POLICY "Reactions are viewable by everyone" ON public.reactions FOR SELECT USING (true);
CREATE POLICY "Users can add reactions" ON public.reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their reactions" ON public.reactions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for fan_follows
CREATE POLICY "Follows are viewable by everyone" ON public.fan_follows FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON public.fan_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.fan_follows FOR DELETE USING (auth.uid() = follower_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view their notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for playlist_motion_covers
CREATE POLICY "Motion covers viewable by everyone" ON public.playlist_motion_covers FOR SELECT USING (true);
CREATE POLICY "Playlist owners can add motion covers" ON public.playlist_motion_covers FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.playlists WHERE playlists.id = playlist_motion_covers.playlist_id AND playlists.user_id = auth.uid())
);
CREATE POLICY "Playlist owners can update motion covers" ON public.playlist_motion_covers FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.playlists WHERE playlists.id = playlist_motion_covers.playlist_id AND playlists.user_id = auth.uid())
);
CREATE POLICY "Playlist owners can delete motion covers" ON public.playlist_motion_covers FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.playlists WHERE playlists.id = playlist_motion_covers.playlist_id AND playlists.user_id = auth.uid())
);

-- RLS Policies for user_shares
CREATE POLICY "Shares are viewable by everyone" ON public.user_shares FOR SELECT USING (true);
CREATE POLICY "Users can create shares" ON public.user_shares FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for activity_log
CREATE POLICY "Public activities are viewable" ON public.activity_log FOR SELECT USING (is_public = true);
CREATE POLICY "Users can view their own activities" ON public.activity_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create activities" ON public.activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_blocks
CREATE POLICY "Users can view their blocks" ON public.user_blocks FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "Users can block others" ON public.user_blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Users can unblock" ON public.user_blocks FOR DELETE USING (auth.uid() = blocker_id);

-- RLS Policies for reports
CREATE POLICY "Users can create reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can view their reports" ON public.reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "Admins can view all reports" ON public.reports FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update reports" ON public.reports FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for fan_badges
CREATE POLICY "Badges are viewable by everyone" ON public.fan_badges FOR SELECT USING (true);

-- RLS Policies for fan_engagement
CREATE POLICY "Engagement is viewable by everyone" ON public.fan_engagement FOR SELECT USING (true);
CREATE POLICY "Users can update their engagement" ON public.fan_engagement FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can create engagement" ON public.fan_engagement FOR INSERT WITH CHECK (true);

-- Create storage bucket for post media and motion covers
INSERT INTO storage.buckets (id, name, public) VALUES ('post-media', 'post-media', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('motion-covers', 'motion-covers', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('fan-banners', 'fan-banners', true) ON CONFLICT DO NOTHING;

-- Storage policies for post-media
CREATE POLICY "Post media publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'post-media');
CREATE POLICY "Users can upload post media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their post media" ON storage.objects FOR DELETE USING (bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for fan-banners
CREATE POLICY "Fan banners publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'fan-banners');
CREATE POLICY "Users can upload fan banners" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'fan-banners' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their fan banners" ON storage.objects FOR DELETE USING (bucket_id = 'fan-banners' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable realtime for social tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;