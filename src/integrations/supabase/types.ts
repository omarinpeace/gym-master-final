export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string;
          conversation_id: string;
          created_at: string;
          id: string;
          role: string;
          user_id: string;
        };
        Insert: {
          content: string;
          conversation_id?: string;
          created_at?: string;
          id?: string;
          role: string;
          user_id: string;
        };
        Update: {
          content?: string;
          conversation_id?: string;
          created_at?: string;
          id?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      checkins: {
        Row: {
          ended_at: string | null;
          gym_name: string | null;
          id: string;
          started_at: string;
          user_id: string;
        };
        Insert: {
          ended_at?: string | null;
          gym_name?: string | null;
          id?: string;
          started_at?: string;
          user_id: string;
        };
        Update: {
          ended_at?: string | null;
          gym_name?: string | null;
          id?: string;
          started_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      exercise_sets: {
        Row: {
          completed: boolean;
          created_at: string;
          exercise_name: string;
          id: string;
          reps: number | null;
          rest_seconds: number | null;
          set_index: number;
          target_reps: number | null;
          user_id: string;
          weight_kg: number | null;
          workout_id: string;
        };
        Insert: {
          completed?: boolean;
          created_at?: string;
          exercise_name: string;
          id?: string;
          reps?: number | null;
          rest_seconds?: number | null;
          set_index: number;
          target_reps?: number | null;
          user_id: string;
          weight_kg?: number | null;
          workout_id: string;
        };
        Update: {
          completed?: boolean;
          created_at?: string;
          exercise_name?: string;
          id?: string;
          reps?: number | null;
          rest_seconds?: number | null;
          set_index?: number;
          target_reps?: number | null;
          user_id?: string;
          weight_kg?: number | null;
          workout_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exercise_sets_workout_id_fkey";
            columns: ["workout_id"];
            isOneToOne: false;
            referencedRelation: "workouts";
            referencedColumns: ["id"];
          },
        ];
      };
      inbody_scans: {
        Row: {
          body_fat_pct: number | null;
          created_at: string;
          id: string;
          image_url: string | null;
          muscle_mass_kg: number | null;
          raw_analysis: Json | null;
          recommendations: string | null;
          user_id: string;
          weight_kg: number | null;
        };
        Insert: {
          body_fat_pct?: number | null;
          created_at?: string;
          id?: string;
          image_url?: string | null;
          muscle_mass_kg?: number | null;
          raw_analysis?: Json | null;
          recommendations?: string | null;
          user_id: string;
          weight_kg?: number | null;
        };
        Update: {
          body_fat_pct?: number | null;
          created_at?: string;
          id?: string;
          image_url?: string | null;
          muscle_mass_kg?: number | null;
          raw_analysis?: Json | null;
          recommendations?: string | null;
          user_id?: string;
          weight_kg?: number | null;
        };
        Relationships: [];
      };
      injuries: {
        Row: {
          active: boolean;
          body_part: string;
          created_at: string;
          id: string;
          notes: string | null;
          severity: string;
          user_id: string;
        };
        Insert: {
          active?: boolean;
          body_part: string;
          created_at?: string;
          id?: string;
          notes?: string | null;
          severity?: string;
          user_id: string;
        };
        Update: {
          active?: boolean;
          body_part?: string;
          created_at?: string;
          id?: string;
          notes?: string | null;
          severity?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      meals: {
        Row: {
          calories: number | null;
          carbs_g: number | null;
          cost_egp: number | null;
          created_at: string;
          date: string;
          fat_g: number | null;
          id: string;
          ingredients: Json | null;
          is_planned: boolean;
          meal_type: string;
          name: string;
          protein_g: number | null;
          recipe: string | null;
          user_id: string;
        };
        Insert: {
          calories?: number | null;
          carbs_g?: number | null;
          cost_egp?: number | null;
          created_at?: string;
          date: string;
          fat_g?: number | null;
          id?: string;
          ingredients?: Json | null;
          is_planned?: boolean;
          meal_type: string;
          name: string;
          protein_g?: number | null;
          recipe?: string | null;
          user_id: string;
        };
        Update: {
          calories?: number | null;
          carbs_g?: number | null;
          cost_egp?: number | null;
          created_at?: string;
          date?: string;
          fat_g?: number | null;
          id?: string;
          ingredients?: Json | null;
          is_planned?: boolean;
          meal_type?: string;
          name?: string;
          protein_g?: number | null;
          recipe?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      plans: {
        Row: {
          created_at: string;
          id: string;
          plan_data: Json;
          reasoning: string | null;
          summary: string | null;
          user_id: string;
          week_start: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          plan_data: Json;
          reasoning?: string | null;
          summary?: string | null;
          user_id: string;
          week_start: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          plan_data?: Json;
          reasoning?: string | null;
          summary?: string | null;
          user_id?: string;
          week_start?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          age: number | null;
          created_at: string;
          display_name: string | null;
          experience_level: string | null;
          goal: string | null;
          height_cm: number | null;
          id: string;
          sex: string | null;
          updated_at: string;
          weekly_target_workouts: number | null;
          weight_kg: number | null;
          target_calories: number | null;
          target_protein_g: number | null;
          target_carbs_g: number | null;
          target_fat_g: number | null;
          equipment: string[] | null;
        };
        Insert: {
          age?: number | null;
          created_at?: string;
          display_name?: string | null;
          experience_level?: string | null;
          goal?: string | null;
          height_cm?: number | null;
          id: string;
          sex?: string | null;
          updated_at?: string;
          weekly_target_workouts?: number | null;
          weight_kg?: number | null;
          target_calories?: number | null;
          target_protein_g?: number | null;
          target_carbs_g?: number | null;
          target_fat_g?: number | null;
          equipment?: string[] | null;
        };
        Update: {
          age?: number | null;
          created_at?: string;
          display_name?: string | null;
          experience_level?: string | null;
          goal?: string | null;
          height_cm?: number | null;
          id?: string;
          sex?: string | null;
          updated_at?: string;
          weekly_target_workouts?: number | null;
          weight_kg?: number | null;
          target_calories?: number | null;
          target_protein_g?: number | null;
          target_carbs_g?: number | null;
          target_fat_g?: number | null;
          equipment?: string[] | null;
        };
        Relationships: [];
      };
      progress_photos: {
        Row: {
          created_at: string;
          id: string;
          image_url: string;
          label: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          image_url: string;
          label?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          image_url?: string;
          label?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      workouts: {
        Row: {
          completed: boolean;
          completed_at: string | null;
          created_at: string;
          focus: string | null;
          id: string;
          name: string;
          notes: string | null;
          plan_id: string | null;
          scheduled_date: string;
          user_id: string;
        };
        Insert: {
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          focus?: string | null;
          id?: string;
          name: string;
          notes?: string | null;
          plan_id?: string | null;
          scheduled_date: string;
          user_id: string;
        };
        Update: {
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          focus?: string | null;
          id?: string;
          name?: string;
          notes?: string | null;
          plan_id?: string | null;
          scheduled_date?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workouts_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plans";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
