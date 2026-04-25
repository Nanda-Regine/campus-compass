-- Rebuild meal_plans from old JSONB structure to per-slot rows
-- Old: (user_id, week_start_date DATE, plan_data JSONB) — one row per week
-- New: (user_id, week_start DATE, day_of_week TEXT, meal_slot TEXT, meal_name TEXT) — one row per slot

DROP TABLE IF EXISTS public.meal_plans CASCADE;

CREATE TABLE public.meal_plans (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start  DATE NOT NULL DEFAULT CURRENT_DATE,
  day_of_week TEXT NOT NULL,
  meal_slot   TEXT NOT NULL,
  meal_name   TEXT NOT NULL,
  cost        NUMERIC(6,2),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT meal_plans_user_week_slot_unique UNIQUE (user_id, week_start, day_of_week, meal_slot)
);

CREATE INDEX IF NOT EXISTS idx_meal_plans_user_id ON public.meal_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_week ON public.meal_plans(user_id, week_start);

ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own meal plans" ON public.meal_plans
  FOR ALL USING (auth.uid() = user_id);
