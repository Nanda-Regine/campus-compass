-- Fix 1: Drop stale duplicate RLS policies left over from 20260101000000_group_schema.sql
-- (20260413000000 added new policies without dropping the originals)

-- group_assignments: original policies were not named to match the drop list
DROP POLICY IF EXISTS "View group assignments"        ON public.group_assignments;
DROP POLICY IF EXISTS "Create group assignment"       ON public.group_assignments;
DROP POLICY IF EXISTS "Update own group assignment"   ON public.group_assignments;
DROP POLICY IF EXISTS "Delete own group assignment"   ON public.group_assignments;

-- group_members: original policies were never dropped
DROP POLICY IF EXISTS "View group members"            ON public.group_members;
DROP POLICY IF EXISTS "Insert group member (leader only)" ON public.group_members;
DROP POLICY IF EXISTS "Update own membership"         ON public.group_members;

-- group_tasks: original granular policies — superseded by member_all
DROP POLICY IF EXISTS "View group tasks"              ON public.group_tasks;
DROP POLICY IF EXISTS "Create group task (member)"   ON public.group_tasks;
DROP POLICY IF EXISTS "Update own assigned task"      ON public.group_tasks;
DROP POLICY IF EXISTS "Delete task (creator or leader)" ON public.group_tasks;

-- group_invites: original policies superseded
DROP POLICY IF EXISTS "View own invites"              ON public.group_invites;
DROP POLICY IF EXISTS "Create invite"                 ON public.group_invites;
DROP POLICY IF EXISTS "Service role invites"          ON public.group_invites;

-- Fix 2: Ensure the definitive policies exist (idempotent)

-- group_assignments
DROP POLICY IF EXISTS "own_assignments"   ON public.group_assignments;
DROP POLICY IF EXISTS "create_assignment" ON public.group_assignments;
DROP POLICY IF EXISTS "update_assignment" ON public.group_assignments;
DROP POLICY IF EXISTS "delete_assignment" ON public.group_assignments;

CREATE POLICY "own_assignments" ON public.group_assignments FOR SELECT USING (
  created_by = auth.uid()
  OR id IN (SELECT assignment_id FROM public.group_members WHERE user_id = auth.uid())
);
CREATE POLICY "create_assignment" ON public.group_assignments FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "update_assignment" ON public.group_assignments FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "delete_assignment" ON public.group_assignments FOR DELETE USING (created_by = auth.uid());

-- group_members
DROP POLICY IF EXISTS "member_view"   ON public.group_members;
DROP POLICY IF EXISTS "member_write"  ON public.group_members;
DROP POLICY IF EXISTS "member_delete" ON public.group_members;

CREATE POLICY "member_view" ON public.group_members FOR SELECT USING (
  user_id = auth.uid()
  OR assignment_id IN (
    SELECT assignment_id FROM public.group_members gm2 WHERE gm2.user_id = auth.uid()
  )
  OR assignment_id IN (
    SELECT id FROM public.group_assignments WHERE created_by = auth.uid()
  )
);
-- Creator inserts themselves as leader; accept_group_invite (SECURITY DEFINER) inserts others
CREATE POLICY "member_write" ON public.group_members FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "member_delete" ON public.group_members FOR DELETE USING (user_id = auth.uid());

-- group_tasks
DROP POLICY IF EXISTS "member_all" ON public.group_tasks;

CREATE POLICY "member_all" ON public.group_tasks FOR ALL USING (
  assignment_id IN (
    SELECT assignment_id FROM public.group_members WHERE user_id = auth.uid()
  )
  OR assignment_id IN (
    SELECT id FROM public.group_assignments WHERE created_by = auth.uid()
  )
);

-- group_invites
DROP POLICY IF EXISTS "invite_read"   ON public.group_invites;
DROP POLICY IF EXISTS "invite_create" ON public.group_invites;
DROP POLICY IF EXISTS "invite_delete" ON public.group_invites;

CREATE POLICY "invite_read" ON public.group_invites FOR SELECT USING (
  created_by = auth.uid()
  OR assignment_id IN (SELECT id FROM public.group_assignments WHERE created_by = auth.uid())
);
CREATE POLICY "invite_create" ON public.group_invites FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "invite_delete" ON public.group_invites FOR DELETE USING (created_by = auth.uid());

-- Fix 3: Restore assignment_title in accept_group_invite return value
CREATE OR REPLACE FUNCTION public.accept_group_invite(
  p_token   TEXT,
  p_user_id UUID,
  p_email   TEXT,
  p_name    TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_invite     public.group_invites%ROWTYPE;
  v_assignment public.group_assignments%ROWTYPE;
  v_member     public.group_members%ROWTYPE;
BEGIN
  SELECT * INTO v_invite FROM public.group_invites
  WHERE token = p_token
    AND accepted_at IS NULL
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid or expired invite');
  END IF;

  SELECT * INTO v_assignment FROM public.group_assignments WHERE id = v_invite.assignment_id;

  -- Already a member?
  SELECT * INTO v_member FROM public.group_members
  WHERE assignment_id = v_invite.assignment_id AND user_id = p_user_id;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'ok', true,
      'assignment_id', v_invite.assignment_id,
      'assignment_title', v_assignment.title,
      'already_member', true
    );
  END IF;

  INSERT INTO public.group_members (assignment_id, user_id, email, display_name, role, status, joined_at)
  VALUES (v_invite.assignment_id, p_user_id, p_email, p_name, 'member', 'joined', NOW())
  ON CONFLICT (assignment_id, email) DO UPDATE
    SET user_id = p_user_id, status = 'joined', joined_at = NOW(), display_name = p_name;

  UPDATE public.group_invites SET accepted_at = NOW() WHERE id = v_invite.id;

  RETURN jsonb_build_object(
    'ok', true,
    'assignment_id', v_invite.assignment_id,
    'assignment_title', v_assignment.title
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_group_invite TO authenticated;
