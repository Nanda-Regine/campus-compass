-- Add unique constraint so upsert on meal_plans works correctly per slot
ALTER TABLE public.meal_plans
  ADD CONSTRAINT meal_plans_user_week_slot_unique
  UNIQUE (user_id, week_start, day_of_week, meal_slot);
