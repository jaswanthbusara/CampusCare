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
      announcements: {
        Row: {
          audience: Database["public"]["Enums"]["app_role"][] | null
          body: string
          created_at: string
          created_by: string
          id: string
          pinned: boolean
          title: string
          updated_at: string
        }
        Insert: {
          audience?: Database["public"]["Enums"]["app_role"][] | null
          body: string
          created_at?: string
          created_by: string
          id?: string
          pinned?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          audience?: Database["public"]["Enums"]["app_role"][] | null
          body?: string
          created_at?: string
          created_by?: string
          id?: string
          pinned?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      cleaning_requests: {
        Row: {
          area_type: string
          assigned_to: string | null
          building: string
          completed_at: string | null
          created_at: string
          description: string
          floor: string | null
          id: string
          remarks: string | null
          room: string | null
          scheduled_for: string | null
          status: Database["public"]["Enums"]["cleaning_status"]
          updated_at: string
          urgency: Database["public"]["Enums"]["complaint_priority"]
          user_id: string
        }
        Insert: {
          area_type?: string
          assigned_to?: string | null
          building: string
          completed_at?: string | null
          created_at?: string
          description: string
          floor?: string | null
          id?: string
          remarks?: string | null
          room?: string | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["cleaning_status"]
          updated_at?: string
          urgency?: Database["public"]["Enums"]["complaint_priority"]
          user_id: string
        }
        Update: {
          area_type?: string
          assigned_to?: string | null
          building?: string
          completed_at?: string | null
          created_at?: string
          description?: string
          floor?: string | null
          id?: string
          remarks?: string | null
          room?: string | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["cleaning_status"]
          updated_at?: string
          urgency?: Database["public"]["Enums"]["complaint_priority"]
          user_id?: string
        }
        Relationships: []
      }
      complaint_feedback: {
        Row: {
          complaint_id: string
          created_at: string
          id: string
          rating: number
          review: string | null
          user_id: string
        }
        Insert: {
          complaint_id: string
          created_at?: string
          id?: string
          rating: number
          review?: string | null
          user_id: string
        }
        Update: {
          complaint_id?: string
          created_at?: string
          id?: string
          rating?: number
          review?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaint_feedback_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: true
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      complaint_images: {
        Row: {
          complaint_id: string
          created_at: string
          id: string
          storage_path: string
        }
        Insert: {
          complaint_id: string
          created_at?: string
          id?: string
          storage_path: string
        }
        Update: {
          complaint_id?: string
          created_at?: string
          id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaint_images_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          assigned_to: string | null
          building: string | null
          category: Database["public"]["Enums"]["complaint_category"]
          completed_at: string | null
          created_at: string
          description: string
          floor: string | null
          id: string
          priority: Database["public"]["Enums"]["complaint_priority"]
          remarks: string | null
          room: string | null
          status: Database["public"]["Enums"]["complaint_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          building?: string | null
          category: Database["public"]["Enums"]["complaint_category"]
          completed_at?: string | null
          created_at?: string
          description: string
          floor?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["complaint_priority"]
          remarks?: string | null
          room?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          building?: string | null
          category?: Database["public"]["Enums"]["complaint_category"]
          completed_at?: string | null
          created_at?: string
          description?: string
          floor?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["complaint_priority"]
          remarks?: string | null
          room?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lost_item_contacts: {
        Row: {
          contact_info: string | null
          created_at: string
          item_id: string
        }
        Insert: {
          contact_info?: string | null
          created_at?: string
          item_id: string
        }
        Update: {
          contact_info?: string | null
          created_at?: string
          item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lost_item_contacts_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "lost_items"
            referencedColumns: ["id"]
          },
        ]
      }
      lost_items: {
        Row: {
          category: string
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          description: string
          id: string
          image_path: string | null
          location: string | null
          occurred_on: string | null
          status: Database["public"]["Enums"]["lost_item_status"]
          title: string
          type: Database["public"]["Enums"]["lost_item_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          description: string
          id?: string
          image_path?: string | null
          location?: string | null
          occurred_on?: string | null
          status?: Database["public"]["Enums"]["lost_item_status"]
          title: string
          type: Database["public"]["Enums"]["lost_item_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          description?: string
          id?: string
          image_path?: string | null
          location?: string | null
          occurred_on?: string | null
          status?: Database["public"]["Enums"]["lost_item_status"]
          title?: string
          type?: Database["public"]["Enums"]["lost_item_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ragging_report_identities: {
        Row: {
          created_at: string
          report_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          report_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          report_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ragging_report_identities_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: true
            referencedRelation: "ragging_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      ragging_reports: {
        Row: {
          building: string | null
          category: Database["public"]["Enums"]["ragging_category"]
          created_at: string
          description: string
          floor: string | null
          id: string
          incident_date: string | null
          is_anonymous: boolean
          remarks: string | null
          room: string | null
          severity: string
          status: Database["public"]["Enums"]["ragging_status"]
          title: string
          updated_at: string
          user_id: string
          wing: Database["public"]["Enums"]["ragging_wing"]
        }
        Insert: {
          building?: string | null
          category?: Database["public"]["Enums"]["ragging_category"]
          created_at?: string
          description: string
          floor?: string | null
          id?: string
          incident_date?: string | null
          is_anonymous?: boolean
          remarks?: string | null
          room?: string | null
          severity?: string
          status?: Database["public"]["Enums"]["ragging_status"]
          title: string
          updated_at?: string
          user_id: string
          wing: Database["public"]["Enums"]["ragging_wing"]
        }
        Update: {
          building?: string | null
          category?: Database["public"]["Enums"]["ragging_category"]
          created_at?: string
          description?: string
          floor?: string | null
          id?: string
          incident_date?: string | null
          is_anonymous?: boolean
          remarks?: string | null
          room?: string | null
          severity?: string
          status?: Database["public"]["Enums"]["ragging_status"]
          title?: string
          updated_at?: string
          user_id?: string
          wing?: Database["public"]["Enums"]["ragging_wing"]
        }
        Relationships: []
      }
      resources: {
        Row: {
          active: boolean
          building: string | null
          category: Database["public"]["Enums"]["complaint_category"]
          code: string
          created_at: string
          created_by: string | null
          floor: string | null
          id: string
          name: string
          room: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          building?: string | null
          category?: Database["public"]["Enums"]["complaint_category"]
          code: string
          created_at?: string
          created_by?: string | null
          floor?: string | null
          id?: string
          name: string
          room?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          building?: string | null
          category?: Database["public"]["Enums"]["complaint_category"]
          code?: string
          created_at?: string
          created_by?: string | null
          floor?: string | null
          id?: string
          name?: string
          room?: string | null
          updated_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_exists: { Args: never; Returns: boolean }
      claim_first_admin: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "teacher" | "staff" | "admin"
      cleaning_status:
        | "pending"
        | "scheduled"
        | "in_progress"
        | "completed"
        | "rejected"
      complaint_category:
        | "fan"
        | "light"
        | "projector"
        | "computer"
        | "printer"
        | "ac"
        | "desk"
        | "chair"
        | "bench"
        | "lab_equipment"
        | "internet"
        | "electrical"
        | "plumbing"
        | "water_cooler"
        | "washroom"
        | "cleanliness"
        | "other"
      complaint_priority: "low" | "medium" | "high" | "critical"
      complaint_status:
        | "submitted"
        | "assigned"
        | "in_progress"
        | "completed"
        | "rejected"
      lost_item_status: "open" | "claimed" | "resolved" | "closed"
      lost_item_type: "lost" | "found"
      ragging_category:
        | "ragging"
        | "harassment"
        | "bullying"
        | "cyber_bullying"
        | "physical_abuse"
        | "verbal_abuse"
        | "other"
      ragging_status:
        | "pending"
        | "under_review"
        | "action_taken"
        | "resolved"
        | "rejected"
      ragging_wing: "girls" | "boys"
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
      app_role: ["student", "teacher", "staff", "admin"],
      cleaning_status: [
        "pending",
        "scheduled",
        "in_progress",
        "completed",
        "rejected",
      ],
      complaint_category: [
        "fan",
        "light",
        "projector",
        "computer",
        "printer",
        "ac",
        "desk",
        "chair",
        "bench",
        "lab_equipment",
        "internet",
        "electrical",
        "plumbing",
        "water_cooler",
        "washroom",
        "cleanliness",
        "other",
      ],
      complaint_priority: ["low", "medium", "high", "critical"],
      complaint_status: [
        "submitted",
        "assigned",
        "in_progress",
        "completed",
        "rejected",
      ],
      lost_item_status: ["open", "claimed", "resolved", "closed"],
      lost_item_type: ["lost", "found"],
      ragging_category: [
        "ragging",
        "harassment",
        "bullying",
        "cyber_bullying",
        "physical_abuse",
        "verbal_abuse",
        "other",
      ],
      ragging_status: [
        "pending",
        "under_review",
        "action_taken",
        "resolved",
        "rejected",
      ],
      ragging_wing: ["girls", "boys"],
    },
  },
} as const
