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
      activity_log: {
        Row: {
          activity_type: string
          created_at: string
          id: string
          is_public: boolean | null
          metadata: Json | null
          target_id: string | null
          target_type: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ad_campaigns: {
        Row: {
          age_max: number
          age_min: number
          approved_at: string | null
          approved_by: string | null
          artist_id: string
          countries: string[]
          created_at: string
          created_by: string | null
          creatives: Json
          destination_url: string
          duration_days: number
          error: string | null
          external: Json
          goal: string
          id: string
          keywords: string[]
          last_optimized_on: string | null
          name: string
          plan: Json | null
          platform: string
          spent_cents: number
          start_date: string
          status: string
          total_budget_cents: number
          updated_at: string
        }
        Insert: {
          age_max?: number
          age_min?: number
          approved_at?: string | null
          approved_by?: string | null
          artist_id: string
          countries?: string[]
          created_at?: string
          created_by?: string | null
          creatives?: Json
          destination_url: string
          duration_days: number
          error?: string | null
          external?: Json
          goal?: string
          id?: string
          keywords?: string[]
          last_optimized_on?: string | null
          name: string
          plan?: Json | null
          platform: string
          spent_cents?: number
          start_date: string
          status?: string
          total_budget_cents: number
          updated_at?: string
        }
        Update: {
          age_max?: number
          age_min?: number
          approved_at?: string | null
          approved_by?: string | null
          artist_id?: string
          countries?: string[]
          created_at?: string
          created_by?: string | null
          creatives?: Json
          destination_url?: string
          duration_days?: number
          error?: string | null
          external?: Json
          goal?: string
          id?: string
          keywords?: string[]
          last_optimized_on?: string | null
          name?: string
          plan?: Json | null
          platform?: string
          spent_cents?: number
          start_date?: string
          status?: string
          total_budget_cents?: number
          updated_at?: string
        }
        Relationships: []
      }
      ad_connections: {
        Row: {
          account_id: string | null
          account_name: string | null
          artist_id: string
          choices: Json | null
          connected_by: string | null
          currency: string | null
          error: string | null
          page_id: string | null
          platform: string
          refresh_cipher: string | null
          status: string
          token_cipher: string
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          account_name?: string | null
          artist_id: string
          choices?: Json | null
          connected_by?: string | null
          currency?: string | null
          error?: string | null
          page_id?: string | null
          platform: string
          refresh_cipher?: string | null
          status?: string
          token_cipher: string
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          account_name?: string | null
          artist_id?: string
          choices?: Json | null
          connected_by?: string | null
          currency?: string | null
          error?: string | null
          page_id?: string | null
          platform?: string
          refresh_cipher?: string | null
          status?: string
          token_cipher?: string
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ad_daily_reports: {
        Row: {
          budget_next_cents: number | null
          campaign_id: string
          clicks: number
          created_at: string
          day_number: number
          decisions: Json
          id: string
          impressions: number
          phase: string | null
          report_date: string
          smart_link_visits: number
          spend_cents: number
          summary: string
        }
        Insert: {
          budget_next_cents?: number | null
          campaign_id: string
          clicks?: number
          created_at?: string
          day_number: number
          decisions?: Json
          id?: string
          impressions?: number
          phase?: string | null
          report_date: string
          smart_link_visits?: number
          spend_cents?: number
          summary: string
        }
        Update: {
          budget_next_cents?: number | null
          campaign_id?: string
          clicks?: number
          created_at?: string
          day_number?: number
          decisions?: Json
          id?: string
          impressions?: number
          phase?: string | null
          report_date?: string
          smart_link_visits?: number
          spend_cents?: number
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_daily_reports_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_oauth_states: {
        Row: {
          artist_id: string
          created_at: string
          created_by: string
          platform: string
          state: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          created_by: string
          platform: string
          state?: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          created_by?: string
          platform?: string
          state?: string
        }
        Relationships: []
      }
      albums: {
        Row: {
          apple_motion_art_1x1: string | null
          apple_motion_art_3x4: string | null
          artist_name: string
          c_line: string | null
          copyright_owner: string | null
          copyright_year: number | null
          cover_art_path: string | null
          created_at: string
          description: string | null
          explicit: boolean | null
          genre: string | null
          id: string
          is_published: boolean | null
          label: string | null
          language: string | null
          metadata_complete: boolean | null
          motion_cover_bucket: string | null
          motion_cover_path: string | null
          original_release_date: string | null
          p_line: string | null
          play_count: number | null
          preorder_date: string | null
          release_date: string | null
          release_type: string | null
          scheduled_release_date: string | null
          title: string
          total_duration: number | null
          total_tracks: number | null
          upc: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          apple_motion_art_1x1?: string | null
          apple_motion_art_3x4?: string | null
          artist_name: string
          c_line?: string | null
          copyright_owner?: string | null
          copyright_year?: number | null
          cover_art_path?: string | null
          created_at?: string
          description?: string | null
          explicit?: boolean | null
          genre?: string | null
          id?: string
          is_published?: boolean | null
          label?: string | null
          language?: string | null
          metadata_complete?: boolean | null
          motion_cover_bucket?: string | null
          motion_cover_path?: string | null
          original_release_date?: string | null
          p_line?: string | null
          play_count?: number | null
          preorder_date?: string | null
          release_date?: string | null
          release_type?: string | null
          scheduled_release_date?: string | null
          title: string
          total_duration?: number | null
          total_tracks?: number | null
          upc?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          apple_motion_art_1x1?: string | null
          apple_motion_art_3x4?: string | null
          artist_name?: string
          c_line?: string | null
          copyright_owner?: string | null
          copyright_year?: number | null
          cover_art_path?: string | null
          created_at?: string
          description?: string | null
          explicit?: boolean | null
          genre?: string | null
          id?: string
          is_published?: boolean | null
          label?: string | null
          language?: string | null
          metadata_complete?: boolean | null
          motion_cover_bucket?: string | null
          motion_cover_path?: string | null
          original_release_date?: string | null
          p_line?: string | null
          play_count?: number | null
          preorder_date?: string | null
          release_date?: string | null
          release_type?: string | null
          scheduled_release_date?: string | null
          title?: string
          total_duration?: number | null
          total_tracks?: number | null
          upc?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      artist_autopilot: {
        Row: {
          auto_analytics_reports: boolean
          auto_fan_engagement: boolean
          auto_momentum_tracking: boolean
          auto_playlist_pitching: boolean
          auto_publish_releases: boolean
          auto_revenue_optimization: boolean
          auto_social_posting: boolean
          created_at: string
          id: string
          is_enabled: boolean
          last_run_at: string | null
          run_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_analytics_reports?: boolean
          auto_fan_engagement?: boolean
          auto_momentum_tracking?: boolean
          auto_playlist_pitching?: boolean
          auto_publish_releases?: boolean
          auto_revenue_optimization?: boolean
          auto_social_posting?: boolean
          created_at?: string
          id?: string
          is_enabled?: boolean
          last_run_at?: string | null
          run_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_analytics_reports?: boolean
          auto_fan_engagement?: boolean
          auto_momentum_tracking?: boolean
          auto_playlist_pitching?: boolean
          auto_publish_releases?: boolean
          auto_revenue_optimization?: boolean
          auto_social_posting?: boolean
          created_at?: string
          id?: string
          is_enabled?: boolean
          last_run_at?: string | null
          run_count?: number
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
      artist_contacts: {
        Row: {
          artist_id: string
          bounced_at: string | null
          city: string | null
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          imported_at: string | null
          last_name: string | null
          phone: string | null
          source: string | null
          subscribed: boolean | null
          tags: string[] | null
          unsubscribe_token: string
          unsubscribed_at: string | null
        }
        Insert: {
          artist_id: string
          bounced_at?: string | null
          city?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          id?: string
          imported_at?: string | null
          last_name?: string | null
          phone?: string | null
          source?: string | null
          subscribed?: boolean | null
          tags?: string[] | null
          unsubscribe_token?: string
          unsubscribed_at?: string | null
        }
        Update: {
          artist_id?: string
          bounced_at?: string | null
          city?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          imported_at?: string | null
          last_name?: string | null
          phone?: string | null
          source?: string | null
          subscribed?: boolean | null
          tags?: string[] | null
          unsubscribe_token?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      artist_earnings: {
        Row: {
          artist_id: string
          created_at: string
          download_revenue: number
          id: string
          idempotency_key: string | null
          payout_date: string | null
          payout_status: string
          period_end: string
          period_start: string
          streaming_revenue: number
          tip_revenue: number
          total_downloads: number
          total_earnings: number | null
          total_streams: number
          updated_at: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          download_revenue?: number
          id?: string
          idempotency_key?: string | null
          payout_date?: string | null
          payout_status?: string
          period_end: string
          period_start: string
          streaming_revenue?: number
          tip_revenue?: number
          total_downloads?: number
          total_earnings?: number | null
          total_streams?: number
          updated_at?: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          download_revenue?: number
          id?: string
          idempotency_key?: string | null
          payout_date?: string | null
          payout_status?: string
          period_end?: string
          period_start?: string
          streaming_revenue?: number
          tip_revenue?: number
          total_downloads?: number
          total_earnings?: number | null
          total_streams?: number
          updated_at?: string
        }
        Relationships: []
      }
      artist_eventbrite_tokens: {
        Row: {
          access_token: string
          connected_at: string | null
          id: string
          organization_id: string | null
          organization_name: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          connected_at?: string | null
          id?: string
          organization_id?: string | null
          organization_name?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          connected_at?: string | null
          id?: string
          organization_id?: string | null
          organization_name?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      artist_milestones: {
        Row: {
          achieved_at: string | null
          artist_id: string
          id: string
          milestone_id: string | null
          play_count_at_time: number | null
        }
        Insert: {
          achieved_at?: string | null
          artist_id: string
          id?: string
          milestone_id?: string | null
          play_count_at_time?: number | null
        }
        Update: {
          achieved_at?: string | null
          artist_id?: string
          id?: string
          milestone_id?: string | null
          play_count_at_time?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_milestones_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestone_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_narrative: {
        Row: {
          artist_mission: string | null
          brand_voice: string | null
          color_palette: Json | null
          created_at: string
          current_chapter: string | null
          defining_moment: string | null
          emotional_core: string | null
          future_vision: string | null
          id: string
          key_phrases: string[] | null
          narrative_arc: string | null
          narrative_strength: number | null
          origin_story: string | null
          target_audience: string | null
          typography: Json | null
          unique_value_prop: string | null
          updated_at: string
          user_id: string
          visual_style: string | null
        }
        Insert: {
          artist_mission?: string | null
          brand_voice?: string | null
          color_palette?: Json | null
          created_at?: string
          current_chapter?: string | null
          defining_moment?: string | null
          emotional_core?: string | null
          future_vision?: string | null
          id?: string
          key_phrases?: string[] | null
          narrative_arc?: string | null
          narrative_strength?: number | null
          origin_story?: string | null
          target_audience?: string | null
          typography?: Json | null
          unique_value_prop?: string | null
          updated_at?: string
          user_id: string
          visual_style?: string | null
        }
        Update: {
          artist_mission?: string | null
          brand_voice?: string | null
          color_palette?: Json | null
          created_at?: string
          current_chapter?: string | null
          defining_moment?: string | null
          emotional_core?: string | null
          future_vision?: string | null
          id?: string
          key_phrases?: string[] | null
          narrative_arc?: string | null
          narrative_strength?: number | null
          origin_story?: string | null
          target_audience?: string | null
          typography?: Json | null
          unique_value_prop?: string | null
          updated_at?: string
          user_id?: string
          visual_style?: string | null
        }
        Relationships: []
      }
      artist_payout_details: {
        Row: {
          account_holder_name: string | null
          artist_id: string
          bank_token_reference: string | null
          created_at: string
          id: string
          last_payout_date: string | null
          last_stripe_event_at: string | null
          payout_enabled: boolean
          square_access_token: string | null
          square_customer_id: string | null
          square_refresh_token: string | null
          square_token_expires_at: string | null
          stripe_connect_id: string | null
          updated_at: string
        }
        Insert: {
          account_holder_name?: string | null
          artist_id: string
          bank_token_reference?: string | null
          created_at?: string
          id?: string
          last_payout_date?: string | null
          last_stripe_event_at?: string | null
          payout_enabled?: boolean
          square_access_token?: string | null
          square_customer_id?: string | null
          square_refresh_token?: string | null
          square_token_expires_at?: string | null
          stripe_connect_id?: string | null
          updated_at?: string
        }
        Update: {
          account_holder_name?: string | null
          artist_id?: string
          bank_token_reference?: string | null
          created_at?: string
          id?: string
          last_payout_date?: string | null
          last_stripe_event_at?: string | null
          payout_enabled?: boolean
          square_access_token?: string | null
          square_customer_id?: string | null
          square_refresh_token?: string | null
          square_token_expires_at?: string | null
          stripe_connect_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      artist_payouts: {
        Row: {
          amount: number
          artist_id: string
          completed_at: string | null
          created_at: string
          earnings_ids: string[] | null
          error_message: string | null
          id: string
          processed_by: string | null
          square_payout_id: string | null
          status: string
        }
        Insert: {
          amount: number
          artist_id: string
          completed_at?: string | null
          created_at?: string
          earnings_ids?: string[] | null
          error_message?: string | null
          id?: string
          processed_by?: string | null
          square_payout_id?: string | null
          status?: string
        }
        Update: {
          amount?: number
          artist_id?: string
          completed_at?: string | null
          created_at?: string
          earnings_ids?: string[] | null
          error_message?: string | null
          id?: string
          processed_by?: string | null
          square_payout_id?: string | null
          status?: string
        }
        Relationships: []
      }
      artist_profiles: {
        Row: {
          artist_name: string
          banner_image_path: string | null
          bio: string | null
          created_at: string
          genre: string | null
          id: string
          monthly_listeners: number | null
          profile_image_path: string | null
          social_links: Json | null
          total_plays: number | null
          updated_at: string
          user_id: string
          verified: boolean | null
          website: string | null
        }
        Insert: {
          artist_name: string
          banner_image_path?: string | null
          bio?: string | null
          created_at?: string
          genre?: string | null
          id?: string
          monthly_listeners?: number | null
          profile_image_path?: string | null
          social_links?: Json | null
          total_plays?: number | null
          updated_at?: string
          user_id: string
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          artist_name?: string
          banner_image_path?: string | null
          bio?: string | null
          created_at?: string
          genre?: string | null
          id?: string
          monthly_listeners?: number | null
          profile_image_path?: string | null
          social_links?: Json | null
          total_plays?: number | null
          updated_at?: string
          user_id?: string
          verified?: boolean | null
          website?: string | null
        }
        Relationships: []
      }
      artist_shopify_config: {
        Row: {
          artist_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          store_domain: string
          storefront_token: string
          updated_at: string | null
        }
        Insert: {
          artist_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          store_domain: string
          storefront_token: string
          updated_at?: string | null
        }
        Update: {
          artist_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          store_domain?: string
          storefront_token?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      artist_tips: {
        Row: {
          amount: number
          artist_id: string
          created_at: string
          currency: string
          id: string
          message: string | null
          square_payment_id: string | null
          status: string
          tipper_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          artist_id: string
          created_at?: string
          currency?: string
          id?: string
          message?: string | null
          square_payment_id?: string | null
          status?: string
          tipper_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          artist_id?: string
          created_at?: string
          currency?: string
          id?: string
          message?: string | null
          square_payment_id?: string | null
          status?: string
          tipper_id?: string
          updated_at?: string
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
      autopilot_logs: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          status: string
          summary: string | null
          task_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          status?: string
          summary?: string | null
          task_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          status?: string
          summary?: string | null
          task_type?: string
          user_id?: string
        }
        Relationships: []
      }
      blocked_entities: {
        Row: {
          blocked_at: string
          blocked_by: string | null
          entity_type: string
          entity_value: string
          expires_at: string | null
          id: string
          reason: string | null
        }
        Insert: {
          blocked_at?: string
          blocked_by?: string | null
          entity_type: string
          entity_value: string
          expires_at?: string | null
          id?: string
          reason?: string | null
        }
        Update: {
          blocked_at?: string
          blocked_by?: string | null
          entity_type?: string
          entity_value?: string
          expires_at?: string | null
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      catalog_api_usage: {
        Row: {
          day: string
          units: number
        }
        Insert: {
          day?: string
          units?: number
        }
        Update: {
          day?: string
          units?: number
        }
        Relationships: []
      }
      catalog_artists: {
        Row: {
          artist_type: string | null
          country: string | null
          created_at: string
          disambiguation: string | null
          genres: string[]
          id: string
          image_url: string | null
          mbid: string | null
          name: string
          norm_name: string
          status: string
          sync_error: string | null
          sync_started_at: string | null
          synced_at: string | null
          tdz_user_id: string | null
          updated_at: string
          youtube_channel_id: string | null
        }
        Insert: {
          artist_type?: string | null
          country?: string | null
          created_at?: string
          disambiguation?: string | null
          genres?: string[]
          id?: string
          image_url?: string | null
          mbid?: string | null
          name: string
          norm_name: string
          status?: string
          sync_error?: string | null
          sync_started_at?: string | null
          synced_at?: string | null
          tdz_user_id?: string | null
          updated_at?: string
          youtube_channel_id?: string | null
        }
        Update: {
          artist_type?: string | null
          country?: string | null
          created_at?: string
          disambiguation?: string | null
          genres?: string[]
          id?: string
          image_url?: string | null
          mbid?: string | null
          name?: string
          norm_name?: string
          status?: string
          sync_error?: string | null
          sync_started_at?: string | null
          synced_at?: string | null
          tdz_user_id?: string | null
          updated_at?: string
          youtube_channel_id?: string | null
        }
        Relationships: []
      }
      catalog_releases: {
        Row: {
          artist_id: string
          cover_url: string | null
          created_at: string
          id: string
          mbid: string | null
          norm_title: string
          release_date: string | null
          release_type: string
          title: string
          tracklist_synced: boolean
          year: number | null
        }
        Insert: {
          artist_id: string
          cover_url?: string | null
          created_at?: string
          id?: string
          mbid?: string | null
          norm_title: string
          release_date?: string | null
          release_type?: string
          title: string
          tracklist_synced?: boolean
          year?: number | null
        }
        Update: {
          artist_id?: string
          cover_url?: string | null
          created_at?: string
          id?: string
          mbid?: string | null
          norm_title?: string
          release_date?: string | null
          release_type?: string
          title?: string
          tracklist_synced?: boolean
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_releases_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "catalog_artists"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_tracks: {
        Row: {
          artist_id: string
          created_at: string
          duration_sec: number | null
          id: string
          lookup_failed: boolean
          mb_recording: string | null
          norm_title: string
          position: number | null
          release_id: string | null
          title: string
          view_count: number | null
          youtube_id: string | null
        }
        Insert: {
          artist_id: string
          created_at?: string
          duration_sec?: number | null
          id?: string
          lookup_failed?: boolean
          mb_recording?: string | null
          norm_title: string
          position?: number | null
          release_id?: string | null
          title: string
          view_count?: number | null
          youtube_id?: string | null
        }
        Update: {
          artist_id?: string
          created_at?: string
          duration_sec?: number | null
          id?: string
          lookup_failed?: boolean
          mb_recording?: string | null
          norm_title?: string
          position?: number | null
          release_id?: string | null
          title?: string
          view_count?: number | null
          youtube_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_tracks_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "catalog_artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_tracks_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "catalog_releases"
            referencedColumns: ["id"]
          },
        ]
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
      collaboration_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_resolved: boolean
          timestamp_seconds: number | null
          track_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_resolved?: boolean
          timestamp_seconds?: number | null
          track_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_resolved?: boolean
          timestamp_seconds?: number | null
          track_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_comments_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "published_tracks_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaboration_comments_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      collaborator_invites: {
        Row: {
          artist_id: string
          created_at: string
          email_error: string | null
          email_status: string | null
          expires_at: string
          id: string
          invited_email: string
          inviter_name: string | null
          kind: string
          last_sent_at: string | null
          message: string | null
          permissions: Json
          responded_at: string | null
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          email_error?: string | null
          email_status?: string | null
          expires_at?: string
          id?: string
          invited_email: string
          inviter_name?: string | null
          kind?: string
          last_sent_at?: string | null
          message?: string | null
          permissions?: Json
          responded_at?: string | null
          status?: string
          token?: string
          updated_at?: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          email_error?: string | null
          email_status?: string | null
          expires_at?: string
          id?: string
          invited_email?: string
          inviter_name?: string | null
          kind?: string
          last_sent_at?: string | null
          message?: string | null
          permissions?: Json
          responded_at?: string | null
          status?: string
          token?: string
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
      comments: {
        Row: {
          album_id: string | null
          content: string
          created_at: string
          id: string
          is_hidden: boolean | null
          is_pinned: boolean | null
          like_count: number | null
          parent_type: string
          playlist_id: string | null
          post_id: string | null
          reply_count: number | null
          reply_to_id: string | null
          track_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          album_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_hidden?: boolean | null
          is_pinned?: boolean | null
          like_count?: number | null
          parent_type: string
          playlist_id?: string | null
          post_id?: string | null
          reply_count?: number | null
          reply_to_id?: string | null
          track_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          album_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_hidden?: boolean | null
          is_pinned?: boolean | null
          like_count?: number | null
          parent_type?: string
          playlist_id?: string | null
          post_id?: string | null
          reply_count?: number | null
          reply_to_id?: string | null
          track_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "published_tracks_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      content_calendar: {
        Row: {
          content_type: string
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          platform: string | null
          scheduled_date: string
          scheduled_time: string | null
          status: string | null
          title: string
          user_id: string
        }
        Insert: {
          content_type: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          platform?: string | null
          scheduled_date: string
          scheduled_time?: string | null
          status?: string | null
          title: string
          user_id: string
        }
        Update: {
          content_type?: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          platform?: string | null
          scheduled_date?: string
          scheduled_time?: string | null
          status?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      content_library: {
        Row: {
          content_type: string
          created_at: string
          description: string | null
          file_path: string | null
          id: string
          tags: Json | null
          thumbnail_path: string | null
          title: string
          user_id: string
        }
        Insert: {
          content_type: string
          created_at?: string
          description?: string | null
          file_path?: string | null
          id?: string
          tags?: Json | null
          thumbnail_path?: string | null
          title: string
          user_id: string
        }
        Update: {
          content_type?: string
          created_at?: string
          description?: string | null
          file_path?: string | null
          id?: string
          tags?: Json | null
          thumbnail_path?: string | null
          title?: string
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
      curated_playlists: {
        Row: {
          cover_url: string | null
          created_at: string
          genre: string | null
          id: string
          last_updated: string | null
          name: string
          track_count: number | null
          tracks: Json | null
          youtube_playlist_id: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          genre?: string | null
          id?: string
          last_updated?: string | null
          name: string
          track_count?: number | null
          tracks?: Json | null
          youtube_playlist_id: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          genre?: string | null
          id?: string
          last_updated?: string | null
          name?: string
          track_count?: number | null
          tracks?: Json | null
          youtube_playlist_id?: string
        }
        Relationships: []
      }
      device_fingerprints: {
        Row: {
          fingerprint: string
          first_seen_at: string | null
          flag_reason: string | null
          id: string
          is_flagged: boolean | null
          last_seen_at: string | null
          streams_today: number | null
          unique_users_count: number | null
          user_ids: string[] | null
        }
        Insert: {
          fingerprint: string
          first_seen_at?: string | null
          flag_reason?: string | null
          id?: string
          is_flagged?: boolean | null
          last_seen_at?: string | null
          streams_today?: number | null
          unique_users_count?: number | null
          user_ids?: string[] | null
        }
        Update: {
          fingerprint?: string
          first_seen_at?: string | null
          flag_reason?: string | null
          id?: string
          is_flagged?: boolean | null
          last_seen_at?: string | null
          streams_today?: number | null
          unique_users_count?: number | null
          user_ids?: string[] | null
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      download_purchases: {
        Row: {
          artist_id: string
          artist_revenue: number
          buyer_id: string
          created_at: string
          id: string
          payment_status: string
          price: number
          stripe_session_id: string | null
          track_id: string
          transaction_fee: number
        }
        Insert: {
          artist_id: string
          artist_revenue: number
          buyer_id: string
          created_at?: string
          id?: string
          payment_status?: string
          price: number
          stripe_session_id?: string | null
          track_id: string
          transaction_fee?: number
        }
        Update: {
          artist_id?: string
          artist_revenue?: number
          buyer_id?: string
          created_at?: string
          id?: string
          payment_status?: string
          price?: number
          stripe_session_id?: string | null
          track_id?: string
          transaction_fee?: number
        }
        Relationships: [
          {
            foreignKeyName: "download_purchases_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "published_tracks_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "download_purchases_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaign_sends: {
        Row: {
          campaign_id: string
          clicked_at: string | null
          contact_id: string | null
          created_at: string
          email: string
          error: string | null
          id: string
          opened_at: string | null
          provider_id: string | null
          status: string
        }
        Insert: {
          campaign_id: string
          clicked_at?: string | null
          contact_id?: string | null
          created_at?: string
          email: string
          error?: string | null
          id?: string
          opened_at?: string | null
          provider_id?: string | null
          status?: string
        }
        Update: {
          campaign_id?: string
          clicked_at?: string | null
          contact_id?: string | null
          created_at?: string
          email?: string
          error?: string | null
          id?: string
          opened_at?: string | null
          provider_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaign_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaign_sends_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "artist_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          artist_id: string
          audience_tags: string[]
          body_html: string
          bounced: number
          clicked: number
          complained: number
          created_at: string
          delivered: number
          error: string | null
          id: string
          opened: number
          preview_text: string | null
          recipients: number
          scheduled_at: string | null
          sent_at: string | null
          started_at: string | null
          status: string
          subject: string
          unsubscribed: number
          updated_at: string
        }
        Insert: {
          artist_id: string
          audience_tags?: string[]
          body_html: string
          bounced?: number
          clicked?: number
          complained?: number
          created_at?: string
          delivered?: number
          error?: string | null
          id?: string
          opened?: number
          preview_text?: string | null
          recipients?: number
          scheduled_at?: string | null
          sent_at?: string | null
          started_at?: string | null
          status?: string
          subject: string
          unsubscribed?: number
          updated_at?: string
        }
        Update: {
          artist_id?: string
          audience_tags?: string[]
          body_html?: string
          bounced?: number
          clicked?: number
          complained?: number
          created_at?: string
          delivered?: number
          error?: string | null
          id?: string
          opened?: number
          preview_text?: string | null
          recipients?: number
          scheduled_at?: string | null
          sent_at?: string | null
          started_at?: string | null
          status?: string
          subject?: string
          unsubscribed?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      enterprise_branding: {
        Row: {
          accent_color: string | null
          background_color: string | null
          created_at: string
          custom_font: string | null
          hide_tdz_branding: boolean | null
          id: string
          label_name: string | null
          logo_path: string | null
          sidebar_color: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accent_color?: string | null
          background_color?: string | null
          created_at?: string
          custom_font?: string | null
          hide_tdz_branding?: boolean | null
          id?: string
          label_name?: string | null
          logo_path?: string | null
          sidebar_color?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accent_color?: string | null
          background_color?: string | null
          created_at?: string
          custom_font?: string | null
          hide_tdz_branding?: boolean | null
          id?: string
          label_name?: string | null
          logo_path?: string | null
          sidebar_color?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exec_conversations: {
        Row: {
          agent_type: string
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_type: string
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_type?: string
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exec_messages: {
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
            foreignKeyName: "exec_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "exec_conversations"
            referencedColumns: ["id"]
          },
        ]
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
      fan_badges: {
        Row: {
          badge_type: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_type: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_type?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      fan_engagement: {
        Row: {
          comments_made: number | null
          followers_count: number | null
          following_count: number | null
          id: string
          level: number | null
          likes_given: number | null
          playlists_created: number | null
          shares_made: number | null
          updated_at: string
          user_id: string
          xp_total: number | null
        }
        Insert: {
          comments_made?: number | null
          followers_count?: number | null
          following_count?: number | null
          id?: string
          level?: number | null
          likes_given?: number | null
          playlists_created?: number | null
          shares_made?: number | null
          updated_at?: string
          user_id: string
          xp_total?: number | null
        }
        Update: {
          comments_made?: number | null
          followers_count?: number | null
          following_count?: number | null
          id?: string
          level?: number | null
          likes_given?: number | null
          playlists_created?: number | null
          shares_made?: number | null
          updated_at?: string
          user_id?: string
          xp_total?: number | null
        }
        Relationships: []
      }
      fan_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
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
      inner_circle_config: {
        Row: {
          artist_id: string
          created_at: string
          id: string
          is_enabled: boolean | null
          monthly_price: number | null
          perks: string[] | null
          updated_at: string
          welcome_message: string | null
        }
        Insert: {
          artist_id: string
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          monthly_price?: number | null
          perks?: string[] | null
          updated_at?: string
          welcome_message?: string | null
        }
        Update: {
          artist_id?: string
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          monthly_price?: number | null
          perks?: string[] | null
          updated_at?: string
          welcome_message?: string | null
        }
        Relationships: []
      }
      inner_circle_members: {
        Row: {
          artist_id: string
          expires_at: string | null
          fan_id: string
          id: string
          joined_at: string
          status: string | null
        }
        Insert: {
          artist_id: string
          expires_at?: string | null
          fan_id: string
          id?: string
          joined_at?: string
          status?: string | null
        }
        Update: {
          artist_id?: string
          expires_at?: string | null
          fan_id?: string
          id?: string
          joined_at?: string
          status?: string | null
        }
        Relationships: []
      }
      ip_stream_tracking: {
        Row: {
          created_at: string
          day_window_start: string | null
          flag_reason: string | null
          id: string
          ip_address: unknown
          is_flagged: boolean | null
          streams_today: number | null
          unique_users_today: number | null
          updated_at: string
          user_ids: string[] | null
        }
        Insert: {
          created_at?: string
          day_window_start?: string | null
          flag_reason?: string | null
          id?: string
          ip_address: unknown
          is_flagged?: boolean | null
          streams_today?: number | null
          unique_users_today?: number | null
          updated_at?: string
          user_ids?: string[] | null
        }
        Update: {
          created_at?: string
          day_window_start?: string | null
          flag_reason?: string | null
          id?: string
          ip_address?: unknown
          is_flagged?: boolean | null
          streams_today?: number | null
          unique_users_today?: number | null
          updated_at?: string
          user_ids?: string[] | null
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
      liked_youtube_tracks: {
        Row: {
          artist_name: string
          created_at: string
          id: string
          source: string | null
          thumbnail: string | null
          title: string
          track_id: string
          user_id: string
          youtube_id: string | null
        }
        Insert: {
          artist_name: string
          created_at?: string
          id?: string
          source?: string | null
          thumbnail?: string | null
          title: string
          track_id: string
          user_id: string
          youtube_id?: string | null
        }
        Update: {
          artist_name?: string
          created_at?: string
          id?: string
          source?: string | null
          thumbnail?: string | null
          title?: string
          track_id?: string
          user_id?: string
          youtube_id?: string | null
        }
        Relationships: []
      }
      listener_demographics: {
        Row: {
          age_range: string | null
          artist_id: string
          browser: string | null
          city: string | null
          country: string | null
          country_code: string | null
          created_at: string
          device_type: string | null
          gender: string | null
          id: string
          language: string | null
          latitude: number | null
          listener_id: string | null
          listening_time_of_day: string | null
          longitude: number | null
          os: string | null
          referral_source: string | null
          region: string | null
          track_id: string | null
        }
        Insert: {
          age_range?: string | null
          artist_id: string
          browser?: string | null
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          device_type?: string | null
          gender?: string | null
          id?: string
          language?: string | null
          latitude?: number | null
          listener_id?: string | null
          listening_time_of_day?: string | null
          longitude?: number | null
          os?: string | null
          referral_source?: string | null
          region?: string | null
          track_id?: string | null
        }
        Update: {
          age_range?: string | null
          artist_id?: string
          browser?: string | null
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          device_type?: string | null
          gender?: string | null
          id?: string
          language?: string | null
          latitude?: number | null
          listener_id?: string | null
          listening_time_of_day?: string | null
          longitude?: number | null
          os?: string | null
          referral_source?: string | null
          region?: string | null
          track_id?: string | null
        }
        Relationships: []
      }
      listener_profiles: {
        Row: {
          age_range: string | null
          banner_image_path: string | null
          bio: string | null
          created_at: string
          discovery_source: string | null
          display_name: string
          favorite_genres: Json | null
          follower_count: number | null
          following_count: number | null
          gender: string | null
          id: string
          is_public: boolean | null
          location: string | null
          onboarding_completed: boolean
          profile_image_path: string | null
          social_links: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age_range?: string | null
          banner_image_path?: string | null
          bio?: string | null
          created_at?: string
          discovery_source?: string | null
          display_name: string
          favorite_genres?: Json | null
          follower_count?: number | null
          following_count?: number | null
          gender?: string | null
          id?: string
          is_public?: boolean | null
          location?: string | null
          onboarding_completed?: boolean
          profile_image_path?: string | null
          social_links?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age_range?: string | null
          banner_image_path?: string | null
          bio?: string | null
          created_at?: string
          discovery_source?: string | null
          display_name?: string
          favorite_genres?: Json | null
          follower_count?: number | null
          following_count?: number | null
          gender?: string | null
          id?: string
          is_public?: boolean | null
          location?: string | null
          onboarding_completed?: boolean
          profile_image_path?: string | null
          social_links?: Json | null
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
      lyrics_jobs: {
        Row: {
          attempts: number
          created_at: string
          error: string | null
          proxy_path: string | null
          status: string
          track_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          error?: string | null
          proxy_path?: string | null
          status?: string
          track_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          error?: string | null
          proxy_path?: string | null
          status?: string
          track_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lyrics_jobs_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: true
            referencedRelation: "published_tracks_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lyrics_jobs_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: true
            referencedRelation: "tracks"
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
      manager_integrations: {
        Row: {
          config: Json
          created_at: string
          credentials: Json
          display_name: string | null
          id: string
          last_sync_at: string | null
          manager_id: string
          provider: string
          status: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          credentials?: Json
          display_name?: string | null
          id?: string
          last_sync_at?: string | null
          manager_id: string
          provider: string
          status?: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          credentials?: Json
          display_name?: string | null
          id?: string
          last_sync_at?: string | null
          manager_id?: string
          provider?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      marketing_drafts: {
        Row: {
          audience: string
          body_markdown: string
          channel: string
          created_at: string
          cta_label: string | null
          cta_url: string | null
          draft_date: string
          feature_focus: string | null
          funnel_stage: string
          generated_by: string
          id: string
          metadata: Json
          preview_text: string | null
          screenshot_hint: string | null
          status: string
          subject_line: string
          updated_at: string
        }
        Insert: {
          audience: string
          body_markdown: string
          channel?: string
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          draft_date?: string
          feature_focus?: string | null
          funnel_stage: string
          generated_by?: string
          id?: string
          metadata?: Json
          preview_text?: string | null
          screenshot_hint?: string | null
          status?: string
          subject_line: string
          updated_at?: string
        }
        Update: {
          audience?: string
          body_markdown?: string
          channel?: string
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          draft_date?: string
          feature_focus?: string | null
          funnel_stage?: string
          generated_by?: string
          id?: string
          metadata?: Json
          preview_text?: string | null
          screenshot_hint?: string | null
          status?: string
          subject_line?: string
          updated_at?: string
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
      merch_purchases: {
        Row: {
          amount: number
          artist_id: string
          artist_revenue: number
          buyer_id: string
          created_at: string
          currency: string
          id: string
          item_id: string | null
          item_name: string
          metadata: Json | null
          platform_fee: number
          quantity: number
          shipping_address: Json | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          artist_id: string
          artist_revenue?: number
          buyer_id: string
          created_at?: string
          currency?: string
          id?: string
          item_id?: string | null
          item_name: string
          metadata?: Json | null
          platform_fee?: number
          quantity?: number
          shipping_address?: Json | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          artist_id?: string
          artist_revenue?: number
          buyer_id?: string
          created_at?: string
          currency?: string
          id?: string
          item_id?: string | null
          item_name?: string
          metadata?: Json | null
          platform_fee?: number
          quantity?: number
          shipping_address?: Json | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      milestone_definitions: {
        Row: {
          card_color: string | null
          description: string | null
          icon: string | null
          id: string
          label: string
          threshold: number | null
          type: string | null
        }
        Insert: {
          card_color?: string | null
          description?: string | null
          icon?: string | null
          id: string
          label: string
          threshold?: number | null
          type?: string | null
        }
        Update: {
          card_color?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          label?: string
          threshold?: number | null
          type?: string | null
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
      money_ledger: {
        Row: {
          amount: number
          artist_id: string
          created_at: string
          detail: Json | null
          entry_type: string
          id: number
          source_id: string | null
          source_type: string
        }
        Insert: {
          amount: number
          artist_id: string
          created_at?: string
          detail?: Json | null
          entry_type: string
          id?: number
          source_id?: string | null
          source_type: string
        }
        Update: {
          amount?: number
          artist_id?: string
          created_at?: string
          detail?: Json | null
          entry_type?: string
          id?: number
          source_id?: string | null
          source_type?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          is_read: boolean | null
          message: string | null
          notification_type: string
          target_id: string | null
          target_type: string | null
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string | null
          notification_type: string
          target_id?: string | null
          target_type?: string | null
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string | null
          notification_type?: string
          target_id?: string | null
          target_type?: string | null
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
      outcome_events: {
        Row: {
          artist_id: string | null
          ctq: string
          detail: Json | null
          id: number
          occurred_at: string
          ok: boolean
          reason: string | null
          subject_id: string | null
        }
        Insert: {
          artist_id?: string | null
          ctq: string
          detail?: Json | null
          id?: number
          occurred_at?: string
          ok: boolean
          reason?: string | null
          subject_id?: string | null
        }
        Update: {
          artist_id?: string | null
          ctq?: string
          detail?: Json | null
          id?: number
          occurred_at?: string
          ok?: boolean
          reason?: string | null
          subject_id?: string | null
        }
        Relationships: []
      }
      payroll_runs: {
        Row: {
          auto_fixes: Json
          created_at: string
          findings: Json
          id: string
          status: string
          summary: string | null
          totals: Json
        }
        Insert: {
          auto_fixes?: Json
          created_at?: string
          findings?: Json
          id?: string
          status?: string
          summary?: string | null
          totals?: Json
        }
        Update: {
          auto_fixes?: Json
          created_at?: string
          findings?: Json
          id?: string
          status?: string
          summary?: string | null
          totals?: Json
        }
        Relationships: []
      }
      platform_revenue: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          period_date: string
          revenue_type: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          period_date?: string
          revenue_type: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          period_date?: string
          revenue_type?: string
        }
        Relationships: []
      }
      playlist_motion_covers: {
        Row: {
          created_at: string
          id: string
          is_ai_generated: boolean | null
          media_path: string
          media_type: string
          playlist_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_ai_generated?: boolean | null
          media_path: string
          media_type: string
          playlist_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_ai_generated?: boolean | null
          media_path?: string
          media_type?: string
          playlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_motion_covers_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: true
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_tracks: {
        Row: {
          added_at: string
          added_by: string | null
          id: string
          playlist_id: string
          position: number
          track_id: string | null
          virtual_track_id: string | null
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          id?: string
          playlist_id: string
          position: number
          track_id?: string | null
          virtual_track_id?: string | null
        }
        Update: {
          added_at?: string
          added_by?: string | null
          id?: string
          playlist_id?: string
          position?: number
          track_id?: string | null
          virtual_track_id?: string | null
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
          {
            foreignKeyName: "playlist_tracks_virtual_track_id_fkey"
            columns: ["virtual_track_id"]
            isOneToOne: false
            referencedRelation: "virtual_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          comment_count: number | null
          cover_image_path: string | null
          created_at: string
          description: string | null
          id: string
          is_collaborative: boolean | null
          is_public: boolean | null
          like_count: number | null
          name: string
          play_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comment_count?: number | null
          cover_image_path?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_collaborative?: boolean | null
          is_public?: boolean | null
          like_count?: number | null
          name: string
          play_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comment_count?: number | null
          cover_image_path?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_collaborative?: boolean | null
          is_public?: boolean | null
          like_count?: number | null
          name?: string
          play_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      post_media: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          media_bucket: string | null
          media_path: string
          media_type: string
          post_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          media_bucket?: string | null
          media_path: string
          media_type: string
          post_id: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          media_bucket?: string | null
          media_path?: string
          media_type?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          comment_count: number | null
          content: string | null
          created_at: string
          id: string
          is_pinned: boolean | null
          like_count: number | null
          post_type: string
          share_count: number | null
          shared_album_id: string | null
          shared_artist_id: string | null
          shared_playlist_id: string | null
          shared_track_id: string | null
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          comment_count?: number | null
          content?: string | null
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          like_count?: number | null
          post_type?: string
          share_count?: number | null
          shared_album_id?: string | null
          shared_artist_id?: string | null
          shared_playlist_id?: string | null
          shared_track_id?: string | null
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          comment_count?: number | null
          content?: string | null
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          like_count?: number | null
          post_type?: string
          share_count?: number | null
          shared_album_id?: string | null
          shared_artist_id?: string | null
          shared_playlist_id?: string | null
          shared_track_id?: string | null
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_shared_album_id_fkey"
            columns: ["shared_album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_shared_playlist_id_fkey"
            columns: ["shared_playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_shared_track_id_fkey"
            columns: ["shared_track_id"]
            isOneToOne: false
            referencedRelation: "published_tracks_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_shared_track_id_fkey"
            columns: ["shared_track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      presave_campaigns: {
        Row: {
          album_id: string | null
          campaign_name: string
          cover_image_path: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          landing_page_settings: Json | null
          release_date: string
          slug: string
          total_presaves: number
          track_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          album_id?: string | null
          campaign_name: string
          cover_image_path?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          landing_page_settings?: Json | null
          release_date: string
          slug: string
          total_presaves?: number
          track_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          album_id?: string | null
          campaign_name?: string
          cover_image_path?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          landing_page_settings?: Json | null
          release_date?: string
          slug?: string
          total_presaves?: number
          track_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "presave_campaigns_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presave_campaigns_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "published_tracks_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presave_campaigns_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      presave_signups: {
        Row: {
          campaign_id: string
          consent_at: string | null
          created_at: string
          email: string
          id: string
          notified_on_release: boolean
          platform_preferences: Json | null
          user_id: string | null
        }
        Insert: {
          campaign_id: string
          consent_at?: string | null
          created_at?: string
          email: string
          id?: string
          notified_on_release?: boolean
          platform_preferences?: Json | null
          user_id?: string | null
        }
        Update: {
          campaign_id?: string
          consent_at?: string | null
          created_at?: string
          email?: string
          id?: string
          notified_on_release?: boolean
          platform_preferences?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "presave_signups_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "presave_campaigns"
            referencedColumns: ["id"]
          },
        ]
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
      quality_alerts: {
        Row: {
          alert_key: string
          first_seen: string
          last_seen: string
          last_sent: string | null
          message: string
          resolved_at: string | null
          severity: string
        }
        Insert: {
          alert_key: string
          first_seen?: string
          last_seen?: string
          last_sent?: string | null
          message: string
          resolved_at?: string | null
          severity: string
        }
        Update: {
          alert_key?: string
          first_seen?: string
          last_seen?: string
          last_sent?: string | null
          message?: string
          resolved_at?: string | null
          severity?: string
        }
        Relationships: []
      }
      quality_targets: {
        Row: {
          alert_on_any_defect: boolean
          ctq: string
          min_runs: number
          min_sigma: number
          updated_at: string
          window_hours: number
        }
        Insert: {
          alert_on_any_defect?: boolean
          ctq: string
          min_runs?: number
          min_sigma?: number
          updated_at?: string
          window_hours?: number
        }
        Update: {
          alert_on_any_defect?: boolean
          ctq?: string
          min_runs?: number
          min_sigma?: number
          updated_at?: string
          window_hours?: number
        }
        Relationships: []
      }
      reactions: {
        Row: {
          comment_id: string | null
          created_at: string
          id: string
          playlist_id: string | null
          post_id: string | null
          reaction_type: string
          target_type: string
          user_id: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          id?: string
          playlist_id?: string | null
          post_id?: string | null
          reaction_type?: string
          target_type: string
          user_id: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          id?: string
          playlist_id?: string | null
          post_id?: string | null
          reaction_type?: string
          target_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
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
      reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          report_type: string
          reported_user_id: string | null
          reporter_id: string
          resolved_at: string | null
          status: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          report_type: string
          reported_user_id?: string | null
          reporter_id: string
          resolved_at?: string | null
          status?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          report_type?: string
          reported_user_id?: string | null
          reporter_id?: string
          resolved_at?: string | null
          status?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      saved_strategies: {
        Row: {
          content: string
          created_at: string | null
          id: string
          metadata: Json | null
          strategy_type: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          strategy_type: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          strategy_type?: string
          title?: string
          updated_at?: string | null
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
      smart_link_clicks: {
        Row: {
          clicked_at: string
          country: string | null
          id: string
          platform: string | null
          referrer: string | null
          smart_link_id: string
          user_agent: string | null
        }
        Insert: {
          clicked_at?: string
          country?: string | null
          id?: string
          platform?: string | null
          referrer?: string | null
          smart_link_id: string
          user_agent?: string | null
        }
        Update: {
          clicked_at?: string
          country?: string | null
          id?: string
          platform?: string | null
          referrer?: string | null
          smart_link_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "smart_link_clicks_smart_link_id_fkey"
            columns: ["smart_link_id"]
            isOneToOne: false
            referencedRelation: "smart_links"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_links: {
        Row: {
          artwork_url: string | null
          clicks: number | null
          created_at: string
          description: string | null
          id: string
          platforms: Json
          short_code: string
          target_id: string | null
          target_type: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          artwork_url?: string | null
          clicks?: number | null
          created_at?: string
          description?: string | null
          id?: string
          platforms?: Json
          short_code: string
          target_id?: string | null
          target_type?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          artwork_url?: string | null
          clicks?: number | null
          created_at?: string
          description?: string | null
          id?: string
          platforms?: Json
          short_code?: string
          target_id?: string | null
          target_type?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      social_posts: {
        Row: {
          artist_id: string
          body: string
          created_at: string
          created_by: string | null
          error: string | null
          id: string
          media_urls: string[]
          platforms: string[]
          provider_id: string | null
          results: Json
          scheduled_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          artist_id: string
          body?: string
          created_at?: string
          created_by?: string | null
          error?: string | null
          id?: string
          media_urls?: string[]
          platforms: string[]
          provider_id?: string | null
          results?: Json
          scheduled_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          artist_id?: string
          body?: string
          created_at?: string
          created_by?: string | null
          error?: string | null
          id?: string
          media_urls?: string[]
          platforms?: string[]
          provider_id?: string | null
          results?: Json
          scheduled_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      social_profiles: {
        Row: {
          artist_id: string
          platforms: string[]
          profile_key: string
          updated_at: string
        }
        Insert: {
          artist_id: string
          platforms?: string[]
          profile_key: string
          updated_at?: string
        }
        Update: {
          artist_id?: string
          platforms?: string[]
          profile_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      store_click_events: {
        Row: {
          campaign: string | null
          content: string | null
          created_at: string
          destination: string
          id: string
          path: string | null
          referrer: string | null
          source: string
          user_id: string | null
        }
        Insert: {
          campaign?: string | null
          content?: string | null
          created_at?: string
          destination: string
          id?: string
          path?: string | null
          referrer?: string | null
          source: string
          user_id?: string | null
        }
        Update: {
          campaign?: string | null
          content?: string | null
          created_at?: string
          destination?: string
          id?: string
          path?: string | null
          referrer?: string | null
          source?: string
          user_id?: string | null
        }
        Relationships: []
      }
      stream_events: {
        Row: {
          artist_id: string
          city: string | null
          country_code: string | null
          device_type: string | null
          duration_seconds: number | null
          id: string
          latitude: number | null
          listener_id: string | null
          longitude: number | null
          platform: string | null
          region: string | null
          session_id: string | null
          streamed_at: string | null
          track_id: string | null
        }
        Insert: {
          artist_id: string
          city?: string | null
          country_code?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          id?: string
          latitude?: number | null
          listener_id?: string | null
          longitude?: number | null
          platform?: string | null
          region?: string | null
          session_id?: string | null
          streamed_at?: string | null
          track_id?: string | null
        }
        Update: {
          artist_id?: string
          city?: string | null
          country_code?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          id?: string
          latitude?: number | null
          listener_id?: string | null
          longitude?: number | null
          platform?: string | null
          region?: string | null
          session_id?: string | null
          streamed_at?: string | null
          track_id?: string | null
        }
        Relationships: []
      }
      stream_fraud_detection: {
        Row: {
          created_at: string
          details: Json | null
          detection_type: string
          device_fingerprint: string | null
          id: string
          ip_address: unknown
          severity: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          detection_type: string
          device_fingerprint?: string | null
          id?: string
          ip_address?: unknown
          severity?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          detection_type?: string
          device_fingerprint?: string | null
          id?: string
          ip_address?: unknown
          severity?: string
          user_id?: string | null
        }
        Relationships: []
      }
      stream_policy: {
        Row: {
          flag_artist_share: number
          flag_listener_share: number
          flag_min_streams: number
          id: boolean
          max_paid_repeats_per_track_day: number | null
          max_streams_per_hour: number
          max_streams_per_listener_day: number
          min_seconds_between_streams: number
          updated_at: string
        }
        Insert: {
          flag_artist_share?: number
          flag_listener_share?: number
          flag_min_streams?: number
          id?: boolean
          max_paid_repeats_per_track_day?: number | null
          max_streams_per_hour?: number
          max_streams_per_listener_day?: number
          min_seconds_between_streams?: number
          updated_at?: string
        }
        Update: {
          flag_artist_share?: number
          flag_listener_share?: number
          flag_min_streams?: number
          id?: boolean
          max_paid_repeats_per_track_day?: number | null
          max_streams_per_hour?: number
          max_streams_per_listener_day?: number
          min_seconds_between_streams?: number
          updated_at?: string
        }
        Relationships: []
      }
      stream_revenue_audit: {
        Row: {
          amount: number
          created_at: string
          earnings_id: string | null
          id: string
          reason: string | null
          recorded_to_earnings: boolean
          stream_id: string | null
          track_id: string
          user_id: string | null
          validated: boolean
        }
        Insert: {
          amount?: number
          created_at?: string
          earnings_id?: string | null
          id?: string
          reason?: string | null
          recorded_to_earnings?: boolean
          stream_id?: string | null
          track_id: string
          user_id?: string | null
          validated?: boolean
        }
        Update: {
          amount?: number
          created_at?: string
          earnings_id?: string | null
          id?: string
          reason?: string | null
          recorded_to_earnings?: boolean
          stream_id?: string | null
          track_id?: string
          user_id?: string | null
          validated?: boolean
        }
        Relationships: []
      }
      stripe_webhook_events: {
        Row: {
          error_message: string | null
          event_type: string
          id: string
          livemode: boolean
          payload: Json
          processed_at: string | null
          processing_ms: number | null
          received_at: string
          related_resource_id: string | null
          related_resource_type: string | null
          related_user_id: string | null
          signature_valid: boolean
          status: string
          stripe_event_id: string
        }
        Insert: {
          error_message?: string | null
          event_type: string
          id?: string
          livemode?: boolean
          payload: Json
          processed_at?: string | null
          processing_ms?: number | null
          received_at?: string
          related_resource_id?: string | null
          related_resource_type?: string | null
          related_user_id?: string | null
          signature_valid?: boolean
          status?: string
          stripe_event_id: string
        }
        Update: {
          error_message?: string | null
          event_type?: string
          id?: string
          livemode?: boolean
          payload?: Json
          processed_at?: string | null
          processing_ms?: number | null
          received_at?: string
          related_resource_id?: string | null
          related_resource_type?: string | null
          related_user_id?: string | null
          signature_valid?: boolean
          status?: string
          stripe_event_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          album_id: string | null
          assigned_to: string | null
          attachments: Json | null
          category: string
          created_at: string
          description: string
          id: string
          priority: string
          resolution_notes: string | null
          resolved_at: string | null
          status: string
          subject: string
          ticket_number: string
          track_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          album_id?: string | null
          assigned_to?: string | null
          attachments?: Json | null
          category: string
          created_at?: string
          description: string
          id?: string
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          subject: string
          ticket_number: string
          track_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          album_id?: string | null
          assigned_to?: string | null
          attachments?: Json | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          subject?: string
          ticket_number?: string
          track_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "published_tracks_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      system_health_log: {
        Row: {
          check_type: string
          created_at: string
          details: Json | null
          duration_ms: number | null
          error_message: string | null
          id: string
          status: string
        }
        Insert: {
          check_type: string
          created_at?: string
          details?: Json | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          status: string
        }
        Update: {
          check_type?: string
          created_at?: string
          details?: Json | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          status?: string
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
      ticket_responses: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string
          id: string
          is_staff: boolean
          ticket_id: string
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string
          id?: string
          is_staff?: boolean
          ticket_id: string
          user_id: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string
          id?: string
          is_staff?: boolean
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_responses_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_dates: {
        Row: {
          artist_id: string
          city: string
          country: string | null
          created_at: string | null
          date_time: string
          eventbrite_event_id: string | null
          id: string
          state: string | null
          status: string | null
          ticket_url: string | null
          updated_at: string | null
          venue: string
        }
        Insert: {
          artist_id: string
          city: string
          country?: string | null
          created_at?: string | null
          date_time: string
          eventbrite_event_id?: string | null
          id?: string
          state?: string | null
          status?: string | null
          ticket_url?: string | null
          updated_at?: string | null
          venue: string
        }
        Update: {
          artist_id?: string
          city?: string
          country?: string | null
          created_at?: string | null
          date_time?: string
          eventbrite_event_id?: string | null
          id?: string
          state?: string | null
          status?: string | null
          ticket_url?: string | null
          updated_at?: string | null
          venue?: string
        }
        Relationships: []
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
      track_lyrics_sync: {
        Row: {
          created_at: string
          id: string
          is_published: boolean
          lyrics_data: Json
          track_id: string
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_published?: boolean
          lyrics_data?: Json
          track_id: string
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_published?: boolean
          lyrics_data?: Json
          track_id?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "track_lyrics_sync_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "published_tracks_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "track_lyrics_sync_track_id_fkey"
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
      track_rights_splits: {
        Row: {
          created_at: string
          dispute_note: string | null
          holder_email: string | null
          holder_name: string
          holder_user_id: string | null
          id: string
          ipi_number: string | null
          is_verified: boolean
          pro_affiliation: string | null
          responded_at: string | null
          rights_type: string
          role: string | null
          sent_at: string | null
          split_percentage: number
          status: string
          token: string
          track_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dispute_note?: string | null
          holder_email?: string | null
          holder_name: string
          holder_user_id?: string | null
          id?: string
          ipi_number?: string | null
          is_verified?: boolean
          pro_affiliation?: string | null
          responded_at?: string | null
          rights_type: string
          role?: string | null
          sent_at?: string | null
          split_percentage: number
          status?: string
          token?: string
          track_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dispute_note?: string | null
          holder_email?: string | null
          holder_name?: string
          holder_user_id?: string | null
          id?: string
          ipi_number?: string | null
          is_verified?: boolean
          pro_affiliation?: string | null
          responded_at?: string | null
          rights_type?: string
          role?: string | null
          sent_at?: string | null
          split_percentage?: number
          status?: string
          token?: string
          track_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_rights_splits_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "published_tracks_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "track_rights_splits_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      track_territories: {
        Row: {
          created_at: string
          id: string
          is_available: boolean
          restriction_reason: string | null
          territory_code: string
          territory_name: string
          track_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_available?: boolean
          restriction_reason?: string | null
          territory_code: string
          territory_name: string
          track_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_available?: boolean
          restriction_reason?: string | null
          territory_code?: string
          territory_name?: string
          track_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_territories_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "published_tracks_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "track_territories_track_id_fkey"
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
          apple_motion_art_1x1: string | null
          apple_motion_art_3x4: string | null
          artist_name: string
          audio_quality: string | null
          bpm: number | null
          c_line: string | null
          copyright_owner: string | null
          copyright_year: number | null
          created_at: string
          credits: Json | null
          download_price: number | null
          duration: number
          explicit: boolean | null
          file_path: string
          genre: string | null
          id: string
          is_published: boolean | null
          isrc: string | null
          key: string | null
          label: string | null
          language: string | null
          like_count: number | null
          metadata_complete: boolean | null
          mood: string | null
          motion_cover_bucket: string | null
          motion_cover_path: string | null
          original_release_date: string | null
          p_line: string | null
          play_count: number | null
          preorder_date: string | null
          publishing_info: Json | null
          release_date: string | null
          release_type: string | null
          release_version: string | null
          scheduled_release_date: string | null
          title: string
          track_number: number | null
          upc: string | null
          updated_at: string
          user_id: string
          waveform_data: Json | null
        }
        Insert: {
          ai_tags?: Json | null
          album_cover_bucket?: string | null
          album_cover_path?: string | null
          album_id?: string | null
          apple_motion_art_1x1?: string | null
          apple_motion_art_3x4?: string | null
          artist_name: string
          audio_quality?: string | null
          bpm?: number | null
          c_line?: string | null
          copyright_owner?: string | null
          copyright_year?: number | null
          created_at?: string
          credits?: Json | null
          download_price?: number | null
          duration: number
          explicit?: boolean | null
          file_path: string
          genre?: string | null
          id?: string
          is_published?: boolean | null
          isrc?: string | null
          key?: string | null
          label?: string | null
          language?: string | null
          like_count?: number | null
          metadata_complete?: boolean | null
          mood?: string | null
          motion_cover_bucket?: string | null
          motion_cover_path?: string | null
          original_release_date?: string | null
          p_line?: string | null
          play_count?: number | null
          preorder_date?: string | null
          publishing_info?: Json | null
          release_date?: string | null
          release_type?: string | null
          release_version?: string | null
          scheduled_release_date?: string | null
          title: string
          track_number?: number | null
          upc?: string | null
          updated_at?: string
          user_id: string
          waveform_data?: Json | null
        }
        Update: {
          ai_tags?: Json | null
          album_cover_bucket?: string | null
          album_cover_path?: string | null
          album_id?: string | null
          apple_motion_art_1x1?: string | null
          apple_motion_art_3x4?: string | null
          artist_name?: string
          audio_quality?: string | null
          bpm?: number | null
          c_line?: string | null
          copyright_owner?: string | null
          copyright_year?: number | null
          created_at?: string
          credits?: Json | null
          download_price?: number | null
          duration?: number
          explicit?: boolean | null
          file_path?: string
          genre?: string | null
          id?: string
          is_published?: boolean | null
          isrc?: string | null
          key?: string | null
          label?: string | null
          language?: string | null
          like_count?: number | null
          metadata_complete?: boolean | null
          mood?: string | null
          motion_cover_bucket?: string | null
          motion_cover_path?: string | null
          original_release_date?: string | null
          p_line?: string | null
          play_count?: number | null
          preorder_date?: string | null
          publishing_info?: Json | null
          release_date?: string | null
          release_type?: string | null
          release_version?: string | null
          scheduled_release_date?: string | null
          title?: string
          track_number?: number | null
          upc?: string | null
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
      unmatched_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          customer_email: string | null
          id: string
          match_confidence: number | null
          metadata: Json | null
          resolution_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          stripe_object_id: string
          stripe_object_type: string
          suggested_match_id: string | null
          suggested_match_table: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          customer_email?: string | null
          id?: string
          match_confidence?: number | null
          metadata?: Json | null
          resolution_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          stripe_object_id: string
          stripe_object_type: string
          suggested_match_id?: string | null
          suggested_match_table?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          customer_email?: string | null
          id?: string
          match_confidence?: number | null
          metadata?: Json | null
          resolution_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          stripe_object_id?: string
          stripe_object_type?: string
          suggested_match_id?: string | null
          suggested_match_table?: string | null
        }
        Relationships: []
      }
      upload_drafts: {
        Row: {
          artist_id: string
          draft_data: Json | null
          id: string
          updated_at: string | null
        }
        Insert: {
          artist_id: string
          draft_data?: Json | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          artist_id?: string
          draft_data?: Json | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
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
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
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
      user_profiles: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          display_name: string | null
          email: string | null
          email_verified_at: string | null
          full_name: string | null
          gender: string | null
          id: string
          marketing_opt_in: boolean
          phone: string | null
          phone_verified_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          email?: string | null
          email_verified_at?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          marketing_opt_in?: boolean
          phone?: string | null
          phone_verified_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          email?: string | null
          email_verified_at?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          marketing_opt_in?: boolean
          phone?: string | null
          phone_verified_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      user_shares: {
        Row: {
          album_id: string | null
          artist_id: string | null
          created_at: string
          id: string
          playlist_id: string | null
          post_id: string | null
          share_method: string | null
          share_type: string
          track_id: string | null
          user_id: string
        }
        Insert: {
          album_id?: string | null
          artist_id?: string | null
          created_at?: string
          id?: string
          playlist_id?: string | null
          post_id?: string | null
          share_method?: string | null
          share_type: string
          track_id?: string | null
          user_id: string
        }
        Update: {
          album_id?: string | null
          artist_id?: string | null
          created_at?: string
          id?: string
          playlist_id?: string | null
          post_id?: string | null
          share_method?: string | null
          share_type?: string
          track_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_shares_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_shares_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_shares_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_shares_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "published_tracks_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_shares_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stream_limits: {
        Row: {
          created_at: string
          day_window_start: string | null
          flag_reason: string | null
          hour_window_start: string | null
          id: string
          is_flagged: boolean | null
          last_stream_at: string | null
          streams_this_hour: number | null
          streams_today: number | null
          unique_tracks_today: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_window_start?: string | null
          flag_reason?: string | null
          hour_window_start?: string | null
          id?: string
          is_flagged?: boolean | null
          last_stream_at?: string | null
          streams_this_hour?: number | null
          streams_today?: number | null
          unique_tracks_today?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_window_start?: string | null
          flag_reason?: string | null
          hour_window_start?: string | null
          id?: string
          is_flagged?: boolean | null
          last_stream_at?: string | null
          streams_this_hour?: number | null
          streams_today?: number | null
          unique_tracks_today?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          ai_videos_reset_at: string
          ai_videos_used: number
          canceled_at: string | null
          created_at: string
          expires_at: string | null
          id: string
          last_stripe_event_at: string | null
          plan: Database["public"]["Enums"]["subscription_plan"]
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_videos_reset_at?: string
          ai_videos_used?: number
          canceled_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          last_stripe_event_at?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_videos_reset_at?: string
          ai_videos_used?: number
          canceled_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          last_stripe_event_at?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      virtual_tracks: {
        Row: {
          artist_name: string
          created_at: string
          duration: number | null
          id: string
          source: string | null
          thumbnail: string | null
          title: string
          youtube_id: string | null
        }
        Insert: {
          artist_name: string
          created_at?: string
          duration?: number | null
          id: string
          source?: string | null
          thumbnail?: string | null
          title: string
          youtube_id?: string | null
        }
        Update: {
          artist_name?: string
          created_at?: string
          duration?: number | null
          id?: string
          source?: string | null
          thumbnail?: string | null
          title?: string
          youtube_id?: string | null
        }
        Relationships: []
      }
      webhook_mutations: {
        Row: {
          created_at: string
          event_id: string
          event_type: string | null
          idempotency_key: string
        }
        Insert: {
          created_at?: string
          event_id: string
          event_type?: string | null
          idempotency_key: string
        }
        Update: {
          created_at?: string
          event_id?: string
          event_type?: string | null
          idempotency_key?: string
        }
        Relationships: []
      }
    }
    Views: {
      artist_earnings_summary: {
        Row: {
          artist_id: string | null
          streams_this_month: number | null
          streams_this_week: number | null
          total_earnings_dollars: number | null
          total_streams: number | null
        }
        Relationships: []
      }
      artist_payout_details_safe: {
        Row: {
          account_holder_name: string | null
          artist_id: string | null
          created_at: string | null
          id: string | null
          last_payout_date: string | null
          payout_enabled: boolean | null
          stripe_connect_id: string | null
          updated_at: string | null
        }
        Insert: {
          account_holder_name?: string | null
          artist_id?: string | null
          created_at?: string | null
          id?: string | null
          last_payout_date?: string | null
          payout_enabled?: boolean | null
          stripe_connect_id?: string | null
          updated_at?: string | null
        }
        Update: {
          account_holder_name?: string | null
          artist_id?: string | null
          created_at?: string | null
          id?: string | null
          last_payout_date?: string | null
          payout_enabled?: boolean | null
          stripe_connect_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      artist_payout_info: {
        Row: {
          account_holder_name: string | null
          artist_id: string | null
          created_at: string | null
          id: string | null
          last_payout_date: string | null
          payout_enabled: boolean | null
          square_customer_id: string | null
          square_merchant_id: string | null
          updated_at: string | null
        }
        Insert: {
          account_holder_name?: string | null
          artist_id?: string | null
          created_at?: string | null
          id?: string | null
          last_payout_date?: string | null
          payout_enabled?: boolean | null
          square_customer_id?: string | null
          square_merchant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          account_holder_name?: string | null
          artist_id?: string | null
          created_at?: string | null
          id?: string | null
          last_payout_date?: string | null
          payout_enabled?: boolean | null
          square_customer_id?: string | null
          square_merchant_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
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
      ad_connection_status: {
        Args: { p_artist: string }
        Returns: {
          account_name: string
          choices: Json
          currency: string
          error: string
          page_id: string
          platform: string
          status: string
        }[]
      }
      apply_stripe_account_event: {
        Args: {
          p_account_id: string
          p_event_at: string
          p_payout_enabled: boolean
          p_user_id: string
        }
        Returns: boolean
      }
      apply_stripe_subscription_event: {
        Args: { p_event_at: string; p_fields: Json; p_user_id: string }
        Returns: boolean
      }
      catalog_apply_tracklist: {
        Args: { p_release: string; p_rows: Json }
        Returns: number
      }
      catalog_claim_sync: { Args: { p_artist: string }; Returns: boolean }
      catalog_spend_youtube_units: {
        Args: { p_budget: number; p_units: number }
        Returns: boolean
      }
      catalog_upsert_tracks: { Args: { p_rows: Json }; Returns: number }
      check_upload_rate_limit: { Args: { p_user_id: string }; Returns: boolean }
      claim_stripe_webhook_event: {
        Args: {
          p_event_id: string
          p_event_type: string
          p_livemode: boolean
          p_payload: Json
          p_received_at: string
        }
        Returns: string
      }
      claim_webhook_mutation: {
        Args: { p_event_id: string; p_event_type?: string; p_key: string }
        Returns: boolean
      }
      copy_splits: { Args: { p_from: string; p_to: string[] }; Returns: number }
      create_system_notification: {
        Args: {
          p_message: string
          p_metadata?: Json
          p_notification_type: string
          p_title: string
          p_user_id: string
        }
        Returns: string
      }
      current_quality_alerts: {
        Args: never
        Returns: {
          alert_key: string
          message: string
          severity: string
        }[]
      }
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
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      fan_audience_count: {
        Args: { p_artist: string; p_tags?: string[] }
        Returns: number
      }
      fan_unsubscribe: { Args: { p_token: string }; Returns: string }
      fraud_anomalies: {
        Args: { p_hours?: number }
        Returns: {
          kind: string
          subject_id: string
          summary: string
        }[]
      }
      generate_isrc: { Args: never; Returns: string }
      generate_ticket_number: { Args: never; Returns: string }
      generate_upc: { Args: never; Returns: string }
      get_artist_square_tokens: {
        Args: { p_artist_id: string }
        Returns: {
          access_token: string
          merchant_id: string
          refresh_token: string
          token_expires_at: string
        }[]
      }
      get_invite_by_token: {
        Args: { p_token: string }
        Returns: {
          expires_at: string
          id: string
          invited_email: string
          inviter_name: string
          kind: string
          message: string
          permissions: Json
          status: string
        }[]
      }
      get_quality_scorecard: {
        Args: { p_days?: number }
        Returns: {
          ctq: string
          defects: number
          dpmo: number
          opportunities: number
          sigma: number
          top_failure: string
        }[]
      }
      get_split_by_token: {
        Args: { p_token: string }
        Returns: {
          artist_name: string
          holder_name: string
          others: Json
          rights_type: string
          role: string
          split_percentage: number
          status: string
          track_title: string
        }[]
      }
      get_user_plan: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["subscription_plan"]
      }
      has_plan_access: {
        Args: {
          _required_plan: Database["public"]["Enums"]["subscription_plan"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_manager_of: {
        Args: { _artist: string; _manager: string }
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
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      presave_signup: {
        Args: { p_email: string; p_platforms?: Json; p_slug: string }
        Returns: string
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      reconcile_ledger: {
        Args: never
        Returns: {
          artist_id: string
          difference: number
          ledger_balance: number
          unpaid_earnings: number
        }[]
      }
      record_fan_email_event: {
        Args: { p_provider_id: string; p_type: string }
        Returns: undefined
      }
      record_smart_link_click: {
        Args: {
          p_code: string
          p_platform: string
          p_referrer?: string
          p_user_agent?: string
        }
        Returns: undefined
      }
      respond_to_invite: {
        Args: { p_accept: boolean; p_token: string }
        Returns: string
      }
      respond_to_split: {
        Args: { p_confirm: boolean; p_note?: string; p_token: string }
        Returns: string
      }
      sigma_level: { Args: { p_dpmo: number }; Returns: number }
      smart_link_stats: {
        Args: { p_link: string }
        Returns: {
          clicks: number
          platform: string
        }[]
      }
      social_platforms: { Args: { p_artist: string }; Returns: string[] }
      split_overview: {
        Args: never
        Returns: {
          confirmed: number
          disputed: number
          holders: number
          rights_type: string
          total: number
          track_id: string
        }[]
      }
      update_artist_monthly_listeners: { Args: never; Returns: undefined }
      validate_stream: {
        Args: {
          p_device_fingerprint: string
          p_ip_address: unknown
          p_track_id: string
          p_user_id: string
        }
        Returns: Json
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
        | "ceo"
      collaboration_permission:
        | "view_tracks"
        | "edit_tracks"
        | "upload_tracks"
        | "delete_tracks"
        | "view_analytics"
        | "manage_albums"
      subscription_plan: "free" | "starter" | "pro" | "enterprise" | "fan"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
        "ceo",
      ],
      collaboration_permission: [
        "view_tracks",
        "edit_tracks",
        "upload_tracks",
        "delete_tracks",
        "view_analytics",
        "manage_albums",
      ],
      subscription_plan: ["free", "starter", "pro", "enterprise", "fan"],
    },
  },
} as const
