-- ============================================================
-- Migration 000030: Link income_entries to nsfas_disbursements
-- Enables auto-sync: marking NSFAS payment received → income entry
-- ============================================================

alter table public.income_entries
  add column if not exists nsfas_disbursement_id uuid
    references public.nsfas_disbursements(id) on delete set null;

-- Unique index so upsert on conflict works (one income entry per disbursement)
create unique index if not exists income_entries_nsfas_disbursement_idx
  on public.income_entries(nsfas_disbursement_id)
  where nsfas_disbursement_id is not null;
