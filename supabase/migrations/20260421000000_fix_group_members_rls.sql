-- Fix: infinite recursion in group_members RLS policies
-- group_members SELECT policy referenced itself (gm2 self-join)
-- group_assignments SELECT policy referenced group_members → recursion

-- Step 1: Drop all existing policies on affected tables
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'group_members' AND schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON group_members', pol.policyname);
  END LOOP;
END $$;

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'group_assignments' AND schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON group_assignments', pol.policyname);
  END LOOP;
END $$;

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'group_tasks' AND schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON group_tasks', pol.policyname);
  END LOOP;
END $$;

-- Step 2: SECURITY DEFINER function to check membership — bypasses RLS, breaks recursion
CREATE OR REPLACE FUNCTION public.is_group_member(p_assignment_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE assignment_id = p_assignment_id
      AND user_id = auth.uid()
  );
$$;

-- Step 3: SECURITY DEFINER function to check ownership
CREATE OR REPLACE FUNCTION public.is_assignment_owner(p_assignment_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_assignments
    WHERE id = p_assignment_id
      AND created_by = auth.uid()
  );
$$;

-- Step 4: group_members policies — direct auth.uid() checks ONLY, no self-reference
CREATE POLICY "gm_select"
  ON group_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR is_assignment_owner(assignment_id)
  );

CREATE POLICY "gm_insert"
  ON group_members FOR INSERT
  WITH CHECK (is_assignment_owner(assignment_id));

CREATE POLICY "gm_update_own"
  ON group_members FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "gm_delete"
  ON group_members FOR DELETE
  USING (user_id = auth.uid() OR is_assignment_owner(assignment_id));

-- Step 5: group_assignments policies — use SECURITY DEFINER function
CREATE POLICY "ga_select"
  ON group_assignments FOR SELECT
  USING (created_by = auth.uid() OR is_group_member(id));

CREATE POLICY "ga_insert"
  ON group_assignments FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "ga_update"
  ON group_assignments FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "ga_delete"
  ON group_assignments FOR DELETE
  USING (created_by = auth.uid());

-- Step 6: group_tasks policies — use SECURITY DEFINER functions
CREATE POLICY "gt_select"
  ON group_tasks FOR SELECT
  USING (is_group_member(assignment_id) OR is_assignment_owner(assignment_id));

CREATE POLICY "gt_insert"
  ON group_tasks FOR INSERT
  WITH CHECK (is_group_member(assignment_id) OR is_assignment_owner(assignment_id));

CREATE POLICY "gt_update"
  ON group_tasks FOR UPDATE
  USING (
    assigned_to = auth.uid()
    OR created_by = auth.uid()
    OR is_assignment_owner(assignment_id)
  );

CREATE POLICY "gt_delete"
  ON group_tasks FOR DELETE
  USING (created_by = auth.uid() OR is_assignment_owner(assignment_id));

-- Confirm RLS enabled
ALTER TABLE group_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_tasks       ENABLE ROW LEVEL SECURITY;

-- Grant execute on new functions
GRANT EXECUTE ON FUNCTION public.is_group_member TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_assignment_owner TO authenticated;
