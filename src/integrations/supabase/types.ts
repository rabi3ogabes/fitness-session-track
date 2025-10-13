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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_notification_settings: {
        Row: {
          booking_notifications: boolean
          created_at: string
          email_provider: string | null
          from_email: string | null
          from_name: string | null
          id: string
          n8n_booking_webhook_url: string | null
          n8n_cancellation_webhook_url: string | null
          n8n_session_request_webhook_url: string | null
          n8n_signup_webhook_url: string | null
          n8n_webhook_url: string | null
          notification_cc_email: string | null
          notification_email: string
          session_request_notifications: boolean
          signup_notifications: boolean
          smtp_host: string | null
          smtp_password: string | null
          smtp_port: number | null
          smtp_use_tls: boolean | null
          smtp_username: string | null
          updated_at: string
        }
        Insert: {
          booking_notifications?: boolean
          created_at?: string
          email_provider?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          n8n_booking_webhook_url?: string | null
          n8n_cancellation_webhook_url?: string | null
          n8n_session_request_webhook_url?: string | null
          n8n_signup_webhook_url?: string | null
          n8n_webhook_url?: string | null
          notification_cc_email?: string | null
          notification_email: string
          session_request_notifications?: boolean
          signup_notifications?: boolean
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_use_tls?: boolean | null
          smtp_username?: string | null
          updated_at?: string
        }
        Update: {
          booking_notifications?: boolean
          created_at?: string
          email_provider?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          n8n_booking_webhook_url?: string | null
          n8n_cancellation_webhook_url?: string | null
          n8n_session_request_webhook_url?: string | null
          n8n_signup_webhook_url?: string | null
          n8n_webhook_url?: string | null
          notification_cc_email?: string | null
          notification_email?: string
          session_request_notifications?: boolean
          signup_notifications?: boolean
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_use_tls?: boolean | null
          smtp_username?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          cancellation_hours: number
          company_name: string | null
          copyright: string | null
          created_at: string
          cta_button: string | null
          cta_description: string | null
          cta_title: string | null
          feature1_description: string | null
          feature1_title: string | null
          feature2_description: string | null
          feature2_title: string | null
          feature3_description: string | null
          feature3_title: string | null
          features_section: string | null
          footer_about: string | null
          footer_color: string | null
          footer_contact: string | null
          footer_login: string | null
          footer_privacy: string | null
          header_color: string | null
          hero_description: string | null
          hero_image: string | null
          hero_title: string | null
          id: string
          logo: string | null
          membership_expiry_basic: number | null
          membership_expiry_premium: number | null
          membership_expiry_standard: number | null
          show_booking_delete_icon: boolean | null
          show_class_delete_icon: boolean | null
          show_low_session_warning: boolean | null
          show_member_delete_icon: boolean | null
          show_testimonials: boolean | null
          testimonials_section: string | null
          updated_at: string
        }
        Insert: {
          cancellation_hours?: number
          company_name?: string | null
          copyright?: string | null
          created_at?: string
          cta_button?: string | null
          cta_description?: string | null
          cta_title?: string | null
          feature1_description?: string | null
          feature1_title?: string | null
          feature2_description?: string | null
          feature2_title?: string | null
          feature3_description?: string | null
          feature3_title?: string | null
          features_section?: string | null
          footer_about?: string | null
          footer_color?: string | null
          footer_contact?: string | null
          footer_login?: string | null
          footer_privacy?: string | null
          header_color?: string | null
          hero_description?: string | null
          hero_image?: string | null
          hero_title?: string | null
          id?: string
          logo?: string | null
          membership_expiry_basic?: number | null
          membership_expiry_premium?: number | null
          membership_expiry_standard?: number | null
          show_booking_delete_icon?: boolean | null
          show_class_delete_icon?: boolean | null
          show_low_session_warning?: boolean | null
          show_member_delete_icon?: boolean | null
          show_testimonials?: boolean | null
          testimonials_section?: string | null
          updated_at?: string
        }
        Update: {
          cancellation_hours?: number
          company_name?: string | null
          copyright?: string | null
          created_at?: string
          cta_button?: string | null
          cta_description?: string | null
          cta_title?: string | null
          feature1_description?: string | null
          feature1_title?: string | null
          feature2_description?: string | null
          feature2_title?: string | null
          feature3_description?: string | null
          feature3_title?: string | null
          features_section?: string | null
          footer_about?: string | null
          footer_color?: string | null
          footer_contact?: string | null
          footer_login?: string | null
          footer_privacy?: string | null
          header_color?: string | null
          hero_description?: string | null
          hero_image?: string | null
          hero_title?: string | null
          id?: string
          logo?: string | null
          membership_expiry_basic?: number | null
          membership_expiry_premium?: number | null
          membership_expiry_standard?: number | null
          show_booking_delete_icon?: boolean | null
          show_class_delete_icon?: boolean | null
          show_low_session_warning?: boolean | null
          show_member_delete_icon?: boolean | null
          show_testimonials?: boolean | null
          testimonials_section?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          attendance: boolean | null
          booking_date: string
          class_id: number
          id: string
          member_id: number | null
          notes: string | null
          status: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          attendance?: boolean | null
          booking_date?: string
          class_id: number
          id?: string
          member_id?: number | null
          notes?: string | null
          status?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          attendance?: boolean | null
          booking_date?: string
          class_id?: number
          id?: string
          member_id?: number | null
          notes?: string | null
          status?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_bookings_member"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          capacity: number
          created_at: string | null
          description: string | null
          difficulty: string | null
          end_time: string | null
          enrolled: number | null
          gender: string | null
          id: number
          location: string | null
          name: string
          schedule: string
          start_time: string | null
          status: string | null
          trainer: string | null
          trainers: string[] | null
        }
        Insert: {
          capacity: number
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          end_time?: string | null
          enrolled?: number | null
          gender?: string | null
          id?: number
          location?: string | null
          name: string
          schedule: string
          start_time?: string | null
          status?: string | null
          trainer?: string | null
          trainers?: string[] | null
        }
        Update: {
          capacity?: number
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          end_time?: string | null
          enrolled?: number | null
          gender?: string | null
          id?: number
          location?: string | null
          name?: string
          schedule?: string
          start_time?: string | null
          status?: string | null
          trainer?: string | null
          trainers?: string[] | null
        }
        Relationships: []
      }
      members: {
        Row: {
          birthday: string | null
          can_be_edited_by_trainers: boolean | null
          created_at: string | null
          email: string
          gender: string | null
          id: number
          membership: string | null
          name: string
          password: number | null
          phone: string | null
          remaining_sessions: number | null
          sessions: number | null
          status: string | null
          total_sessions: number | null
        }
        Insert: {
          birthday?: string | null
          can_be_edited_by_trainers?: boolean | null
          created_at?: string | null
          email: string
          gender?: string | null
          id?: number
          membership?: string | null
          name: string
          password?: number | null
          phone?: string | null
          remaining_sessions?: number | null
          sessions?: number | null
          status?: string | null
          total_sessions?: number | null
        }
        Update: {
          birthday?: string | null
          can_be_edited_by_trainers?: boolean | null
          created_at?: string | null
          email?: string
          gender?: string | null
          id?: number
          membership?: string | null
          name?: string
          password?: number | null
          phone?: string | null
          remaining_sessions?: number | null
          sessions?: number | null
          status?: string | null
          total_sessions?: number | null
        }
        Relationships: []
      }
      membership_requests: {
        Row: {
          created_at: string | null
          date: string
          email: string
          id: number
          member: string
          sessions: number | null
          status: string | null
          type: string
        }
        Insert: {
          created_at?: string | null
          date: string
          email: string
          id?: number
          member: string
          sessions?: number | null
          status?: string | null
          type: string
        }
        Update: {
          created_at?: string | null
          date?: string
          email?: string
          id?: number
          member?: string
          sessions?: number | null
          status?: string | null
          type?: string
        }
        Relationships: []
      }
      membership_types: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: number
          name: string
          price: number
          sessions: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: number
          name: string
          price: number
          sessions: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: number
          name?: string
          price?: number
          sessions?: number
          updated_at?: string
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          notification_type: string
          recipient_email: string
          status: string
          subject: string
          user_email: string | null
          user_name: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          notification_type: string
          recipient_email: string
          status: string
          subject: string
          user_email?: string | null
          user_name?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          notification_type?: string
          recipient_email?: string
          status?: string
          subject?: string
          user_email?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          created_at: string
          id: string
          login_balance_notification: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          login_balance_notification?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          login_balance_notification?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          date: string
          id: number
          member: string
          membership: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          date: string
          id?: number
          member: string
          membership: string
          status: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string
          id?: number
          member?: string
          membership?: string
          status?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          gender: string | null
          id: string
          membership_type: string | null
          name: string | null
          phone_number: string
          sessions_remaining: number | null
          total_sessions: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          gender?: string | null
          id: string
          membership_type?: string | null
          name?: string | null
          phone_number: string
          sessions_remaining?: number | null
          total_sessions?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          gender?: string | null
          id?: string
          membership_type?: string | null
          name?: string | null
          phone_number?: string
          sessions_remaining?: number | null
          total_sessions?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      trainers: {
        Row: {
          created_at: string | null
          email: string
          gender: string | null
          id: number
          name: string
          phone: string | null
          specialization: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          gender?: string | null
          id?: number
          name: string
          phone?: string | null
          specialization?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          gender?: string | null
          id?: number
          name?: string
          phone?: string | null
          specialization?: string | null
          status?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_name: {
        Args: { user_id: string }
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      send_admin_notification: {
        Args: {
          details?: string
          notification_type: string
          user_email: string
          user_name: string
        }
        Returns: undefined
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
