-- ============================================================
-- Campus Compass — AI Features Migration
-- Run this in Supabase SQL Editor:
--   Dashboard → SQL Editor → paste → Run
-- Safe to run multiple times (uses IF NOT EXISTS / OR REPLACE)
-- ============================================================

-- nova_messages: stores Nova chat history per user
CREATE TABLE IF NOT EXISTS public.nova_messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.nova_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own nova messages" ON public.nova_messages FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_nova_messages_user_id ON public.nova_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_nova_messages_created ON public.nova_messages(created_at);

-- payment_logs: raw PayFast ITN log for reconciliation
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
CREATE POLICY "Own payment logs"          ON public.payment_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role payment logs" ON public.payment_logs FOR ALL USING (auth.role() = 'service_role');

CREATE TABLE IF NOT EXISTS public.nova_insights (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL,
  content      TEXT NOT NULL,
  dismissed    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.study_sessions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id          UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  module_id        UUID REFERENCES public.modules(id) ON DELETE SET NULL,
  duration_minutes INTEGER,
  notes            TEXT,
  started_at       TIMESTAMPTZ DEFAULT NOW(),
  ended_at         TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.nova_usage (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month_year    TEXT NOT NULL,
  message_count INTEGER NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, month_year)
);

ALTER TABLE public.nova_insights  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nova_usage     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own nova insights"    ON public.nova_insights  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own study sessions"   ON public.study_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own nova usage"       ON public.nova_usage     FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role insights" ON public.nova_insights FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_nova_insights_user_id   ON public.nova_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_nova_insights_dismissed  ON public.nova_insights(dismissed);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id  ON public.study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_nova_usage_user_month   ON public.nova_usage(user_id, month_year);

CREATE OR REPLACE FUNCTION public.increment_nova_usage(p_user_id UUID, p_month_year TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.nova_usage (user_id, month_year, message_count)
  VALUES (p_user_id, p_month_year, 1)
  ON CONFLICT (user_id, month_year)
  DO UPDATE SET
    message_count = nova_usage.message_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.increment_nova_usage TO authenticated;
