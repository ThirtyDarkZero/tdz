export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      albums: {
        Row: {
          artist_name: string
          cover_art_path: string | null
          created_at: string
          description: string | null
          genre: string | null
          id: string
          is_published: boolean | null
          motion_cover_bucket: string | null
          motion_cover_path: string | null
          play_count: number | null
          release_date: string | null
          scheduled_release_date: string | null
          title: string
          total_duration: number | null
          total_tracks: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          artist_name: string
          cover_art_path?: string | null
          created_at?: string
          description?: string | null
          genre?: string | null
          id?: string
          is_published?: boolean | null
          motion_cover_bucket?: string | null
          motion_cover_path?: string | null
          play_count?: number | null
          release_date?: string | null
          scheduled_release_date?: string | null
          title: string
          total_duration?: number | null
          total_tracks?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          artist_name?: string
          cover_art_path?: string | null
          created_at?: string
          description?: string | null
          genre?: string | null
          id?: string
          is_published?: boolean | null
          motion_cover_bucket?: string | null
          motion_cover_path?: string | null
          play_count?: number | null
          release_date?: string | null
          scheduled_release_date?: string | null
          title?: string
          total_duration?: number | null
          total_tracks?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      artist_collaborators: {
        Row: {
          artist_id: string
          collaborator_id: string
          created_at: string
          id: string
          invite_id: string | null
          permissions: Json
          updated_at: string
        }
        Insert: {
          artist_id: string
          collaborator_id: string
          created_at?: string
          id?: string
          invite_id?: string | null
          permissions?: Json
          updated_at?: string
        }
        Update: {
          artist_id?: string
          collaborator_id?: string
          created_at?: string
          id?: string
          invite_id?: string | null
          permissions?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_collaborators_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "collaborator_invites"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_follows: {
        Row: {
          artist_id: string
          created_at: string
          follower_id: string
          id: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          follower_id: string
          id?: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          follower_id?: string
          id?: string
        }
        Relationships: []
      }
      artist_gallery: {
        Row: {
          artist_id: string
          caption: string | null
          created_at: string
          display_order: number | null
          id: string
          image_path: string
          updated_at: string
        }
        Insert: {
          artist_id: string
          caption?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_path: string
          updated_at?: string
        }
        Update: {
          artist_id?: string
          caption?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_path?: string
          updated_at?: string
        }
        Relationships: []
      }
      artist_profiles: {
        Row: {
          artist_name: string
          banner_image_path: string | null
          bio: string | null
          created_at: string
          id: string
          monthly_listeners: number | null
          profile_image_path: string | null
          social_links: Json | null
          total_plays: number | null
          updated_at: string
          user_id: string
          verified: boolean | null
        }
        Insert: {
          artist_name: string
          banner_image_path?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          monthly_listeners?: number | null
          profile_image_path?: string | null
          social_links?: Json | null
          total_plays?: number | null
          updated_at?: string
          user_id: string
          verified?: boolean | null
        }
        Update: {
          artist_name?: string
          banner_image_path?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          monthly_listeners?: number | null
          profile_image_path?: string | null
          social_links?: Json | null
          total_plays?: number | null
          updated_at?: string
          user_id?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown
          metadata: Json | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      auth_rate_limits: {
        Row: {
          attempt_count: number
          blocked_until: string | null
          created_at: string
          id: string
          identifier: string
          window_start: string
        }
        Insert: {
          attempt_count?: number
          blocked_until?: string | null
          created_at?: string
          id?: string
          identifier: string
          window_start?: string
        }
        Update: {
          attempt_count?: number
          blocked_until?: string | null
          created_at?: string
          id?: string
          identifier?: string
          window_start?: string
        }
        Relationships: []
      }
      characters: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_approved: boolean
          media_path: string
          media_type: string
          name: string
          project_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_approved?: boolean
          media_path: string
          media_type: string
          name?: string
          project_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_approved?: boolean
          media_path?: string
          media_type?: string
          name?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "characters_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      collaborator_invites: {
        Row: {
          artist_id: string
          created_at: string
          expires_at: string
          id: string
          invited_email: string
          message: string | null
          permissions: Json
          status: string
          updated_at: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          expires_at?: string
          id?: string
          invited_email: string
          message?: string | null
          permissions?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          invited_email?: string
          message?: string | null
          permissions?: Json
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          metadata: Json | null
          reference_id: string | null
          reference_type: string | null
          status: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      exports: {
        Row: {
          completed_at: string | null
          created_at: string
          duration_seconds: number | null
          error_message: string | null
          file_path: string | null
          file_size_bytes: number | null
          format: string
          id: string
          includes_captions: boolean | null
          includes_edl: boolean | null
          includes_otio: boolean | null
          includes_xml: boolean | null
          project_id: string
          started_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          error_message?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          format: string
          id?: string
          includes_captions?: boolean | null
          includes_edl?: boolean | null
          includes_otio?: boolean | null
          includes_xml?: boolean | null
          project_id: string
          started_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          error_message?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          format?: string
          id?: string
          includes_captions?: boolean | null
          includes_edl?: boolean | null
          includes_otio?: boolean | null
          includes_xml?: boolean | null
          project_id?: string
          started_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      fan_metrics: {
        Row: {
          conversion_rate: number
          email_list_size: number
          id: string
          open_rate: number
          super_fans_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          conversion_rate?: number
          email_list_size?: number
          id?: string
          open_rate?: number
          super_fans_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          conversion_rate?: number
          email_list_size?: number
          id?: string
          open_rate?: number
          super_fans_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      label_staff_conversations: {
        Row: {
          created_at: string
          id: string
          staff_member_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          staff_member_id: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          staff_member_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      label_staff_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          timestamp: number
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          timestamp: number
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          timestamp?: number
        }
        Relationships: [
          {
            foreignKeyName: "label_staff_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "label_staff_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      listener_profiles: {
        Row: {
          bio: string | null
          created_at: string
          display_name: string
          favorite_genres: Json | null
          id: string
          location: string | null
          profile_image_path: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          display_name: string
          favorite_genres?: Json | null
          id?: string
          location?: string | null
          profile_image_path?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          display_name?: string
          favorite_genres?: Json | null
          id?: string
          location?: string | null
          profile_image_path?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      listening_history: {
        Row: {
          completion_percentage: number | null
          device_type: string | null
          id: string
          location_data: Json | null
          play_duration: number | null
          played_at: string
          track_id: string
          user_id: string
        }
        Insert: {
          completion_percentage?: number | null
          device_type?: string | null
          id?: string
          location_data?: Json | null
          play_duration?: number | null
          played_at?: string
          track_id: string
          user_id: string
        }
        Update: {
          completion_percentage?: number | null
          device_type?: string | null
          id?: string
          location_data?: Json | null
          play_duration?: number | null
          played_at?: string
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listening_history_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "published_tracks_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listening_history_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      lyric_alignments: {
        Row: {
          confidence: number
          created_at: string
          end_time: number
          id: string
          line_index: number
          phonemes: Json | null
          project_id: string
          start_time: number
          word: string
          word_index: number
        }
        Insert: {
          confidence?: number
          created_at?: string
          end_time: number
          id?: string
          line_index: number
          phonemes?: Json | null
          project_id: string
          start_time: number
          word: string
          word_index: number
        }
        Update: {
          confidence?: number
          created_at?: string
          end_time?: number
          id?: string
          line_index?: number
          phonemes?: Json | null
          project_id?: string
          start_time?: number
          word?: string
          word_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "lyric_alignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_artists: {
        Row: {
          artist_id: string
          commission_rate: number | null
          contract_end_date: string | null
          contract_start_date: string | null
          created_at: string
          id: string
          manager_id: string
          notes: string | null
        }
        Insert: {
          artist_id: string
          commission_rate?: number | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string
          id?: string
          manager_id: string
          notes?: string | null
        }
        Update: {
          artist_id?: string
          commission_rate?: number | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string
          id?: string
          manager_id?: string
          notes?: string | null
        }
        Relationships: []
      }
      master_classes: {
        Row: {
          available: boolean
          created_at: string
          duration: string
          enrolled: number
          id: string
          instructor: string
          level: string
          price: string
          rating: number
          thumbnail: string | null
          title: string
          topics: Json
          updated_at: string
        }
        Insert: {
          available?: boolean
          created_at?: string
          duration: string
          enrolled?: number
          id?: string
          instructor: string
          level: string
          price: string
          rating?: number
          thumbnail?: string | null
          title: string
          topics?: Json
          updated_at?: string
        }
        Update: {
          available?: boolean
          created_at?: string
          duration?: string
          enrolled?: number
          id?: string
          instructor?: string
          level?: string
          price?: string
          rating?: number
          thumbnail?: string | null
          title?: string
          topics?: Json
          updated_at?: string
        }
        Relationships: []
      }
      milestones: {
        Row: {
          achieved: boolean
          created_at: string
          current_value: number | null
          date_achieved: string | null
          id: string
          momentum_impact: number
          target_value: number | null
          title: string
          user_id: string
        }
        Insert: {
          achieved?: boolean
          created_at?: string
          current_value?: number | null
          date_achieved?: string | null
          id?: string
          momentum_impact: number
          target_value?: number | null
          title: string
          user_id: string
        }
        Update: {
          achieved?: boolean
          created_at?: string
          current_value?: number | null
          date_achieved?: string | null
          id?: string
          momentum_impact?: number
          target_value?: number | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      momentum_scores: {
        Row: {
          content_consistency: number
          created_at: string
          engagement_rate: number
          fan_growth: number
          id: string
          release_velocity: number
          score: number
          streak_days: number
          user_id: string
        }
        Insert: {
          content_consistency?: number
          created_at?: string
          engagement_rate?: number
          fan_growth?: number
          id?: string
          release_velocity?: number
          score?: number
          streak_days?: number
          user_id: string
        }
        Update: {
          content_consistency?: number
          created_at?: string
          engagement_rate?: number
          fan_growth?: number
          id?: string
          release_velocity?: number
          score?: number
          streak_days?: number
          user_id?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          budget: string
          created_at: string
          deadline: string
          description: string
          genre: Json
          id: string
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          budget: string
          created_at?: string
          deadline: string
          description: string
          genre?: Json
          id?: string
          status?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          budget?: string
          created_at?: string
          deadline?: string
          description?: string
          genre?: Json
          id?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      playlist_tracks: {
        Row: {
          added_at: string
          added_by: string | null
          id: string
          playlist_id: string
          position: number
          track_id: string
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          id?: string
          playlist_id: string
          position: number
          track_id: string
        }
        Update: {
          added_at?: string
          added_by?: string | null
          id?: string
          playlist_id?: string
          position?: number
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_tracks_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_tracks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "published_tracks_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_tracks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          cover_image_path: string | null
          created_at: string
          description: string | null
          id: string
          is_collaborative: boolean | null
          is_public: boolean | null
          name: string
          play_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_image_path?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_collaborative?: boolean | null
          is_public?: boolean | null
          name: string
          play_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_image_path?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_collaborative?: boolean | null
          is_public?: boolean | null
          name?: string
          play_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_versions: {
        Row: {
          characters_snapshot: Json | null
          created_at: string
          created_by: string
          id: string
          project_id: string
          scenes_snapshot: Json
          snapshot_data: Json
          version_number: number
        }
        Insert: {
          characters_snapshot?: Json | null
          created_at?: string
          created_by: string
          id?: string
          project_id: string
          scenes_snapshot: Json
          snapshot_data: Json
          version_number: number
        }
        Update: {
          characters_snapshot?: Json | null
          created_at?: string
          created_by?: string
          id?: string
          project_id?: string
          scenes_snapshot?: Json
          snapshot_data?: Json
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          ai_twin_image_path: string | null
          audio_file_path: string | null
          bpm: number | null
          camera_motion: number | null
          created_at: string | null
          emotion_intensity: number | null
          fantasy_realism: number | null
          id: string
          lyrics: string | null
          mood: string | null
          name: string
          status: string | null
          style_preset: string | null
          tempo_map: Json | null
          updated_at: string | null
          user_id: string | null
          video_provider: string | null
        }
        Insert: {
          ai_twin_image_path?: string | null
          audio_file_path?: string | null
          bpm?: number | null
          camera_motion?: number | null
          created_at?: string | null
          emotion_intensity?: number | null
          fantasy_realism?: number | null
          id?: string
          lyrics?: string | null
          mood?: string | null
          name?: string
          status?: string | null
          style_preset?: string | null
          tempo_map?: Json | null
          updated_at?: string | null
          user_id?: string | null
          video_provider?: string | null
        }
        Update: {
          ai_twin_image_path?: string | null
          audio_file_path?: string | null
          bpm?: number | null
          camera_motion?: number | null
          created_at?: string | null
          emotion_intensity?: number | null
          fantasy_realism?: number | null
          id?: string
          lyrics?: string | null
          mood?: string | null
          name?: string
          status?: string | null
          style_preset?: string | null
          tempo_map?: Json | null
          updated_at?: string | null
          user_id?: string | null
          video_provider?: string | null
        }
        Relationships: []
      }
      provider_health: {
        Row: {
          avg_response_time_ms: number | null
          checked_at: string
          error_count_1h: number
          id: string
          last_error_message: string | null
          last_failure_at: string | null
          last_success_at: string | null
          provider_name: string
          status: string
          success_count_1h: number
        }
        Insert: {
          avg_response_time_ms?: number | null
          checked_at?: string
          error_count_1h?: number
          id?: string
          last_error_message?: string | null
          last_failure_at?: string | null
          last_success_at?: string | null
          provider_name: string
          status: string
          success_count_1h?: number
        }
        Update: {
          avg_response_time_ms?: number | null
          checked_at?: string
          error_count_1h?: number
          id?: string
          last_error_message?: string | null
          last_failure_at?: string | null
          last_success_at?: string | null
          provider_name?: string
          status?: string
          success_count_1h?: number
        }
        Relationships: []
      }
      render_credits: {
        Row: {
          balance: number
          created_at: string
          id: string
          total_earned: number
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scenes: {
        Row: {
          camera_preset: string | null
          created_at: string | null
          description: string
          end_time: number
          generated_video_url: string | null
          id: string
          intensity: number
          mood: string
          project_id: string | null
          scene_order: number
          scene_type: string
          start_time: number
        }
        Insert: {
          camera_preset?: string | null
          created_at?: string | null
          description: string
          end_time: number
          generated_video_url?: string | null
          id?: string
          intensity: number
          mood: string
          project_id?: string | null
          scene_order: number
          scene_type: string
          start_time: number
        }
        Update: {
          camera_preset?: string | null
          created_at?: string | null
          description?: string
          end_time?: number
          generated_video_url?: string | null
          id?: string
          intensity?: number
          mood?: string
          project_id?: string | null
          scene_order?: number
          scene_type?: string
          start_time?: number
        }
        Relationships: [
          {
            foreignKeyName: "scenes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      social_connections: {
        Row: {
          access_token: string | null
          connected: boolean
          created_at: string
          expires_at: string | null
          id: string
          platform: string
          platform_name: string
          refresh_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          connected?: boolean
          created_at?: string
          expires_at?: string | null
          id?: string
          platform: string
          platform_name: string
          refresh_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          connected?: boolean
          created_at?: string
          expires_at?: string | null
          id?: string
          platform?: string
          platform_name?: string
          refresh_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tempo_maps: {
        Row: {
          beat_grid: Json
          bpm_points: Json
          created_at: string
          id: string
          project_id: string
          time_signature: string
        }
        Insert: {
          beat_grid: Json
          bpm_points: Json
          created_at?: string
          id?: string
          project_id: string
          time_signature?: string
        }
        Update: {
          beat_grid?: Json
          bpm_points?: Json
          created_at?: string
          id?: string
          project_id?: string
          time_signature?: string
        }
        Relationships: [
          {
            foreignKeyName: "tempo_maps_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_recommendations: {
        Row: {
          audience_size: string
          best_month: string
          city: string
          created_at: string
          id: string
          match_score: number
          reason: string
          user_id: string
          venues: Json
        }
        Insert: {
          audience_size: string
          best_month: string
          city: string
          created_at?: string
          id?: string
          match_score: number
          reason: string
          user_id: string
          venues?: Json
        }
        Update: {
          audience_size?: string
          best_month?: string
          city?: string
          created_at?: string
          id?: string
          match_score?: number
          reason?: string
          user_id?: string
          venues?: Json
        }
        Relationships: []
      }
      track_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          track_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          track_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          track_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      track_likes: {
        Row: {
          created_at: string
          id: string
          track_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          track_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_likes_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "published_tracks_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "track_likes_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      track_presaves: {
        Row: {
          artist_id: string
          id: string
          notified: boolean | null
          presaved_at: string
          track_id: string
          user_id: string
        }
        Insert: {
          artist_id: string
          id?: string
          notified?: boolean | null
          presaved_at?: string
          track_id: string
          user_id: string
        }
        Update: {
          artist_id?: string
          id?: string
          notified?: boolean | null
          presaved_at?: string
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_presaves_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "published_tracks_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "track_presaves_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      tracks: {
        Row: {
          ai_tags: Json | null
          album_cover_bucket: string | null
          album_cover_path: string | null
          album_id: string | null
          artist_name: string
          audio_quality: string | null
          bpm: number | null
          created_at: string
          duration: number
          file_path: string
          genre: string | null
          id: string
          is_published: boolean | null
          key: string | null
          like_count: number | null
          mood: string | null
          motion_cover_bucket: string | null
          motion_cover_path: string | null
          play_count: number | null
          release_date: string | null
          title: string
          track_number: number | null
          updated_at: string
          user_id: string
          waveform_data: Json | null
        }
        Insert: {
          ai_tags?: Json | null
          album_cover_bucket?: string | null
          album_cover_path?: string | null
          album_id?: string | null
          artist_name: string
          audio_quality?: string | null
          bpm?: number | null
          created_at?: string
          duration: number
          file_path: string
          genre?: string | null
          id?: string
          is_published?: boolean | null
          key?: string | null
          like_count?: number | null
          mood?: string | null
          motion_cover_bucket?: string | null
          motion_cover_path?: string | null
          play_count?: number | null
          release_date?: string | null
          title: string
          track_number?: number | null
          updated_at?: string
          user_id: string
          waveform_data?: Json | null
        }
        Update: {
          ai_tags?: Json | null
          album_cover_bucket?: string | null
          album_cover_path?: string | null
          album_id?: string | null
          artist_name?: string
          audio_quality?: string | null
          bpm?: number | null
          created_at?: string
          duration?: number
          file_path?: string
          genre?: string | null
          id?: string
          is_published?: boolean | null
          key?: string | null
          like_count?: number | null
          mood?: string | null
          motion_cover_bucket?: string | null
          motion_cover_path?: string | null
          play_count?: number | null
          release_date?: string | null
          title?: string
          track_number?: number | null
          updated_at?: string
          user_id?: string
          waveform_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "tracks_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
        ]
      }
      upload_rate_limits: {
        Row: {
          id: string
          uploads_count: number
          user_id: string
          window_start: string
        }
        Insert: {
          id?: string
          uploads_count?: number
          user_id: string
          window_start?: string
        }
        Update: {
          id?: string
          uploads_count?: number
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      upload_sessions: {
        Row: {
          chunk_size_bytes: number
          chunks_uploaded: Json
          created_at: string
          error_message: string | null
          expires_at: string
          file_name: string
          file_size_bytes: number
          id: string
          project_id: string | null
          status: string
          storage_path: string | null
          total_chunks: number
          updated_at: string
          user_id: string
        }
        Insert: {
          chunk_size_bytes?: number
          chunks_uploaded?: Json
          created_at?: string
          error_message?: string | null
          expires_at?: string
          file_name: string
          file_size_bytes: number
          id?: string
          project_id?: string | null
          status?: string
          storage_path?: string | null
          total_chunks: number
          updated_at?: string
          user_id: string
        }
        Update: {
          chunk_size_bytes?: number
          chunks_uploaded?: Json
          created_at?: string
          error_message?: string | null
          expires_at?: string
          file_name?: string
          file_size_bytes?: number
          id?: string
          project_id?: string | null
          status?: string
          storage_path?: string | null
          total_chunks?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_library: {
        Row: {
          album_id: string | null
          created_at: string
          id: string
          library_type: string
          playlist_id: string | null
          track_id: string | null
          user_id: string
        }
        Insert: {
          album_id?: string | null
          created_at?: string
          id?: string
          library_type: string
          playlist_id?: string | null
          track_id?: string | null
          user_id: string
        }
        Update: {
          album_id?: string | null
          created_at?: string
          id?: string
          library_type?: string
          playlist_id?: string | null
          track_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_library_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_library_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_library_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "published_tracks_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_library_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      published_tracks_view: {
        Row: {
          ai_tags: Json | null
          album_cover_bucket: string | null
          album_cover_path: string | null
          album_id: string | null
          album_title: string | null
          artist_name: string | null
          bpm: number | null
          created_at: string | null
          duration: number | null
          file_path: string | null
          genre: string | null
          id: string | null
          like_count: number | null
          mood: string | null
          play_count: number | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tracks_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      check_upload_rate_limit: { Args: { p_user_id: string }; Returns: boolean }
      deduct_render_credits:
        | {
            Args: {
              p_amount: number
              p_description?: string
              p_user_id: string
            }
            Returns: number
          }
        | {
            Args: {
              p_amount: number
              p_reference_id: string
              p_reference_type: string
              p_user_id: string
            }
            Returns: number
          }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_audit: {
        Args: {
          p_action: string
          p_metadata?: Json
          p_resource_id?: string
          p_resource_type: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "verified_artist"
        | "artist"
        | "user"
        | "listener"
        | "manager"
      collaboration_permission:
        | "view_tracks"
        | "edit_tracks"
        | "upload_tracks"
        | "delete_tracks"
        | "view_analytics"
        | "manage_albums"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "verified_artist",
        "artist",
        "user",
        "listener",
        "manager",
      ],
      collaboration_permission: [
        "view_tracks",
        "edit_tracks",
        "upload_tracks",
        "delete_tracks",
        "view_analytics",
        "manage_albums",
      ],
    },
  },
} as const
