-- =============================================
-- Campus Compass — Group Assignment Manager
-- Run this in your Supabase SQL editor
-- =============================================

-- ─────────────────────────────────────────────
-- GROUP ASSIGNMENTS
-- ─────────────────────────────────────────────
CREATE TABLE public.group_assignments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  subject      TEXT,
  description  TEXT,
  due_date     DATE,
  status       TEXT NOT NULL DEFAULT 'active', -- active | submitted | graded
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- GROUP MEMBERS
-- ─────────────────────────────────────────────
CREATE TABLE public.group_members (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES public.group_assignments(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  email         TEXT NOT NULL,
  display_name  TEXT,
  role          TEXT NOT NULL DEFAULT 'member', -- leader | member
  status        TEXT NOT NULL DEFAULT 'invited', -- invited | joined
  invited_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  joined_at     TIMESTAMPTZ,
  UNIQUE(assignment_id, email)
);

-- ─────────────────────────────────────────────
-- GROUP TASKS (sub-tasks within an assignment)
-- ─────────────────────────────────────────────
CREATE TABLE public.group_tasks (
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

-- ─────────────────────────────────────────────
-- GROUP INVITES (shareable invite tokens)
-- ─────────────────────────────────────────────
CREATE TABLE public.group_invites (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES public.group_assignments(id) ON DELETE CASCADE,
  email         TEXT, -- optional: specific email invite
  token         TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_by    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  accepted_at   TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────
CREATE INDEX idx_group_assignments_created_by ON public.group_assignments(created_by);
CREATE INDEX idx_group_members_assignment_id  ON public.group_members(assignment_id);
CREATE INDEX idx_group_members_user_id        ON public.group_members(user_id);
CREATE INDEX idx_group_members_email          ON public.group_members(email);
CREATE INDEX idx_group_tasks_assignment_id    ON public.group_tasks(assignment_id);
CREATE INDEX idx_group_tasks_assigned_to      ON public.group_tasks(assigned_to);
CREATE INDEX idx_group_invites_token          ON public.group_invites(token);
CREATE INDEX idx_group_invites_assignment_id  ON public.group_invites(assignment_id);

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────
ALTER TABLE public.group_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_tasks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invites     ENABLE ROW LEVEL SECURITY;

-- Group Assignments: see if you created it OR you are a member
CREATE POLICY "View group assignments" ON public.group_assignments
  FOR SELECT USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.assignment_id = id AND gm.user_id = auth.uid()
    )
  );
CREATE POLICY "Create group assignment"  ON public.group_assignments FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Update own group assignment" ON public.group_assignments FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Delete own group assignment" ON public.group_assignments FOR DELETE USING (auth.uid() = created_by);

-- Group Members: see members of assignments you belong to
CREATE POLICY "View group members" ON public.group_members
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.group_assignments ga
      WHERE ga.id = assignment_id AND ga.created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.group_members gm2
      WHERE gm2.assignment_id = assignment_id AND gm2.user_id = auth.uid()
    )
  );
CREATE POLICY "Insert group member (leader only)" ON public.group_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_assignments ga
      WHERE ga.id = assignment_id AND ga.created_by = auth.uid()
    )
  );
CREATE POLICY "Update own membership" ON public.group_members FOR UPDATE USING (auth.uid() = user_id);

-- Group Tasks: members of the assignment can see all tasks
CREATE POLICY "View group tasks" ON public.group_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.assignment_id = assignment_id AND gm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.group_assignments ga
      WHERE ga.id = assignment_id AND ga.created_by = auth.uid()
    )
  );
CREATE POLICY "Create group task (member)" ON public.group_tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.assignment_id = assignment_id AND gm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.group_assignments ga
      WHERE ga.id = assignment_id AND ga.created_by = auth.uid()
    )
  );
CREATE POLICY "Update own assigned task" ON public.group_tasks
  FOR UPDATE USING (
    auth.uid() = assigned_to
    OR auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM public.group_assignments ga
      WHERE ga.id = assignment_id AND ga.created_by = auth.uid()
    )
  );
CREATE POLICY "Delete task (creator or leader)" ON public.group_tasks
  FOR DELETE USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM public.group_assignments ga
      WHERE ga.id = assignment_id AND ga.created_by = auth.uid()
    )
  );

-- Group Invites: only creator can manage invites
CREATE POLICY "View own invites"   ON public.group_invites FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Create invite"      ON public.group_invites FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Service role invites" ON public.group_invites FOR ALL USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────
-- TRIGGERS
-- ─────────────────────────────────────────────
CREATE TRIGGER set_group_assignments_updated_at
  BEFORE UPDATE ON public.group_assignments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-mark group task done_at
CREATE OR REPLACE FUNCTION public.handle_group_task_done()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.done = TRUE AND (OLD.done = FALSE OR OLD.done IS NULL) THEN
    NEW.done_at = NOW();
  ELSIF NEW.done = FALSE THEN
    NEW.done_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_group_task_done_at
  BEFORE UPDATE ON public.group_tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_group_task_done();

-- ─────────────────────────────────────────────
-- ACCEPT INVITE FUNCTION (called from API)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.accept_group_invite(
  p_token TEXT,
  p_user_id UUID,
  p_email TEXT,
  p_name TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_invite public.group_invites%ROWTYPE;
  v_assignment public.group_assignments%ROWTYPE;
  v_result JSONB;
BEGIN
  -- Get and validate invite
  SELECT * INTO v_invite FROM public.group_invites
  WHERE token = p_token
    AND accepted_at IS NULL
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Invite not found or expired');
  END IF;

  -- Get assignment
  SELECT * INTO v_assignment FROM public.group_assignments WHERE id = v_invite.assignment_id;

  -- Add member if not already there
  INSERT INTO public.group_members (assignment_id, user_id, email, display_name, role, status, joined_at)
  VALUES (v_invite.assignment_id, p_user_id, p_email, p_name, 'member', 'joined', NOW())
  ON CONFLICT (assignment_id, email) DO UPDATE SET
    user_id    = p_user_id,
    status     = 'joined',
    joined_at  = NOW();

  -- Mark invite accepted
  UPDATE public.group_invites SET accepted_at = NOW() WHERE id = v_invite.id;

  RETURN jsonb_build_object(
    'success', true,
    'assignment_id', v_invite.assignment_id,
    'assignment_title', v_assignment.title
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.accept_group_invite TO authenticated;
