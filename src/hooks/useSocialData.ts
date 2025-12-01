import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Post {
  id: string;
  user_id: string;
  content: string | null;
  post_type: string;
  shared_track_id: string | null;
  shared_album_id: string | null;
  shared_playlist_id: string | null;
  shared_artist_id: string | null;
  visibility: string;
  is_pinned: boolean;
  like_count: number;
  comment_count: number;
  share_count: number;
  created_at: string;
  user?: {
    display_name: string;
    profile_image_path: string | null;
  };
  shared_track?: {
    title: string;
    artist_name: string;
    album_cover_path: string | null;
  };
  shared_playlist?: {
    name: string;
    cover_image_path: string | null;
  };
}

export interface Comment {
  id: string;
  user_id: string;
  content: string;
  parent_type: string;
  like_count: number;
  reply_count: number;
  created_at: string;
  reply_to_id: string | null;
  user?: {
    display_name: string;
    profile_image_path: string | null;
  };
  replies?: Comment[];
}

export interface Activity {
  id: string;
  user_id: string;
  activity_type: string;
  target_type: string | null;
  target_id: string | null;
  metadata: any;
  created_at: string;
  user?: {
    display_name: string;
    profile_image_path: string | null;
  };
}

export function useSocialData() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [trendingPlaylists, setTrendingPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  const loadUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    return user;
  }, []);

  const loadPosts = useCallback(async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      // Fetch user profiles for posts
      const userIds = [...new Set(data.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('listener_profiles')
        .select('user_id, display_name, profile_image_path')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      const postsWithUsers = data.map(post => ({
        ...post,
        user: profileMap.get(post.user_id)
      }));

      setPosts(postsWithUsers);
    }
  }, []);

  const loadActivities = useCallback(async () => {
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(30);

    if (!error && data) {
      const userIds = [...new Set(data.map(a => a.user_id))];
      const { data: profiles } = await supabase
        .from('listener_profiles')
        .select('user_id, display_name, profile_image_path')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      const activitiesWithUsers = data.map(activity => ({
        ...activity,
        user: profileMap.get(activity.user_id)
      }));

      setActivities(activitiesWithUsers);
    }
  }, []);

  const loadTrendingPlaylists = useCallback(async () => {
    const { data, error } = await supabase
      .from('playlists')
      .select('*, playlist_motion_covers(*)')
      .eq('is_public', true)
      .order('play_count', { ascending: false })
      .limit(10);

    if (!error && data) {
      setTrendingPlaylists(data);
    }
  }, []);

  const createPost = useCallback(async (content: string, postType: string = 'text', sharedData?: any) => {
    if (!user) {
      toast({ title: 'Please sign in to post', variant: 'destructive' });
      return null;
    }

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        content,
        post_type: postType,
        shared_track_id: sharedData?.trackId || null,
        shared_album_id: sharedData?.albumId || null,
        shared_playlist_id: sharedData?.playlistId || null,
        shared_artist_id: sharedData?.artistId || null,
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Failed to create post', variant: 'destructive' });
      return null;
    }

    // Log activity
    await supabase.from('activity_log').insert({
      user_id: user.id,
      activity_type: 'posted',
      target_type: 'post',
      target_id: data.id,
    });

    toast({ title: 'Post created!' });
    await loadPosts();
    return data;
  }, [user, toast, loadPosts]);

  const likePost = useCallback(async (postId: string) => {
    if (!user) {
      toast({ title: 'Please sign in to like', variant: 'destructive' });
      return;
    }

    const { data: existing } = await supabase
      .from('reactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('target_type', 'post')
      .eq('post_id', postId)
      .maybeSingle();

    if (existing) {
      await supabase.from('reactions').delete().eq('id', existing.id);
      const { data: post } = await supabase.from('posts').select('like_count').eq('id', postId).single();
      if (post) {
        await supabase.from('posts').update({ like_count: Math.max((post.like_count || 0) - 1, 0) }).eq('id', postId);
      }
    } else {
      await supabase.from('reactions').insert({
        user_id: user.id,
        target_type: 'post',
        post_id: postId,
        reaction_type: 'like'
      });
      // Increment like count
      const { data: post } = await supabase.from('posts').select('like_count').eq('id', postId).single();
      if (post) {
        await supabase.from('posts').update({ like_count: (post.like_count || 0) + 1 }).eq('id', postId);
      }
    }

    await loadPosts();
  }, [user, toast, loadPosts]);

  const followFan = useCallback(async (targetUserId: string) => {
    if (!user) {
      toast({ title: 'Please sign in to follow', variant: 'destructive' });
      return;
    }

    const { data: existing } = await supabase
      .from('fan_follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .maybeSingle();

    if (existing) {
      await supabase.from('fan_follows').delete().eq('id', existing.id);
      toast({ title: 'Unfollowed' });
    } else {
      await supabase.from('fan_follows').insert({
        follower_id: user.id,
        following_id: targetUserId
      });

      // Create notification
      await supabase.from('notifications').insert({
        user_id: targetUserId,
        actor_id: user.id,
        notification_type: 'new_follower',
        target_type: 'profile',
        target_id: user.id,
        message: 'started following you'
      });

      toast({ title: 'Following!' });
    }
  }, [user, toast]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadUser();
      await Promise.all([loadPosts(), loadActivities(), loadTrendingPlaylists()]);
      setLoading(false);
    };
    init();

    // Set up realtime subscriptions
    const postsChannel = supabase
      .channel('posts-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        loadPosts();
      })
      .subscribe();

    const activityChannel = supabase
      .channel('activity-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_log' }, () => {
        loadActivities();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(activityChannel);
    };
  }, [loadUser, loadPosts, loadActivities, loadTrendingPlaylists]);

  return {
    posts,
    activities,
    trendingPlaylists,
    loading,
    user,
    createPost,
    likePost,
    followFan,
    refresh: () => Promise.all([loadPosts(), loadActivities(), loadTrendingPlaylists()])
  };
}

