-- ─────────────────────────────────────────────────────────────────────────────
-- Schema-of-record: base + collision tables (2026-07-19)
--
-- These core tables (exams, expenses, modules, timetable_slots, work_shifts,
-- part_time_jobs) were only ever ALTER'd in migrations — never CREATE'd — so a
-- fresh `supabase db reset` / CI provision produced a DB missing them and the
-- dashboard/study/work routes 400/500'd. Definitions below are introspected
-- verbatim from the live DB (columns, PK inline, checks, FKs, RLS + policies).
--
-- The trailing ALTER…ADD COLUMN IF NOT EXISTS blocks reconcile tables that were
-- CREATE'd twice with divergent columns (attendance_records, campus_events,
-- event_rsvps, nsfas_disbursements): whichever historical def wins on a fresh
-- run, this guarantees the full live column set the code expects exists.
--
-- Fully idempotent — safe against live (all objects already exist) and re-runs.
-- ─────────────────────────────────────────────────────────────────────────────

-- ===== exams =====
CREATE TABLE IF NOT EXISTS public.exams (
  id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  module_id uuid,
  exam_name text NOT NULL,
  exam_date timestamptz NOT NULL,
  venue text,
  duration_minutes int4,
  exam_type text DEFAULT 'final'::text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  start_time text
);
DO $$ BEGIN ALTER TABLE public.exams ADD CONSTRAINT exams_exam_type_check CHECK ((exam_type = ANY (ARRAY['test'::text, 'mid_year'::text, 'final'::text, 'supplementary'::text, 'assignment_deadline'::text]))); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.exams ADD CONSTRAINT exams_module_id_fkey FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.exams ADD CONSTRAINT exams_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

-- ===== expenses =====
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  category text NOT NULL,
  description text,
  amount numeric NOT NULL,
  expense_date date DEFAULT CURRENT_DATE NOT NULL,
  month_year text,
  receipt_url text,
  created_at timestamptz DEFAULT now() NOT NULL
);
DO $$ BEGIN ALTER TABLE public.expenses ADD CONSTRAINT expenses_amount_check CHECK ((amount > (0)::numeric)); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.expenses ADD CONSTRAINT expenses_category_check CHECK ((category = ANY (ARRAY['food'::text, 'transport'::text, 'accommodation'::text, 'books'::text, 'data'::text, 'clothing'::text, 'entertainment'::text, 'health'::text, 'toiletries'::text, 'stationery'::text, 'laundry'::text, 'airtime'::text, 'savings'::text, 'other'::text, 'Food'::text, 'Transport'::text, 'Accommodation'::text, 'Books'::text, 'Data'::text, 'Clothing'::text, 'Entertainment'::text, 'Health'::text, 'Other'::text]))); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.expenses ADD CONSTRAINT expenses_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- ===== modules =====
CREATE TABLE IF NOT EXISTS public.modules (
  id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  module_code text NOT NULL,
  module_name text NOT NULL,
  credits int4 DEFAULT 0 NOT NULL,
  lecturer_name text,
  venue text,
  color text DEFAULT '#2D4A22'::text NOT NULL,
  semester int4,
  is_active bool DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
DO $$ BEGIN ALTER TABLE public.modules ADD CONSTRAINT modules_semester_check CHECK ((semester = ANY (ARRAY[1, 2]))); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.modules ADD CONSTRAINT modules_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- ===== timetable_slots =====
CREATE TABLE IF NOT EXISTS public.timetable_slots (
  id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  module_id uuid,
  day_of_week int4 NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  venue text,
  slot_type text DEFAULT 'lecture'::text NOT NULL,
  is_recurring bool DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  day_of_week_text text,
  label text
);
DO $$ BEGIN ALTER TABLE public.timetable_slots ADD CONSTRAINT timetable_slots_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6))); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.timetable_slots ADD CONSTRAINT timetable_slots_slot_type_check CHECK ((slot_type = ANY (ARRAY['lecture'::text, 'tutorial'::text, 'practical'::text, 'study'::text, 'work_shift'::text]))); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.timetable_slots ADD CONSTRAINT timetable_slots_module_id_fkey FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.timetable_slots ADD CONSTRAINT timetable_slots_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
ALTER TABLE public.timetable_slots ENABLE ROW LEVEL SECURITY;

