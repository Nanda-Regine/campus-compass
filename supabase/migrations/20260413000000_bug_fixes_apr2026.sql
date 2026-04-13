-- Fix part_time_jobs job_type constraint
ALTER TABLE public.part_time_jobs
  DROP CONSTRAINT IF EXISTS part_time_jobs_job_type_check;
ALTER TABLE public.part_time_jobs
  ADD CONSTRAINT part_time_jobs_job_type_check
  CHECK (job_type IN ('retail','food_service','tutoring','call_centre','campus_job','freelance','gig','other'));

-- Add missing columns to part_time_jobs
ALTER TABLE public.part_time_jobs
  ADD COLUMN IF NOT EXISTS role_title TEXT,
  ADD COLUMN IF NOT EXISTS is_on_campus BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_remote BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS contracted_hours_per_week INTEGER,
  ADD COLUMN IF NOT EXISTS max_comfortable_hours INTEGER NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','seasonal','ended')),
  ADD COLUMN IF NOT EXISTS block_exam_periods BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sync_with_study_planner BOOLEAN NOT NULL DEFAULT true;

-- Fix work_shifts status constraint
ALTER TABLE public.work_shifts
  DROP CONSTRAINT IF EXISTS work_shifts_status_check;
ALTER TABLE public.work_shifts
  ADD CONSTRAINT work_shifts_status_check
  CHECK (status IN ('scheduled','worked','missed','swapped','declined'));

-- Fix group_tasks RLS
DROP POLICY IF EXISTS "member_all" ON public.group_tasks;
CREATE POLICY "member_all" ON public.group_tasks FOR ALL USING (
  assignment_id IN (
    SELECT assignment_id FROM public.group_members WHERE user_id = auth.uid()
  )
  OR group_id IN (
    SELECT group_id FROM public.group_members
    WHERE user_id = auth.uid() AND group_id IS NOT NULL
  )
);

-- Fix group_members visibility
DROP POLICY IF EXISTS "member_view" ON public.group_members;
DROP POLICY IF EXISTS "own_row" ON public.group_members;
CREATE POLICY "member_view" ON public.group_members FOR SELECT USING (
  user_id = auth.uid()
  OR assignment_id IN (
    SELECT assignment_id FROM public.group_members gm2
    WHERE gm2.user_id = auth.uid()
  )
);
CREATE POLICY "member_write" ON public.group_members FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "member_delete" ON public.group_members FOR DELETE
  USING (user_id = auth.uid());

-- ─── Streak fix: ensure completed_at is indexed ──────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at
  ON public.tasks(user_id, status, completed_at DESC)
  WHERE status = 'done';

-- ─── Group tables: ensure they exist (idempotent) ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.group_assignments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  subject      TEXT,
  description  TEXT,
  due_date     DATE,
  status       TEXT NOT NULL DEFAULT 'active',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.group_members (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES public.group_assignments(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  email         TEXT NOT NULL,
  display_name  TEXT,
  role          TEXT NOT NULL DEFAULT 'member',
  status        TEXT NOT NULL DEFAULT 'invited',
  invited_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  joined_at     TIMESTAMPTZ,
  UNIQUE(assignment_id, email)
);

CREATE TABLE IF NOT EXISTS public.group_tasks (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id       UUID NOT NULL REFERENCES public.group_assignments(id) ON DELETE CASCADE,
  created_by          UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_to         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_to_email   TEXT,
  title               TEXT NOT NULL,
  notes               TEXT,
  done                BOOLEAN NOT NULL DEFAULT FALSE,
  done_at             TIMESTAMPTZ,
  due_date            DATE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.group_invites (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES public.group_assignments(id) ON DELETE CASCADE,
  email         TEXT,
  created_by    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token         TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS on group tables
ALTER TABLE public.group_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_tasks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invites     ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_assignments"     ON public.group_assignments;
DROP POLICY IF EXISTS "create_assignment"   ON public.group_assignments;
DROP POLICY IF EXISTS "update_assignment"   ON public.group_assignments;
DROP POLICY IF EXISTS "delete_assignment"   ON public.group_assignments;

CREATE POLICY "own_assignments" ON public.group_assignments FOR SELECT USING (
  created_by = auth.uid()
  OR id IN (SELECT assignment_id FROM public.group_members WHERE user_id = auth.uid())
);
CREATE POLICY "create_assignment" ON public.group_assignments FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "update_assignment" ON public.group_assignments FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "delete_assignment" ON public.group_assignments FOR DELETE USING (created_by = auth.uid());

DROP POLICY IF EXISTS "invite_read" ON public.group_invites;
DROP POLICY IF EXISTS "invite_create" ON public.group_invites;
DROP POLICY IF EXISTS "invite_delete" ON public.group_invites;

CREATE POLICY "invite_read" ON public.group_invites FOR SELECT USING (
  created_by = auth.uid()
  OR assignment_id IN (SELECT id FROM public.group_assignments WHERE created_by = auth.uid())
);
CREATE POLICY "invite_create" ON public.group_invites FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "invite_delete" ON public.group_invites FOR DELETE USING (created_by = auth.uid());

-- accept_group_invite RPC (idempotent)
CREATE OR REPLACE FUNCTION public.accept_group_invite(
  p_token   TEXT,
  p_user_id UUID,
  p_email   TEXT,
  p_name    TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_invite  public.group_invites%ROWTYPE;
  v_member  public.group_members%ROWTYPE;
BEGIN
  SELECT * INTO v_invite FROM public.group_invites
  WHERE token = p_token
    AND accepted_at IS NULL
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid or expired invite');
  END IF;

  -- Check if already a member
  SELECT * INTO v_member FROM public.group_members
  WHERE assignment_id = v_invite.assignment_id AND user_id = p_user_id;

  IF FOUND THEN
    RETURN jsonb_build_object('ok', true, 'assignment_id', v_invite.assignment_id, 'already_member', true);
  END IF;

  -- Insert or update member row
  INSERT INTO public.group_members (assignment_id, user_id, email, display_name, role, status, joined_at)
  VALUES (v_invite.assignment_id, p_user_id, p_email, p_name, 'member', 'joined', NOW())
  ON CONFLICT (assignment_id, email) DO UPDATE
    SET user_id = p_user_id, status = 'joined', joined_at = NOW(), display_name = p_name;

  -- Mark invite accepted
  UPDATE public.group_invites SET accepted_at = NOW() WHERE id = v_invite.id;

  RETURN jsonb_build_object('ok', true, 'assignment_id', v_invite.assignment_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_group_invite TO authenticated;

-- payment_logs table (if not exists)
CREATE TABLE IF NOT EXISTS public.payment_logs (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  payfast_payment_id  TEXT,
  amount              NUMERIC(10,2),
  status              TEXT,
  item_name           TEXT,
  raw_data            JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_payment_logs_user ON public.payment_logs(user_id, created_at DESC);