export function useComments(parentType: string, parentId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  const loadComments = useCallback(async () => {
    const column = `${parentType}_id`;
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('parent_type', parentType)
      .eq(column, parentId)
      .is('reply_to_id', null)
      .eq('is_hidden', false)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (!error && data) {
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('listener_profiles')
        .select('user_id, display_name, profile_image_path')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Load replies for each comment
      const commentsWithReplies = await Promise.all(data.map(async (comment) => {
        const { data: replies } = await supabase
          .from('comments')
          .select('*')
          .eq('reply_to_id', comment.id)
          .eq('is_hidden', false)
          .order('created_at', { ascending: true });

        const replyUserIds = replies?.map(r => r.user_id) || [];
        const { data: replyProfiles } = await supabase
          .from('listener_profiles')
          .select('user_id, display_name, profile_image_path')
          .in('user_id', replyUserIds);

        const replyProfileMap = new Map(replyProfiles?.map(p => [p.user_id, p]) || []);

        return {
          ...comment,
          user: profileMap.get(comment.user_id),
          replies: replies?.map(r => ({
            ...r,
            user: replyProfileMap.get(r.user_id)
          })) || []
        };
      }));

      setComments(commentsWithReplies);
    }
    setLoading(false);
  }, [parentType, parentId]);

  const addComment = useCallback(async (content: string, replyToId?: string) => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      toast({ title: 'Please sign in to comment', variant: 'destructive' });
      return null;
    }

    const insertData: Record<string, any> = {
      user_id: currentUser.id,
      content,
      parent_type: parentType,
      reply_to_id: replyToId || null
    };
    
    if (parentType === 'post') insertData.post_id = parentId;
    else if (parentType === 'track') insertData.track_id = parentId;
    else if (parentType === 'playlist') insertData.playlist_id = parentId;
    else if (parentType === 'album') insertData.album_id = parentId;

    const { data, error } = await supabase
      .from('comments')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      toast({ title: 'Failed to add comment', variant: 'destructive' });
      return null;
    }

    // Update comment count on parent
    if (parentType === 'playlist') {
      const { data: playlist } = await supabase.from('playlists').select('comment_count').eq('id', parentId).single();
      if (playlist) {
        await supabase.from('playlists').update({ comment_count: (playlist.comment_count || 0) + 1 }).eq('id', parentId);
      }
    }

    // Log activity
    await supabase.from('activity_log').insert({
      user_id: currentUser.id,
      activity_type: 'commented',
      target_type: parentType,
      target_id: parentId,
    });

    toast({ title: 'Comment added!' });
    await loadComments();
    return data;
  }, [parentType, parentId, toast, loadComments]);

  const likeComment = useCallback(async (commentId: string) => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      toast({ title: 'Please sign in to like', variant: 'destructive' });
      return;
    }

    const { data: existing } = await supabase
      .from('reactions')
      .select('id')
      .eq('user_id', currentUser.id)
      .eq('target_type', 'comment')
      .eq('comment_id', commentId)
      .maybeSingle();

    if (existing) {
      await supabase.from('reactions').delete().eq('id', existing.id);
    } else {
      await supabase.from('reactions').insert({
        user_id: currentUser.id,
        target_type: 'comment',
        comment_id: commentId,
        reaction_type: 'like'
      });
      const { data: comment } = await supabase.from('comments').select('like_count').eq('id', commentId).single();
      if (comment) {
        await supabase.from('comments').update({ like_count: (comment.like_count || 0) + 1 }).eq('id', commentId);
      }
    }

    await loadComments();
  }, [toast, loadComments]);

  useEffect(() => {
    loadComments();
    
    const channel = supabase
      .channel(`comments-${parentType}-${parentId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => {
        loadComments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadComments, parentType, parentId]);

  return { comments, loading, addComment, likeComment, refresh: loadComments };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
    setLoading(false);
  }, []);

  const markAsRead = useCallback(async (notificationId?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (notificationId) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
    } else {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    }
    await loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    loadNotifications();

    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        loadNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadNotifications]);

  return { notifications, unreadCount, loading, markAsRead, refresh: loadNotifications };
}
