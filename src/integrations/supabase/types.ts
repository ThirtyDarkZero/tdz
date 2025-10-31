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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      deduct_render_credits: {
        Args: {
          p_amount: number
          p_reference_id: string
          p_reference_type: string
          p_user_id: string
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
