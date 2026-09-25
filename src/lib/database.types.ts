export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      babies: {
        Row: {
          birth_date: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          sex: Database["public"]["Enums"]["baby_sex"] | null
          updated_at: string
        }
        Insert: {
          birth_date: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          sex?: Database["public"]["Enums"]["baby_sex"] | null
          updated_at?: string
        }
        Update: {
          birth_date?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          sex?: Database["public"]["Enums"]["baby_sex"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "babies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      baby_invites: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          baby_id: string
          code: string
          created_at: string
          created_by: string
          expires_at: string
          id: string
          revoked_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          baby_id: string
          code: string
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          revoked_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          baby_id?: string
          code?: string
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          revoked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "baby_invites_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "baby_invites_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "babies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "baby_invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      baby_members: {
        Row: {
          baby_id: string
          created_at: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          baby_id: string
          created_at?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          baby_id?: string
          created_at?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "baby_members_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "babies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "baby_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bottle_events: {
        Row: {
          amount: number
          event_id: string
          milk_type: Database["public"]["Enums"]["milk_type"]
          unit: Database["public"]["Enums"]["volume_unit"]
        }
        Insert: {
          amount: number
          event_id: string
          milk_type: Database["public"]["Enums"]["milk_type"]
          unit?: Database["public"]["Enums"]["volume_unit"]
        }
        Update: {
          amount?: number
          event_id?: string
          milk_type?: Database["public"]["Enums"]["milk_type"]
          unit?: Database["public"]["Enums"]["volume_unit"]
        }
        Relationships: [
          {
            foreignKeyName: "bottle_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      diaper_events: {
        Row: {
          event_id: string
          stool_amount: Database["public"]["Enums"]["stool_amount"] | null
          stool_color: Database["public"]["Enums"]["stool_color"] | null
          type: Database["public"]["Enums"]["diaper_type"]
        }
        Insert: {
          event_id: string
          stool_amount?: Database["public"]["Enums"]["stool_amount"] | null
          stool_color?: Database["public"]["Enums"]["stool_color"] | null
          type: Database["public"]["Enums"]["diaper_type"]
        }
        Update: {
          event_id?: string
          stool_amount?: Database["public"]["Enums"]["stool_amount"] | null
          stool_color?: Database["public"]["Enums"]["stool_color"] | null
          type?: Database["public"]["Enums"]["diaper_type"]
        }
        Relationships: [
          {
            foreignKeyName: "diaper_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_visit_events: {
        Row: {
          event_id: string
          visit_type: string
        }
        Insert: {
          event_id: string
          visit_type: string
        }
        Update: {
          event_id?: string
          visit_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_visit_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          baby_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          duration_seconds: number | null
          ended_at: string | null
          ended_by: string | null
          id: string
          kind: Database["public"]["Enums"]["event_kind"]
          notes: string | null
          started_at: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          baby_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          ended_by?: string | null
          id?: string
          kind: Database["public"]["Enums"]["event_kind"]
          notes?: string | null
          started_at?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          baby_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          ended_by?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["event_kind"]
          notes?: string | null
          started_at?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "babies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_ended_by_fkey"
            columns: ["ended_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feeding_sessions: {
        Row: {
          event_id: string
          side: Database["public"]["Enums"]["breast_side"]
        }
        Insert: {
          event_id: string
          side: Database["public"]["Enums"]["breast_side"]
        }
        Update: {
          event_id?: string
          side?: Database["public"]["Enums"]["breast_side"]
        }
        Relationships: [
          {
            foreignKeyName: "feeding_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      measurements: {
        Row: {
          event_id: string
          metric: Database["public"]["Enums"]["measurement_metric"]
          unit: string
          value: number
        }
        Insert: {
          event_id: string
          metric: Database["public"]["Enums"]["measurement_metric"]
          unit: string
          value: number
        }
        Update: {
          event_id?: string
          metric?: Database["public"]["Enums"]["measurement_metric"]
          unit?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "measurements_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_events: {
        Row: {
          dose: number
          event_id: string
          medication_id: string | null
          name: string
          unit: string
        }
        Insert: {
          dose: number
          event_id: string
          medication_id?: string | null
          name: string
          unit: string
        }
        Update: {
          dose?: number
          event_id?: string
          medication_id?: string | null
          name?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_events_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          archived: boolean
          baby_id: string
          created_at: string
          created_by: string | null
          default_dose: number | null
          default_unit: string | null
          id: string
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          archived?: boolean
          baby_id: string
          created_at?: string
          created_by?: string | null
          default_dose?: number | null
          default_unit?: string | null
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          archived?: boolean
          baby_id?: string
          created_at?: string
          created_by?: string | null
          default_dose?: number | null
          default_unit?: string | null
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medications_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "babies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      pumping_sessions: {
        Row: {
          amount: number | null
          event_id: string
          side: Database["public"]["Enums"]["pump_side"]
          unit: Database["public"]["Enums"]["volume_unit"]
        }
        Insert: {
          amount?: number | null
          event_id: string
          side: Database["public"]["Enums"]["pump_side"]
          unit?: Database["public"]["Enums"]["volume_unit"]
        }
        Update: {
          amount?: number | null
          event_id?: string
          side?: Database["public"]["Enums"]["pump_side"]
          unit?: Database["public"]["Enums"]["volume_unit"]
        }
        Relationships: [
          {
            foreignKeyName: "pumping_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      vaccinations: {
        Row: {
          dose_number: number | null
          event_id: string
          vaccine_name: string
        }
        Insert: {
          dose_number?: number | null
          event_id: string
          vaccine_name: string
        }
        Update: {
          dose_number?: number | null
          event_id?: string
          vaccine_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "vaccinations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invite: { Args: { p_code: string }; Returns: string }
      create_baby: {
        Args: {
          p_birth_date: string
          p_name: string
          p_sex?: Database["public"]["Enums"]["baby_sex"]
        }
        Returns: {
          birth_date: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          sex: Database["public"]["Enums"]["baby_sex"] | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "babies"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_invite: {
        Args: { p_baby_id: string }
        Returns: {
          accepted_at: string | null
          accepted_by: string | null
          baby_id: string
          code: string
          created_at: string
          created_by: string
          expires_at: string
          id: string
          revoked_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "baby_invites"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      delete_event: { Args: { p_id: string }; Returns: Json }
      end_session: {
        Args: { p_details?: Json; p_ended_at?: string; p_id: string }
        Returns: Json
      }
      event_json: { Args: { p_event_id: string }; Returns: Json }
      get_invite: { Args: { p_code: string }; Returns: Json }
      is_baby_member: { Args: { p_baby_id: string }; Returns: boolean }
      is_baby_owner: { Args: { p_baby_id: string }; Returns: boolean }
      is_event_member: { Args: { p_event_id: string }; Returns: boolean }
      normalize_invite_code: { Args: { p_code: string }; Returns: string }
      pull_events: {
        Args: {
          p_after_id?: string
          p_baby_ids: string[]
          p_limit?: number
          p_since?: string
        }
        Returns: Json
      }
      restore_event: { Args: { p_id: string }; Returns: Json }
      server_now: { Args: never; Returns: string }
      shares_baby_with: { Args: { p_user_id: string }; Returns: boolean }
      start_session: {
        Args: {
          p_baby_id: string
          p_details: Json
          p_id: string
          p_kind: Database["public"]["Enums"]["event_kind"]
          p_started_at?: string
        }
        Returns: Json
      }
      switch_breast_side: {
        Args: { p_at?: string; p_id: string; p_new_id: string }
        Returns: Json
      }
      upsert_event: { Args: { p_event: Json }; Returns: Json }
      write_event_details: {
        Args: {
          p_details: Json
          p_event_id: string
          p_kind: Database["public"]["Enums"]["event_kind"]
        }
        Returns: undefined
      }
    }
    Enums: {
      baby_sex: "female" | "male"
      breast_side: "left" | "right"
      diaper_type: "wet" | "dirty" | "mixed"
      event_kind:
        | "breastfeeding"
        | "diaper"
        | "bottle"
        | "pumping"
        | "medication"
        | "vaccination"
        | "measurement"
        | "bath"
        | "doctor_visit"
      measurement_metric: "weight" | "length" | "head"
      member_role: "owner" | "member"
      milk_type: "breast_milk" | "formula" | "other"
      pump_side: "left" | "right" | "both"
      stool_amount: "small" | "medium" | "large"
      stool_color: "yellow" | "green" | "brown" | "black" | "red" | "white"
      volume_unit: "ml" | "oz"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      baby_sex: ["female", "male"],
      breast_side: ["left", "right"],
      diaper_type: ["wet", "dirty", "mixed"],
      event_kind: [
        "breastfeeding",
        "diaper",
        "bottle",
        "pumping",
        "medication",
        "vaccination",
        "measurement",
        "bath",
        "doctor_visit",
      ],
      measurement_metric: ["weight", "length", "head"],
      member_role: ["owner", "member"],
      milk_type: ["breast_milk", "formula", "other"],
      pump_side: ["left", "right", "both"],
      stool_amount: ["small", "medium", "large"],
      stool_color: ["yellow", "green", "brown", "black", "red", "white"],
      volume_unit: ["ml", "oz"],
    },
  },
} as const