-- ===== work_shifts =====
CREATE TABLE IF NOT EXISTS public.work_shifts (
  id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
  user_id uuid,
  employer_name text,
  shift_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  hourly_rate numeric,
  total_earned numeric,
  notes text,
  conflicts_with_class bool DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  student_id uuid,
  job_id uuid,
  status text DEFAULT 'scheduled'::text NOT NULL,
  earnings numeric,
  duration_hours numeric,
  has_study_conflict bool DEFAULT false NOT NULL,
  conflict_type text,
  conflict_detail text
);
DO $$ BEGIN ALTER TABLE public.work_shifts ADD CONSTRAINT work_shifts_status_check CHECK ((status = ANY (ARRAY['scheduled'::text, 'worked'::text, 'missed'::text, 'swapped'::text, 'declined'::text]))); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.work_shifts ADD CONSTRAINT work_shifts_job_id_fkey FOREIGN KEY (job_id) REFERENCES part_time_jobs(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.work_shifts ADD CONSTRAINT work_shifts_student_id_fkey FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.work_shifts ADD CONSTRAINT work_shifts_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
ALTER TABLE public.work_shifts ENABLE ROW LEVEL SECURITY;

-- ===== part_time_jobs =====
CREATE TABLE IF NOT EXISTS public.part_time_jobs (
  id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
  student_id uuid NOT NULL,
  employer_name text NOT NULL,
  job_title text,
  job_type text DEFAULT 'part_time'::text NOT NULL,
  pay_rate numeric,
  pay_type text DEFAULT 'hourly'::text NOT NULL,
  hours_per_week numeric,
  start_date date,
  end_date date,
  notes text,
  is_active bool DEFAULT true NOT NULL,
  contact_name text,
  contact_email text,
  contact_phone text,
  location text,
  created_at timestamptz DEFAULT now() NOT NULL,
  role_title text,
  is_on_campus bool DEFAULT false NOT NULL,
  is_remote bool DEFAULT false NOT NULL,
  contracted_hours_per_week int4,
  max_comfortable_hours int4 DEFAULT 20 NOT NULL,
  status text DEFAULT 'active'::text NOT NULL,
  block_exam_periods bool DEFAULT true NOT NULL,
  sync_with_study_planner bool DEFAULT true NOT NULL
);
DO $$ BEGIN ALTER TABLE public.part_time_jobs ADD CONSTRAINT part_time_jobs_job_type_check CHECK ((job_type = ANY (ARRAY['retail'::text, 'food_service'::text, 'tutoring'::text, 'call_centre'::text, 'campus_job'::text, 'freelance'::text, 'gig'::text, 'other'::text]))); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.part_time_jobs ADD CONSTRAINT part_time_jobs_pay_type_check CHECK ((pay_type = ANY (ARRAY['hourly'::text, 'shift'::text, 'monthly'::text]))); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.part_time_jobs ADD CONSTRAINT part_time_jobs_status_check CHECK ((status = ANY (ARRAY['active'::text, 'seasonal'::text, 'ended'::text]))); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.part_time_jobs ADD CONSTRAINT part_time_jobs_student_id_fkey FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
ALTER TABLE public.part_time_jobs ENABLE ROW LEVEL SECURITY;

-- ===== attendance_records (ensure union of live columns) =====
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS module_id uuid;
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS date date;
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS status text DEFAULT 'present'::text;

-- ===== campus_events (ensure union of live columns) =====
ALTER TABLE public.campus_events ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
ALTER TABLE public.campus_events ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.campus_events ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.campus_events ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.campus_events ADD COLUMN IF NOT EXISTS venue text;
ALTER TABLE public.campus_events ADD COLUMN IF NOT EXISTS event_date date;
ALTER TABLE public.campus_events ADD COLUMN IF NOT EXISTS event_time text;
ALTER TABLE public.campus_events ADD COLUMN IF NOT EXISTS category text DEFAULT 'general'::text;
ALTER TABLE public.campus_events ADD COLUMN IF NOT EXISTS institution text;
ALTER TABLE public.campus_events ADD COLUMN IF NOT EXISTS rsvp_count int4 DEFAULT 0;
ALTER TABLE public.campus_events ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- ===== event_rsvps (ensure union of live columns) =====
ALTER TABLE public.event_rsvps ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.event_rsvps ADD COLUMN IF NOT EXISTS event_id uuid;
ALTER TABLE public.event_rsvps ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- ===== nsfas_disbursements (ensure union of live columns) =====
ALTER TABLE public.nsfas_disbursements ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
ALTER TABLE public.nsfas_disbursements ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.nsfas_disbursements ADD COLUMN IF NOT EXISTS period text;
ALTER TABLE public.nsfas_disbursements ADD COLUMN IF NOT EXISTS period_label text;
ALTER TABLE public.nsfas_disbursements ADD COLUMN IF NOT EXISTS type nsfas_disbursement_type;
ALTER TABLE public.nsfas_disbursements ADD COLUMN IF NOT EXISTS expected_amount numeric DEFAULT 0;
ALTER TABLE public.nsfas_disbursements ADD COLUMN IF NOT EXISTS actual_amount numeric;
ALTER TABLE public.nsfas_disbursements ADD COLUMN IF NOT EXISTS expected_date date;
ALTER TABLE public.nsfas_disbursements ADD COLUMN IF NOT EXISTS actual_date date;
ALTER TABLE public.nsfas_disbursements ADD COLUMN IF NOT EXISTS status nsfas_disbursement_status DEFAULT 'expected'::nsfas_disbursement_status;
ALTER TABLE public.nsfas_disbursements ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.nsfas_disbursements ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.nsfas_disbursements ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ── RLS policies for base tables (introspected from live) ──

-- policies: exams
DO $$ BEGIN CREATE POLICY "own_rows" ON public.exams FOR ALL USING ((auth.uid() = user_id)); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- policies: expenses
DO $$ BEGIN CREATE POLICY "own_rows" ON public.expenses FOR ALL USING ((auth.uid() = user_id)); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- policies: modules
DO $$ BEGIN CREATE POLICY "own_rows" ON public.modules FOR ALL USING ((auth.uid() = user_id)); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- policies: timetable_slots
DO $$ BEGIN CREATE POLICY "own_rows" ON public.timetable_slots FOR ALL USING ((auth.uid() = user_id)); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- policies: work_shifts
DO $$ BEGIN CREATE POLICY "own_rows" ON public.work_shifts FOR ALL USING (((auth.uid() = user_id) OR (auth.uid() = student_id))); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "own_shifts" ON public.work_shifts FOR ALL USING ((auth.uid() = student_id)); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- policies: part_time_jobs
DO $$ BEGIN CREATE POLICY "own_rows" ON public.part_time_jobs FOR ALL USING ((auth.uid() = student_id)); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
