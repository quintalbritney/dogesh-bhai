// Hand-written to match supabase/migrations/0001_init.sql.
// Once the real Supabase project exists, this can be regenerated with:
//   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/types.ts
//
// NOTE: these must be `type` aliases, not `interface`s — interfaces don't get
// the implicit index signature needed to satisfy supabase-js's
// Record<string, unknown> Row/Insert/Update constraints, which silently
// collapses every query result to `never`.

export type UserRole = "caregiver" | "vet" | "ngo" | "admin";
export type OrgVerificationStatus = "unverified" | "verified";
export type DogSex = "male" | "female" | "unknown";
export type DogStatus = "well_cared_for" | "attention_needed" | "care_gap";
export type PingSource = "manual" | "qr_scan" | "care_task" | "sighting";
export type CaregiverRole = "primary" | "backup";
export type CaregiverStatus = "active" | "left";
export type CareTaskStatus = "scheduled" | "completed" | "missed";
export type HealthEventType =
  | "vaccination"
  | "sterilisation"
  | "treatment"
  | "injury"
  | "vet_visit";
export type VerificationStatus =
  | "unverified"
  | "community"
  | "verified"
  | "disputed";
export type CaseSeverity = "low" | "medium" | "high" | "critical";
export type CaseStatus =
  | "reported"
  | "claimed"
  | "responding"
  | "at_vet"
  | "treatment"
  | "resolved";
export type DuplicateFlagStatus = "pending" | "same" | "different";

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  org_id: string | null;
  created_at: string;
};

export type Organisation = {
  id: string;
  name: string;
  type: string | null;
  verification_status: OrgVerificationStatus;
  created_by: string | null;
  created_at: string;
};

export type Dog = {
  id: string;
  pawpass_id: string;
  name: string;
  sex: DogSex;
  age_estimate: string | null;
  coat_notes: string | null;
  markers: string | null;
  photo_url: string | null;
  current_lat: number | null;
  current_lng: number | null;
  location_label: string | null;
  status: DogStatus;
  created_by: string;
  archived: boolean;
  merged_into: string | null;
  created_at: string;
};

export type LocationPing = {
  id: string;
  dog_id: string;
  lat: number;
  lng: number;
  source: PingSource;
  logged_by: string;
  created_at: string;
};

export type CaregiverAssignment = {
  id: string;
  dog_id: string;
  user_id: string;
  role: CaregiverRole;
  status: CaregiverStatus;
  created_at: string;
};

export type CareSchedule = {
  id: string;
  dog_id: string;
  task_type: string;
  frequency: string;
  created_by: string;
  created_at: string;
};

export type CareTask = {
  id: string;
  schedule_id: string;
  dog_id: string;
  due_date: string;
  status: CareTaskStatus;
  completed_by: string | null;
  completed_at: string | null;
  created_at: string;
};

export type HealthEvent = {
  id: string;
  dog_id: string;
  type: HealthEventType;
  event_date: string;
  provider: string | null;
  notes: string | null;
  evidence_url: string | null;
  verification_status: VerificationStatus;
  submitted_by: string;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
};

export type MedicalCase = {
  id: string;
  dog_id: string;
  severity: CaseSeverity;
  location_label: string | null;
  evidence_url: string | null;
  status: CaseStatus;
  reported_by: string;
  claimed_by: string | null;
  created_at: string;
  resolved_at: string | null;
};

export type TimelineEvent = {
  id: string;
  dog_id: string;
  event_type: string;
  ref_table: string | null;
  ref_id: string | null;
  description: string;
  created_by: string;
  created_at: string;
};

export type DuplicateFlag = {
  id: string;
  dog_a: string;
  dog_b: string;
  note: string | null;
  status: DuplicateFlagStatus;
  resolved_by: string | null;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  type: string;
  message: string;
  read_status: boolean;
  created_at: string;
};

type TableDef<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<
        Profile,
        Partial<Profile> & { id: string },
        Partial<Profile>
      >;
      organisations: TableDef<
        Organisation,
        Partial<Organisation> & { name: string },
        Partial<Organisation>
      >;
      dogs: TableDef<
        Dog,
        Partial<Dog> & { name: string; created_by: string },
        Partial<Dog>
      >;
      location_pings: TableDef<
        LocationPing,
        Partial<LocationPing> & {
          dog_id: string;
          lat: number;
          lng: number;
          logged_by: string;
        },
        Partial<LocationPing>
      >;
      caregiver_assignments: TableDef<
        CaregiverAssignment,
        Partial<CaregiverAssignment> & { dog_id: string; user_id: string },
        Partial<CaregiverAssignment>
      >;
      care_schedules: TableDef<
        CareSchedule,
        Partial<CareSchedule> & { dog_id: string; created_by: string },
        Partial<CareSchedule>
      >;
      care_tasks: TableDef<
        CareTask,
        Partial<CareTask> & {
          schedule_id: string;
          dog_id: string;
          due_date: string;
        },
        Partial<CareTask>
      >;
      health_events: TableDef<
        HealthEvent,
        Partial<HealthEvent> & {
          dog_id: string;
          type: HealthEventType;
          submitted_by: string;
        },
        Partial<HealthEvent>
      >;
      medical_cases: TableDef<
        MedicalCase,
        Partial<MedicalCase> & { dog_id: string; reported_by: string },
        Partial<MedicalCase>
      >;
      timeline_events: TableDef<
        TimelineEvent,
        Partial<TimelineEvent> & {
          dog_id: string;
          event_type: string;
          description: string;
          created_by: string;
        },
        Partial<TimelineEvent>
      >;
      duplicate_flags: TableDef<
        DuplicateFlag,
        Partial<DuplicateFlag> & { dog_a: string; dog_b: string },
        Partial<DuplicateFlag>
      >;
      notifications: TableDef<
        Notification,
        Partial<Notification> & {
          user_id: string;
          type: string;
          message: string;
        },
        Partial<Notification>
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
