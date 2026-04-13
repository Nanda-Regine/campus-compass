-- ============================================================
-- MIGRATION: Upgrade tasks table to new schema
-- Run in Supabase SQL Editor
-- Safe to re-run (uses IF NOT EXISTS / IF EXISTS)
-- ============================================================

-- 1. Add new columns
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS description     TEXT,
  ADD COLUMN IF NOT EXISTS status          TEXT NOT NULL DEFAULT 'todo',
  ADD COLUMN IF NOT EXISTS is_group_task   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS group_id        UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC(4,1),
  ADD COLUMN IF NOT EXISTS recurrence_rule TEXT,
  ADD COLUMN IF NOT EXISTS recurrence_end_date DATE,
  ADD COLUMN IF NOT EXISTS completed_at    TIMESTAMPTZ;

-- 2. Migrate existing data: copy notes → description, done → status
UPDATE public.tasks
  SET description = notes
  WHERE description IS NULL AND notes IS NOT NULL;

UPDATE public.tasks
  SET status = CASE WHEN done = TRUE THEN 'done' ELSE 'todo' END
  WHERE status = 'todo' OR status IS NULL;

UPDATE public.tasks
  SET completed_at = done_at
  WHERE completed_at IS NULL AND done_at IS NOT NULL;

-- 3. Normalise task_type to lowercase (the old default was 'Assignment')
UPDATE public.tasks SET task_type = LOWER(task_type) WHERE task_type != LOWER(task_type);

-- 4. Add status check constraint (drop first if it already exists)
ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS tasks_status_check;

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_status_check
  CHECK (status IN ('todo','in_progress','done','overdue'));

-- 5. Add task_type check constraint matching the app's allowed values
ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS tasks_task_type_check;

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_task_type_check
  CHECK (task_type IN (
    'assignment','exam','test','project','presentation',
    'reading','tutorial','lab','group_project',
    'reminder','meeting','appointment','chore','errand','admin',
    'self_care','exercise','social','personal_goal',
    'work_shift','work_task','payment_due','budget_review','other'
  ));

-- 6. Keep notes column for backward compat (don't drop it)
-- 7. Ensure RLS is on
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 8. Ensure policy exists
DROP POLICY IF EXISTS "own_rows" ON public.tasks;
CREATE POLICY "own_rows" ON public.tasks FOR ALL USING (auth.uid() = user_id);

-- 9. Useful indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_status  ON public.tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date      ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_group_id      ON public.tasks(group_id);

SELECT 'tasks migration complete' AS result;
