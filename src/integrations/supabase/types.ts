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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          created_at: string
          details: Json | null
          event_type: string
          id: string
          path: string | null
          referrer: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
          visitor_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          path?: string | null
          referrer?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
          visitor_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          path?: string | null
          referrer?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      admin_notification_settings: {
        Row: {
          active_provider: string
          booking_notifications: boolean
          cancellation_notifications: boolean | null
          created_at: string
          email_provider: string | null
          from_email: string | null
          from_name: string | null
          id: string
          login_notifications: boolean
          n8n_booking_webhook_url: string | null
          n8n_cancellation_webhook_url: string | null
          n8n_session_request_webhook_url: string | null
          n8n_signup_webhook_url: string | null
          n8n_webhook_url: string | null
          notification_cc_email: string | null
          notification_email: string
          notification_provider: string
          notify_member_booking: boolean
          notify_member_cancellation: boolean
          notify_member_session_request: boolean
          notify_member_welcome: boolean
          resend_enabled: boolean | null
          session_request_notifications: boolean
          signup_notifications: boolean
          smtp_host: string | null
          smtp_password: string | null
          smtp_port: number | null
          smtp_use_tls: boolean | null
          smtp_username: string | null
          twilio_admin_number: string | null
          twilio_channel: string
          twilio_from_number: string | null
          updated_at: string
        }
        Insert: {
          active_provider?: string
          booking_notifications?: boolean
          cancellation_notifications?: boolean | null
          created_at?: string
          email_provider?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          login_notifications?: boolean
          n8n_booking_webhook_url?: string | null
          n8n_cancellation_webhook_url?: string | null
          n8n_session_request_webhook_url?: string | null
          n8n_signup_webhook_url?: string | null
          n8n_webhook_url?: string | null
          notification_cc_email?: string | null
          notification_email: string
          notification_provider?: string
          notify_member_booking?: boolean
          notify_member_cancellation?: boolean
          notify_member_session_request?: boolean
          notify_member_welcome?: boolean
          resend_enabled?: boolean | null
          session_request_notifications?: boolean
          signup_notifications?: boolean
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_use_tls?: boolean | null
          smtp_username?: string | null
          twilio_admin_number?: string | null
          twilio_channel?: string
          twilio_from_number?: string | null
          updated_at?: string
        }
        Update: {
          active_provider?: string
          booking_notifications?: boolean
          cancellation_notifications?: boolean | null
          created_at?: string
          email_provider?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          login_notifications?: boolean
          n8n_booking_webhook_url?: string | null
          n8n_cancellation_webhook_url?: string | null
          n8n_session_request_webhook_url?: string | null
          n8n_signup_webhook_url?: string | null
          n8n_webhook_url?: string | null
          notification_cc_email?: string | null
          notification_email?: string
          notification_provider?: string
          notify_member_booking?: boolean
          notify_member_cancellation?: boolean
          notify_member_session_request?: boolean
          notify_member_welcome?: boolean
          resend_enabled?: boolean | null
          session_request_notifications?: boolean
          signup_notifications?: boolean
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_use_tls?: boolean | null
          smtp_username?: string | null
          twilio_admin_number?: string | null
          twilio_channel?: string
          twilio_from_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          auto_approve_balance_requests: boolean | null
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
          logo_url: string | null
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
          auto_approve_balance_requests?: boolean | null
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
          logo_url?: string | null
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
          auto_approve_balance_requests?: boolean | null
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
          logo_url?: string | null
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
        Relationships: []
      }
      classes: {
        Row: {
          capacity: number
          color: string | null
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
          color?: string | null
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
          color?: string | null
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
      email_templates: {
        Row: {
          accent_color: string | null
          body: string | null
          button_label: string | null
          category: string
          created_at: string
          display_name: string
          enabled: boolean
          footer_text: string | null
          heading: string | null
          id: string
          intro: string | null
          preheader: string | null
          sender_name: string | null
          subject: string | null
          template_key: string
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          body?: string | null
          button_label?: string | null
          category?: string
          created_at?: string
          display_name: string
          enabled?: boolean
          footer_text?: string | null
          heading?: string | null
          id?: string
          intro?: string | null
          preheader?: string | null
          sender_name?: string | null
          subject?: string | null
          template_key: string
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          body?: string | null
          button_label?: string | null
          category?: string
          created_at?: string
          display_name?: string
          enabled?: boolean
          footer_text?: string | null
          heading?: string | null
          id?: string
          intro?: string | null
          preheader?: string | null
          sender_name?: string | null
          subject?: string | null
          template_key?: string
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
      members: {
        Row: {
          birthday: string | null
          can_be_edited_by_trainers: boolean | null
          count_credit: boolean
          created_at: string | null
          deleted_at: string | null
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
          count_credit?: boolean
          created_at?: string | null
          deleted_at?: string | null
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
          count_credit?: boolean
          created_at?: string | null
          deleted_at?: string | null
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
          booking_enabled: boolean
          cancellation_enabled: boolean
          created_at: string
          id: string
          login_balance_notification: boolean
          login_enabled: boolean
          signup_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_enabled?: boolean
          cancellation_enabled?: boolean
          created_at?: string
          id?: string
          login_balance_notification?: boolean
          login_enabled?: boolean
          signup_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_enabled?: boolean
          cancellation_enabled?: boolean
          created_at?: string
          id?: string
          login_balance_notification?: boolean
          login_enabled?: boolean
          signup_enabled?: boolean
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
      session_history: {
        Row: {
          changed_by_name: string | null
          changed_by_user_id: string | null
          created_at: string
          delta: number
          id: string
          member_id: number
          member_name: string | null
          new_sessions: number
          previous_sessions: number
          reason: string | null
        }
        Insert: {
          changed_by_name?: string | null
          changed_by_user_id?: string | null
          created_at?: string
          delta: number
          id?: string
          member_id: number
          member_name?: string | null
          new_sessions: number
          previous_sessions: number
          reason?: string | null
        }
        Update: {
          changed_by_name?: string | null
          changed_by_user_id?: string | null
          created_at?: string
          delta?: number
          id?: string
          member_id?: number
          member_name?: string | null
          new_sessions?: number
          previous_sessions?: number
          reason?: string | null
        }
        Relationships: []
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
      trainers: {
        Row: {
          auth_id: string | null
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
          auth_id?: string | null
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
          auth_id?: string | null
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
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_delivery_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          payload: Json | null
          response_body: string | null
          status_code: number | null
          success: boolean
          webhook_type: string
          webhook_url: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          payload?: Json | null
          response_body?: string | null
          status_code?: number | null
          success?: boolean
          webhook_type: string
          webhook_url?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          payload?: Json | null
          response_body?: string | null
          status_code?: number | null
          success?: boolean
          webhook_type?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_user_name: { Args: { user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_trainer: { Args: never; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "trainer" | "user"
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
      app_role: ["admin", "trainer", "user"],
    },
  },
} as const
