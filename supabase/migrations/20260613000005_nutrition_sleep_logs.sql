-- Nutrition logs: daily food diary with macro tracking
CREATE TABLE IF NOT EXISTS nutrition_logs (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid REFERENCES auth.users NOT NULL,
  logged_date   date NOT NULL DEFAULT CURRENT_DATE,
  meal_slot     text NOT NULL CHECK (meal_slot IN ('breakfast','lunch','supper','snack')),
  food_name     text NOT NULL,
  calories      int  NOT NULL DEFAULT 0,
  protein_g     numeric(6,1) DEFAULT 0,
  carbs_g       numeric(6,1) DEFAULT 0,
  fat_g         numeric(6,1) DEFAULT 0,
  quantity_g    int  DEFAULT 100,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nutrition_logs_own" ON nutrition_logs
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_nutrition_logs_user_date ON nutrition_logs (user_id, logged_date);

-- Sleep logs: nightly sleep diary
CREATE TABLE IF NOT EXISTS sleep_logs (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users NOT NULL,
  sleep_date  date NOT NULL,
  bedtime     time NOT NULL,
  wake_time   time NOT NULL,
  quality     int  CHECK (quality BETWEEN 1 AND 5),
  notes       text,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, sleep_date)
);

ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sleep_logs_own" ON sleep_logs
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_sleep_logs_user_date ON sleep_logs (user_id, sleep_date);
