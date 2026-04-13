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
