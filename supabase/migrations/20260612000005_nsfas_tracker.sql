-- ============================================================
-- VarsityOS Migration 005 — NSFAS Tracker OS
-- Tables: nsfas_disbursements, nsfas_appeals, nsfas_documents
-- Run in VarsityOS Supabase SQL editor (NOT via MCP)
-- ============================================================

-- ─── Disbursement records ─────────────────────────────────────
-- One row per monthly payment type per user

create type nsfas_disbursement_type as enum (
  'living', 'accommodation', 'books', 'transport', 'meal', 'other'
);

create type nsfas_disbursement_status as enum (
  'expected', 'received', 'late', 'partial', 'missed', 'pending'
);

create table if not exists nsfas_disbursements (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles(id) on delete cascade,
  period           text not null,           -- e.g. "2026-02" (YYYY-MM)
  period_label     text not null,           -- e.g. "February 2026"
  type             nsfas_disbursement_type not null,
  expected_amount  numeric(10,2) not null default 0,
  actual_amount    numeric(10,2),
  expected_date    date,
  actual_date      date,
  status           nsfas_disbursement_status not null default 'expected',
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique(user_id, period, type)
);

create index nsfas_dis_user_idx    on nsfas_disbursements(user_id);
create index nsfas_dis_period_idx  on nsfas_disbursements(user_id, period desc);
create index nsfas_dis_status_idx  on nsfas_disbursements(user_id, status);

alter table nsfas_disbursements enable row level security;
create policy "nsfas_disbursements: own rows"
  on nsfas_disbursements for all using (auth.uid() = user_id);

create or replace function set_nsfas_disbursement_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger nsfas_disbursement_updated_at
  before update on nsfas_disbursements
  for each row execute function set_nsfas_disbursement_updated_at();

-- ─── Appeal log ───────────────────────────────────────────────

create type nsfas_appeal_type as enum (
  'late_payment', 'underpayment', 'suspension',
  'n_plus_rule', 'academic_progress', 'other'
);

create type nsfas_appeal_status as enum (
  'drafting', 'submitted', 'under_review',
  'approved', 'rejected', 'escalated', 'closed'
);

create table if not exists nsfas_appeals (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles(id) on delete cascade,
  appeal_type      nsfas_appeal_type not null,
  title            text not null,
  description      text,
  reference_number text,
  status           nsfas_appeal_status not null default 'drafting',
  submitted_at     timestamptz,
  resolved_at      timestamptz,
  outcome          text,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index nsfas_appeals_user_idx on nsfas_appeals(user_id, created_at desc);

alter table nsfas_appeals enable row level security;
create policy "nsfas_appeals: own rows"
  on nsfas_appeals for all using (auth.uid() = user_id);

create or replace function set_nsfas_appeal_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger nsfas_appeal_updated_at
  before update on nsfas_appeals
  for each row execute function set_nsfas_appeal_updated_at();

-- ─── Document checklist ───────────────────────────────────────

create type nsfas_document_type as enum (
  'id_document', 'proof_of_registration', 'academic_results',
  'banking_details', 'parental_income', 'guardian_income',
  'disability_proof', 'consent_form', 'appeal_letter',
  'academic_exclusion_letter', 'other'
);

create type nsfas_document_status as enum (
  'required', 'in_progress', 'uploaded', 'submitted', 'verified', 'rejected'
);

create table if not exists nsfas_documents (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  doc_type      nsfas_document_type not null,
  label         text not null,
  status        nsfas_document_status not null default 'required',
  due_date      date,
  uploaded_at   timestamptz,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique(user_id, doc_type)
);

create index nsfas_docs_user_idx on nsfas_documents(user_id);

alter table nsfas_documents enable row level security;
create policy "nsfas_documents: own rows"
  on nsfas_documents for all using (auth.uid() = user_id);

-- ─── Summary view ─────────────────────────────────────────────
-- Aggregates per user: total expected vs received, shortfall

create or replace view nsfas_summary as
select
  user_id,
  sum(expected_amount)                                  as total_expected,
  sum(coalesce(actual_amount, 0))                       as total_received,
  sum(expected_amount) - sum(coalesce(actual_amount,0)) as total_shortfall,
  count(*) filter (where status = 'received')           as paid_count,
  count(*) filter (where status = 'late')               as late_count,
  count(*) filter (where status = 'missed')             as missed_count,
  count(*) filter (where status = 'partial')            as partial_count
from nsfas_disbursements
group by user_id;
