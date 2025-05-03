export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bookings: {
        Row: {
          attendance: boolean | null
          booking_date: string
          class_id: number
          id: string
          notes: string | null
          status: string
          user_id: string
        }
        Insert: {
          attendance?: boolean | null
          booking_date?: string
          class_id: number
          id?: string
          notes?: string | null
          status?: string
          user_id: string
        }
        Update: {
          attendance?: boolean | null
          booking_date?: string
          class_id?: number
          id?: string
          notes?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
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
          phone: string | null
          remaining_sessions: number | null
          sessions: number | null
          status: string | null
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
          phone?: string | null
          remaining_sessions?: number | null
          sessions?: number | null
          status?: string | null
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
          phone?: string | null
          remaining_sessions?: number | null
          sessions?: number | null
          status?: string | null
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
          status: string | null
          type: string
        }
        Insert: {
          created_at?: string | null
          date: string
          email: string
          id?: number
          member: string
          status?: string | null
          type: string
        }
        Update: {
          created_at?: string | null
          date?: string
          email?: string
          id?: number
          member?: string
          status?: string | null
          type?: string
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
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
