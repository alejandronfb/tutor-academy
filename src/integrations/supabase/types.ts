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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_points: {
        Row: {
          earned_at: string | null
          id: string
          points: number
          reason: string | null
          tutor_id: string
        }
        Insert: {
          earned_at?: string | null
          id?: string
          points: number
          reason?: string | null
          tutor_id: string
        }
        Update: {
          earned_at?: string | null
          id?: string
          points?: number
          reason?: string | null
          tutor_id?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          description: string | null
          icon: string | null
          id: string
          name: string
          unlock_criteria: Json | null
          unlock_type: string | null
        }
        Insert: {
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          unlock_criteria?: Json | null
          unlock_type?: string | null
        }
        Update: {
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          unlock_criteria?: Json | null
          unlock_type?: string | null
        }
        Relationships: []
      }
      certifications: {
        Row: {
          course_id: string
          id: string
          issued_at: string | null
          title: string
          tutor_id: string
          verification_id: string
        }
        Insert: {
          course_id: string
          id?: string
          issued_at?: string | null
          title: string
          tutor_id: string
          verification_id?: string
        }
        Update: {
          course_id?: string
          id?: string
          issued_at?: string | null
          title?: string
          tutor_id?: string
          verification_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certifications_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          id: string
          started_at: string | null
          tutor_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          id?: string
          started_at?: string | null
          tutor_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          id?: string
          started_at?: string | null
          tutor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string | null
          id: string
          sort_order: number | null
          title: string
        }
        Insert: {
          course_id?: string | null
          id?: string
          sort_order?: number | null
          title: string
        }
        Update: {
          course_id?: string | null
          id?: string
          sort_order?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          certificate_template: string | null
          certificate_title: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          difficulty: string | null
          duration_hours: number | null
          icon: string | null
          id: string
          pathway: string
          slug: string
          sort_order: number | null
          status: string | null
          title: string
        }
        Insert: {
          certificate_template?: string | null
          certificate_title?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          duration_hours?: number | null
          icon?: string | null
          id?: string
          pathway: string
          slug: string
          sort_order?: number | null
          status?: string | null
          title: string
        }
        Update: {
          certificate_template?: string | null
          certificate_title?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          duration_hours?: number | null
          icon?: string | null
          id?: string
          pathway?: string
          slug?: string
          sort_order?: number | null
          status?: string | null
          title?: string
        }
        Relationships: []
      }
      invitation_codes: {
        Row: {
          code: string
          created_at: string | null
          id: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      lesson_completions: {
        Row: {
          completed_at: string | null
          id: string
          lesson_id: string
          tutor_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          lesson_id: string
          tutor_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          lesson_id?: string
          tutor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_completions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: string
          id: string
          module_id: string | null
          sort_order: number | null
          title: string
        }
        Insert: {
          content: string
          id?: string
          module_id?: string | null
          sort_order?: number | null
          title: string
        }
        Update: {
          content?: string
          id?: string
          module_id?: string | null
          sort_order?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          tutor_id: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          tutor_id: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          tutor_id?: string
          type?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          client: string | null
          created_at: string | null
          description: string | null
          hours_per_week: string | null
          id: string
          modality: string | null
          pay_rate: string | null
          requirements: string | null
          schedule: string | null
          status: string | null
          subject: string | null
          title: string
        }
        Insert: {
          client?: string | null
          created_at?: string | null
          description?: string | null
          hours_per_week?: string | null
          id?: string
          modality?: string | null
          pay_rate?: string | null
          requirements?: string | null
          schedule?: string | null
          status?: string | null
          subject?: string | null
          title: string
        }
        Update: {
          client?: string | null
          created_at?: string | null
          description?: string | null
          hours_per_week?: string | null
          id?: string
          modality?: string | null
          pay_rate?: string | null
          requirements?: string | null
          schedule?: string | null
          status?: string | null
          subject?: string | null
          title?: string
        }
        Relationships: []
      }
      opportunity_interest: {
        Row: {
          created_at: string | null
          id: string
          opportunity_id: string
          status: string | null
          tutor_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          opportunity_id: string
          status?: string | null
          tutor_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          opportunity_id?: string
          status?: string | null
          tutor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_interest_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      proficiency_results: {
        Row: {
          grammar_score: number | null
          id: string
          level_awarded: string | null
          reading_score: number | null
          taken_at: string | null
          total_score: number | null
          tutor_id: string
          vocabulary_score: number | null
        }
        Insert: {
          grammar_score?: number | null
          id?: string
          level_awarded?: string | null
          reading_score?: number | null
          taken_at?: string | null
          total_score?: number | null
          tutor_id: string
          vocabulary_score?: number | null
        }
        Update: {
          grammar_score?: number | null
          id?: string
          level_awarded?: string | null
          reading_score?: number | null
          taken_at?: string | null
          total_score?: number | null
          tutor_id?: string
          vocabulary_score?: number | null
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          attempted_at: string | null
          id: string
          passed: boolean
          quiz_id: string
          score: number
          tutor_id: string
        }
        Insert: {
          attempted_at?: string | null
          id?: string
          passed: boolean
          quiz_id: string
          score: number
          tutor_id: string
        }
        Update: {
          attempted_at?: string | null
          id?: string
          passed?: boolean
          quiz_id?: string
          score?: number
          tutor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_index: number
          id: string
          options: Json
          question: string
          quiz_id: string | null
          sort_order: number | null
        }
        Insert: {
          correct_index: number
          id?: string
          options: Json
          question: string
          quiz_id?: string | null
          sort_order?: number | null
        }
        Update: {
          correct_index?: number
          id?: string
          options?: Json
          question?: string
          quiz_id?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          course_id: string | null
          id: string
          is_final: boolean | null
          module_id: string | null
          passing_score: number | null
        }
        Insert: {
          course_id?: string | null
          id?: string
          is_final?: boolean | null
          module_id?: string | null
          passing_score?: number | null
        }
        Update: {
          course_id?: string | null
          id?: string
          is_final?: boolean | null
          module_id?: string | null
          passing_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      tutor_hours: {
        Row: {
          hours: number
          id: string
          logged_at: string | null
          source: string | null
          tutor_id: string
        }
        Insert: {
          hours: number
          id?: string
          logged_at?: string | null
          source?: string | null
          tutor_id: string
        }
        Update: {
          hours?: number
          id?: string
          logged_at?: string | null
          source?: string | null
          tutor_id?: string
        }
        Relationships: []
      }
      tutor_profiles: {
        Row: {
          country: string | null
          created_at: string | null
          english_level: string | null
          full_name: string
          id: string
          last_activity_date: string | null
          learning_streak: number | null
          linkedin_url: string | null
          native_language: string | null
          specializations: string[] | null
          teaching_modality: string | null
          tutor_level: number | null
          years_experience: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          english_level?: string | null
          full_name: string
          id: string
          last_activity_date?: string | null
          learning_streak?: number | null
          linkedin_url?: string | null
          native_language?: string | null
          specializations?: string[] | null
          teaching_modality?: string | null
          tutor_level?: number | null
          years_experience?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          english_level?: string | null
          full_name?: string
          id?: string
          last_activity_date?: string | null
          learning_streak?: number | null
          linkedin_url?: string | null
          native_language?: string | null
          specializations?: string[] | null
          teaching_modality?: string | null
          tutor_level?: number | null
          years_experience?: string | null
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          id: string
          tutor_id: string
          unlocked_at: string | null
        }
        Insert: {
          badge_id: string
          id?: string
          tutor_id: string
          unlocked_at?: string | null
        }
        Update: {
          badge_id?: string
          id?: string
          tutor_id?: string
          unlocked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      has_course_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
