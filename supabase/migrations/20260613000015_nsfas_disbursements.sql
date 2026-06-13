-- ================================================================
-- VarsityOS — NSFAS Disbursements tracker
-- Tracks expected vs received disbursements per student per period.
-- Inngest late-payment alert queries rows where status='expected'
-- and expected_date < today.
-- ================================================================

CREATE TABLE IF NOT EXISTS public.nsfas_disbursements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN ('living','accommodation','books','transport','other')),
  period_label    TEXT NOT NULL,           -- e.g. "June 2026"
  expected_date   DATE NOT NULL,
  expected_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  received_date   DATE,
  received_amount NUMERIC(10,2),
  status          TEXT NOT NULL DEFAULT 'expected'
    CHECK (status IN ('expected','received','cancelled','disputed')),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, type, period_label)
);

ALTER TABLE public.nsfas_disbursements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nsfas_disbursements_own" ON public.nsfas_disbursements
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_nsfas_disb_user_status
  ON public.nsfas_disbursements (user_id, status, expected_date);

CREATE INDEX IF NOT EXISTS idx_nsfas_disb_status_date
  ON public.nsfas_disbursements (status, expected_date)
  WHERE status = 'expected';

-- Trigger to keep updated_at current
CREATE OR REPLACE FUNCTION public.nsfas_disb_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS nsfas_disbursements_updated_at ON public.nsfas_disbursements;
CREATE TRIGGER nsfas_disbursements_updated_at
  BEFORE UPDATE ON public.nsfas_disbursements
  FOR EACH ROW EXECUTE FUNCTION public.nsfas_disb_set_updated_at();
