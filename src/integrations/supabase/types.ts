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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      bonus_hunt_bets: {
        Row: {
          bet_size: number
          bonus_multiplier: number | null
          created_at: string
          ending_balance: number
          id: string
          payout_amount: number | null
          payout_recorded_at: string | null
          pnl: number
          session_id: string
          slot_id: string
          starting_balance: number
        }
        Insert: {
          bet_size: number
          bonus_multiplier?: number | null
          created_at?: string
          ending_balance: number
          id?: string
          payout_amount?: number | null
          payout_recorded_at?: string | null
          pnl: number
          session_id: string
          slot_id: string
          starting_balance: number
        }
        Update: {
          bet_size?: number
          bonus_multiplier?: number | null
          created_at?: string
          ending_balance?: number
          id?: string
          payout_amount?: number | null
          payout_recorded_at?: string | null
          pnl?: number
          session_id?: string
          slot_id?: string
          starting_balance?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_bonus_hunt_bets_slot_id"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "slots"
            referencedColumns: ["id"]
          },
        ]
      }
      bonus_hunt_overlay_settings: {
        Row: {
          accent_color: string | null
          animation_enabled: boolean | null
          background_color: string | null
          created_at: string
          font_size: string | null
          id: string
          max_visible_bonuses: number | null
          show_expected_payouts: boolean | null
          show_top_multipliers: boolean | null
          show_upcoming_bonuses: boolean | null
          text_color: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accent_color?: string | null
          animation_enabled?: boolean | null
          background_color?: string | null
          created_at?: string
          font_size?: string | null
          id?: string
          max_visible_bonuses?: number | null
          show_expected_payouts?: boolean | null
          show_top_multipliers?: boolean | null
          show_upcoming_bonuses?: boolean | null
          text_color?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accent_color?: string | null
          animation_enabled?: boolean | null
          background_color?: string | null
          created_at?: string
          font_size?: string | null
          id?: string
          max_visible_bonuses?: number | null
          show_expected_payouts?: boolean | null
          show_top_multipliers?: boolean | null
          show_upcoming_bonuses?: boolean | null
          text_color?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bonus_hunt_sessions: {
        Row: {
          bonus_opening_phase: boolean | null
          completed_at: string | null
          created_at: string
          current_balance: number
          id: string
          session_name: string | null
          starting_balance: number
          status: string
          target_bonuses: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bonus_opening_phase?: boolean | null
          completed_at?: string | null
          created_at?: string
          current_balance: number
          id?: string
          session_name?: string | null
          starting_balance: number
          status?: string
          target_bonuses?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bonus_opening_phase?: boolean | null
          completed_at?: string | null
          created_at?: string
          current_balance?: number
          id?: string
          session_name?: string | null
          starting_balance?: number
          status?: string
          target_bonuses?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bot_settings: {
        Row: {
          api_rate_limit: number | null
          auto_moderation: boolean | null
          banned_words: string[] | null
          bot_enabled: boolean | null
          bot_username: string | null
          channel_id: string | null
          command_prefix: string | null
          created_at: string
          default_cooldown: number | null
          id: string
          max_message_length: number | null
          timeout_duration: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          api_rate_limit?: number | null
          auto_moderation?: boolean | null
          banned_words?: string[] | null
          bot_enabled?: boolean | null
          bot_username?: string | null
          channel_id?: string | null
          command_prefix?: string | null
          created_at?: string
          default_cooldown?: number | null
          id?: string
          max_message_length?: number | null
          timeout_duration?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          api_rate_limit?: number | null
          auto_moderation?: boolean | null
          banned_words?: string[] | null
          bot_enabled?: boolean | null
          bot_username?: string | null
          channel_id?: string | null
          command_prefix?: string | null
          created_at?: string
          default_cooldown?: number | null
          id?: string
          max_message_length?: number | null
          timeout_duration?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_settings_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "kick_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          channel_id: string
          command_name: string | null
          id: string
          is_command: boolean | null
          kick_user_id: string | null
          kick_username: string
          message: string
          timestamp: string
          user_type: string | null
        }
        Insert: {
          channel_id: string
          command_name?: string | null
          id?: string
          is_command?: boolean | null
          kick_user_id?: string | null
          kick_username: string
          message: string
          timestamp?: string
          user_type?: string | null
        }
        Update: {
          channel_id?: string
          command_name?: string | null
          id?: string
          is_command?: boolean | null
          kick_user_id?: string | null
          kick_username?: string
          message?: string
          timestamp?: string
          user_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "kick_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_monitors: {
        Row: {
          channel_id: string
          created_at: string
          id: string
          is_active: boolean
          kick_user_id: string
          kick_username: string
          last_heartbeat: string
          started_at: string
          total_commands_processed: number
          total_messages_processed: number
          updated_at: string
          user_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          kick_user_id: string
          kick_username: string
          last_heartbeat?: string
          started_at?: string
          total_commands_processed?: number
          total_messages_processed?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          kick_user_id?: string
          kick_username?: string
          last_heartbeat?: string
          started_at?: string
          total_commands_processed?: number
          total_messages_processed?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      commands: {
        Row: {
          channel_id: string | null
          command: string
          cooldown: number | null
          created_at: string
          enabled: boolean | null
          id: string
          response: string
          updated_at: string
          user_id: string
          user_level: string | null
          uses: number | null
        }
        Insert: {
          channel_id?: string | null
          command: string
          cooldown?: number | null
          created_at?: string
          enabled?: boolean | null
          id?: string
          response: string
          updated_at?: string
          user_id: string
          user_level?: string | null
          uses?: number | null
        }
        Update: {
          channel_id?: string | null
          command?: string
          cooldown?: number | null
          created_at?: string
          enabled?: boolean | null
          id?: string
          response?: string
          updated_at?: string
          user_id?: string
          user_level?: string | null
          uses?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "commands_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "kick_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_permissions: {
        Row: {
          created_at: string
          description: string | null
          feature_name: string
          id: string
          is_enabled: boolean | null
          required_role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          feature_name: string
          id?: string
          is_enabled?: boolean | null
          required_role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          feature_name?: string
          id?: string
          is_enabled?: boolean | null
          required_role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      giveaway_participants: {
        Row: {
          entered_at: string
          giveaway_id: string
          id: string
          is_verified: boolean | null
          kick_user_id: string
          kick_username: string
          referral_link: string | null
          user_id: string | null
        }
        Insert: {
          entered_at?: string
          giveaway_id: string
          id?: string
          is_verified?: boolean | null
          kick_user_id: string
          kick_username: string
          referral_link?: string | null
          user_id?: string | null
        }
        Update: {
          entered_at?: string
          giveaway_id?: string
          id?: string
          is_verified?: boolean | null
          kick_user_id?: string
          kick_username?: string
          referral_link?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "giveaway_participants_giveaway_id_fkey"
            columns: ["giveaway_id"]
            isOneToOne: false
            referencedRelation: "giveaways"
            referencedColumns: ["id"]
          },
        ]
      }
      giveaway_states: {
        Row: {
          created_at: string
          giveaway_id: string
          id: string
          pending_winners: Json | null
          remaining_participants: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          giveaway_id: string
          id?: string
          pending_winners?: Json | null
          remaining_participants?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          giveaway_id?: string
          id?: string
          pending_winners?: Json | null
          remaining_participants?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "giveaway_states_giveaway_id_fkey"
            columns: ["giveaway_id"]
            isOneToOne: false
            referencedRelation: "giveaways"
            referencedColumns: ["id"]
          },
        ]
      }
      giveaway_winners: {
        Row: {
          created_at: string
          giveaway_id: string
          id: string
          tickets_per_participant: number | null
          total_tickets: number | null
          winner_username: string
          winning_ticket: number | null
          won_at: string
        }
        Insert: {
          created_at?: string
          giveaway_id: string
          id?: string
          tickets_per_participant?: number | null
          total_tickets?: number | null
          winner_username: string
          winning_ticket?: number | null
          won_at?: string
        }
        Update: {
          created_at?: string
          giveaway_id?: string
          id?: string
          tickets_per_participant?: number | null
          total_tickets?: number | null
          winner_username?: string
          winning_ticket?: number | null
          won_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "giveaway_winners_giveaway_id_fkey"
            columns: ["giveaway_id"]
            isOneToOne: false
            referencedRelation: "giveaways"
            referencedColumns: ["id"]
          },
        ]
      }
      giveaways: {
        Row: {
          channel_id: string | null
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          max_participants: number | null
          participants_count: number | null
          status: string | null
          tickets_per_participant: number | null
          title: string
          total_tickets: number | null
          updated_at: string
          user_id: string
          verified_bonus_chances: number | null
          verified_only: boolean | null
          winner_user_id: string | null
          winning_ticket: number | null
        }
        Insert: {
          channel_id?: string | null
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          max_participants?: number | null
          participants_count?: number | null
          status?: string | null
          tickets_per_participant?: number | null
          title: string
          total_tickets?: number | null
          updated_at?: string
          user_id: string
          verified_bonus_chances?: number | null
          verified_only?: boolean | null
          winner_user_id?: string | null
          winning_ticket?: number | null
        }
        Update: {
          channel_id?: string | null
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          max_participants?: number | null
          participants_count?: number | null
          status?: string | null
          tickets_per_participant?: number | null
          title?: string
          total_tickets?: number | null
          updated_at?: string
          user_id?: string
          verified_bonus_chances?: number | null
          verified_only?: boolean | null
          winner_user_id?: string | null
          winning_ticket?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "giveaways_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "kick_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      kick_channels: {
        Row: {
          bot_enabled: boolean | null
          channel_id: string
          channel_name: string
          created_at: string
          id: string
          is_active: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bot_enabled?: boolean | null
          channel_id: string
          channel_name: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bot_enabled?: boolean | null
          channel_id?: string
          channel_name?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      overlay_settings: {
        Row: {
          accent_color: string | null
          animation_enabled: boolean | null
          background_color: string | null
          border_color: string | null
          created_at: string
          font_size: string | null
          id: string
          max_visible_calls: number | null
          scrolling_speed: number | null
          show_background: boolean | null
          show_borders: boolean | null
          text_color: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accent_color?: string | null
          animation_enabled?: boolean | null
          background_color?: string | null
          border_color?: string | null
          created_at?: string
          font_size?: string | null
          id?: string
          max_visible_calls?: number | null
          scrolling_speed?: number | null
          show_background?: boolean | null
          show_borders?: boolean | null
          text_color?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accent_color?: string | null
          animation_enabled?: boolean | null
          background_color?: string | null
          border_color?: string | null
          created_at?: string
          font_size?: string | null
          id?: string
          max_visible_calls?: number | null
          scrolling_speed?: number | null
          show_background?: boolean | null
          show_borders?: boolean | null
          text_color?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          is_kick_hybrid: boolean | null
          is_streamer: boolean | null
          kick_channel_id: string | null
          kick_user_id: string | null
          kick_username: string | null
          linked_kick_avatar: string | null
          linked_kick_user_id: string | null
          linked_kick_username: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_kick_hybrid?: boolean | null
          is_streamer?: boolean | null
          kick_channel_id?: string | null
          kick_user_id?: string | null
          kick_username?: string | null
          linked_kick_avatar?: string | null
          linked_kick_user_id?: string | null
          linked_kick_username?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_kick_hybrid?: boolean | null
          is_streamer?: boolean | null
          kick_channel_id?: string | null
          kick_user_id?: string | null
          kick_username?: string | null
          linked_kick_avatar?: string | null
          linked_kick_user_id?: string | null
          linked_kick_username?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      slots: {
        Row: {
          added_by_user_id: string | null
          created_at: string
          id: string
          is_user_added: boolean | null
          max_multiplier: number | null
          name: string
          provider: string
          rtp: number | null
          theme: string | null
          updated_at: string
        }
        Insert: {
          added_by_user_id?: string | null
          created_at?: string
          id?: string
          is_user_added?: boolean | null
          max_multiplier?: number | null
          name: string
          provider: string
          rtp?: number | null
          theme?: string | null
          updated_at?: string
        }
        Update: {
          added_by_user_id?: string | null
          created_at?: string
          id?: string
          is_user_added?: boolean | null
          max_multiplier?: number | null
          name?: string
          provider?: string
          rtp?: number | null
          theme?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      slots_calls: {
        Row: {
          bet_amount: number
          call_order: number
          completed_at: string | null
          event_id: string
          id: string
          multiplier: number | null
          slot_name: string
          status: string
          submitted_at: string
          viewer_kick_id: string | null
          viewer_username: string
          win_amount: number | null
        }
        Insert: {
          bet_amount: number
          call_order: number
          completed_at?: string | null
          event_id: string
          id?: string
          multiplier?: number | null
          slot_name: string
          status?: string
          submitted_at?: string
          viewer_kick_id?: string | null
          viewer_username: string
          win_amount?: number | null
        }
        Update: {
          bet_amount?: number
          call_order?: number
          completed_at?: string | null
          event_id?: string
          id?: string
          multiplier?: number | null
          slot_name?: string
          status?: string
          submitted_at?: string
          viewer_kick_id?: string | null
          viewer_username?: string
          win_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "slots_calls_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "slots_events"
            referencedColumns: ["id"]
          },
        ]
      }
      slots_events: {
        Row: {
          bet_size: number
          channel_id: string | null
          completed_at: string | null
          created_at: string
          id: string
          max_calls_per_user: number
          prize: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bet_size: number
          channel_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          max_calls_per_user?: number
          prize: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bet_size?: number
          channel_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          max_calls_per_user?: number
          prize?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      get_current_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_next_call_order: {
        Args: { event_uuid: string }
        Returns: number
      }
      get_overlay_slots_calls: {
        Args: Record<PropertyKey, never>
        Returns: {
          bet_amount: number
          call_order: number
          display_status: string
          event_id: string
          id: string
          multiplier: number
          slot_name: string
          status: string
          submitted_at: string
          viewer_username: string
          win_amount: number
        }[]
      }
      get_secure_overlay_event: {
        Args: Record<PropertyKey, never>
        Returns: {
          event_bet_size: number
          event_id: string
          event_status: string
          event_title: string
          is_active: boolean
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_feature_access: {
        Args: { _feature_name: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      link_kick_account_to_profile: {
        Args: {
          kick_avatar: string
          kick_user_id: string
          kick_username: string
          profile_user_id: string
        }
        Returns: boolean
      }
      verify_viewer: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "user"
        | "premium"
        | "vip_plus"
        | "admin"
        | "verified_viewer"
        | "streamer"
        | "viewer"
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
        "user",
        "premium",
        "vip_plus",
        "admin",
        "verified_viewer",
        "streamer",
        "viewer",
      ],
    },
  },
} as const
