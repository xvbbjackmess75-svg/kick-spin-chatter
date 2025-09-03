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
      giveaway_participants: {
        Row: {
          entered_at: string
          giveaway_id: string
          id: string
          kick_user_id: string
          kick_username: string
        }
        Insert: {
          entered_at?: string
          giveaway_id: string
          id?: string
          kick_user_id: string
          kick_username: string
        }
        Update: {
          entered_at?: string
          giveaway_id?: string
          id?: string
          kick_user_id?: string
          kick_username?: string
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          is_streamer: boolean | null
          kick_channel_id: string | null
          kick_user_id: string | null
          kick_username: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_streamer?: boolean | null
          kick_channel_id?: string | null
          kick_user_id?: string | null
          kick_username?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_streamer?: boolean | null
          kick_channel_id?: string | null
          kick_user_id?: string | null
          kick_username?: string | null
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
      get_current_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
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
