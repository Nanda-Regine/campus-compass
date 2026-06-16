// ============================================================
// VarsityOS — NSFAS Tracker DB layer
// Typed query functions for nsfas_disbursements, nsfas_appeals,
// nsfas_documents tables.
// ============================================================

import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────

export type DisbursementType   = 'living' | 'accommodation' | 'books' | 'transport' | 'meal' | 'other'
export type DisbursementStatus = 'expected' | 'received' | 'late' | 'partial' | 'missed' | 'pending'
export type AppealType         = 'late_payment' | 'underpayment' | 'suspension' | 'n_plus_rule' | 'academic_progress' | 'other'
export type AppealStatus       = 'drafting' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'escalated' | 'closed'
export type DocumentType       = 'id_document' | 'proof_of_registration' | 'academic_results' | 'banking_details' | 'parental_income' | 'guardian_income' | 'disability_proof' | 'consent_form' | 'appeal_letter' | 'academic_exclusion_letter' | 'other'
export type DocumentStatus     = 'required' | 'in_progress' | 'uploaded' | 'submitted' | 'verified' | 'rejected'

export interface NsfasDisbursement {
  id:              string
  user_id:         string
  period:          string     // YYYY-MM
  period_label:    string     // "February 2026"
  type:            DisbursementType
  expected_amount: number
  actual_amount:   number | null
  expected_date:   string | null
  actual_date:     string | null
  status:          DisbursementStatus
  notes:           string | null
  created_at:      string
  updated_at:      string
}

export interface NsfasAppeal {
  id:               string
  user_id:          string
  appeal_type:      AppealType
  title:            string
  description:      string | null
  reference_number: string | null
  status:           AppealStatus
  submitted_at:     string | null
  resolved_at:      string | null
  outcome:          string | null
  notes:            string | null
  created_at:       string
  updated_at:       string
}

export interface NsfasDocument {
  id:          string
  user_id:     string
  doc_type:    DocumentType
  label:       string
  status:      DocumentStatus
  due_date:    string | null
  uploaded_at: string | null
  notes:       string | null
  created_at:  string
  updated_at:  string
}

// ─── Disbursements ────────────────────────────────────────────

export async function getDisbursements(userId: string): Promise<NsfasDisbursement[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('nsfas_disbursements')
    .select('*')
    .eq('user_id', userId)
    .order('period', { ascending: false })
  return (data ?? []) as NsfasDisbursement[]
}

export async function upsertDisbursement(
  userId: string,
  values: Omit<NsfasDisbursement, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<NsfasDisbursement | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('nsfas_disbursements')
    .upsert({ ...values, user_id: userId }, { onConflict: 'user_id,period,type' })
    .select()
    .single()
  return data as NsfasDisbursement | null
}

export async function updateDisbursementStatus(
  id: string,
  status: DisbursementStatus,
  actualAmount?: number,
  actualDate?: string
): Promise<void> {
  const supabase = createClient()
  await supabase
    .from('nsfas_disbursements')
    .update({ status, actual_amount: actualAmount ?? null, actual_date: actualDate ?? null })
    .eq('id', id)
}

// ─── Appeals ──────────────────────────────────────────────────

export async function getAppeals(userId: string): Promise<NsfasAppeal[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('nsfas_appeals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return (data ?? []) as NsfasAppeal[]
}

export async function createAppeal(
  userId: string,
  values: Pick<NsfasAppeal, 'appeal_type' | 'title' | 'description' | 'reference_number'>
): Promise<NsfasAppeal | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('nsfas_appeals')
    .insert({ ...values, user_id: userId, status: 'drafting' })
    .select()
    .single()
  return data as NsfasAppeal | null
}

export async function updateAppealStatus(
  id: string,
  status: AppealStatus,
  extra?: { reference_number?: string; outcome?: string; notes?: string }
): Promise<void> {
  const supabase = createClient()
  const updates: Partial<NsfasAppeal> = { status }
  if (status === 'submitted') updates.submitted_at = new Date().toISOString()
  if (status === 'approved' || status === 'rejected') updates.resolved_at = new Date().toISOString()
  if (extra?.reference_number) updates.reference_number = extra.reference_number
  if (extra?.outcome)          updates.outcome          = extra.outcome
  if (extra?.notes)            updates.notes            = extra.notes
  await supabase.from('nsfas_appeals').update(updates).eq('id', id)
}

// ─── Documents ────────────────────────────────────────────────

export const REQUIRED_DOCUMENTS: Array<{ doc_type: DocumentType; label: string }> = [
  { doc_type: 'id_document',          label: 'ID Document / Smart Card' },
  { doc_type: 'proof_of_registration',label: 'Proof of Registration' },
  { doc_type: 'academic_results',     label: 'Previous Academic Results' },
  { doc_type: 'banking_details',      label: 'Proof of Banking Details' },
  { doc_type: 'parental_income',      label: 'Parental/Guardian Income Proof' },
  { doc_type: 'consent_form',         label: 'NSFAS Consent Form' },
]

export async function getDocuments(userId: string): Promise<NsfasDocument[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('nsfas_documents')
    .select('*')
    .eq('user_id', userId)
  return (data ?? []) as NsfasDocument[]
}

export async function upsertDocument(
  userId: string,
  docType: DocumentType,
  label: string,
  status: DocumentStatus,
  notes?: string
): Promise<void> {
  const supabase = createClient()
  await supabase.from('nsfas_documents').upsert({
    user_id: userId,
    doc_type: docType,
    label,
    status,
    notes: notes ?? null,
    uploaded_at: status === 'uploaded' || status === 'submitted' ? new Date().toISOString() : null,
  }, { onConflict: 'user_id,doc_type' })
}

// ─── Shortfall calculator ─────────────────────────────────────

export function calcShortfall(disbursements: NsfasDisbursement[]): {
  totalExpected:  number
  totalReceived:  number
  totalShortfall: number
  lateCount:      number
  missedCount:    number
  partialCount:   number
} {
  let totalExpected = 0, totalReceived = 0
  let lateCount = 0, missedCount = 0, partialCount = 0

  for (const d of disbursements) {
    totalExpected += d.expected_amount
    totalReceived += d.actual_amount ?? 0
    if (d.status === 'late')    lateCount++
    if (d.status === 'missed')  missedCount++
    if (d.status === 'partial') partialCount++
  }

  return {
    totalExpected,
    totalReceived,
    totalShortfall: totalExpected - totalReceived,
    lateCount,
    missedCount,
    partialCount,
  }
}

// ─── Pre-populate expected disbursements for a new year ───────
// Call when user first enables NSFAS tracker to seed expected rows.

export async function seedExpectedDisbursements(
  userId: string,
  nsfasLiving: number,
  nsfasAccom: number,
  nsfasBooks: number,
  year = new Date().getFullYear()
): Promise<void> {
  const supabase = createClient()
  const rows: object[] = []
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

  // Academic year: Feb(m=2)–Nov(m=11) — 10 months
  for (let m = 2; m <= 11; m++) {
    const period = `${year}-${String(m).padStart(2, '0')}`
    const periodLabel = `${MONTHS[m - 1]} ${year}`
    const expectedDate = `${year}-${String(m).padStart(2, '0')}-05`

    if (nsfasLiving > 0) rows.push({
      user_id: userId, period, period_label: periodLabel,
      type: 'living', expected_amount: nsfasLiving,
      expected_date: expectedDate, status: 'expected',
    })
    if (nsfasAccom > 0) rows.push({
      user_id: userId, period, period_label: periodLabel,
      type: 'accommodation', expected_amount: nsfasAccom,
      expected_date: expectedDate, status: 'expected',
    })
  }

  // Books: once per semester (Feb + Jul)
  if (nsfasBooks > 0) {
    const bookSemesters = [
      { period: `${year}-02`, label: `February ${year}`, date: `${year}-02-05` },
      { period: `${year}-07`, label: `July ${year}`, date: `${year}-07-05` },
    ]
    for (const s of bookSemesters) {
      rows.push({
        user_id: userId, period: s.period, period_label: s.label,
        type: 'books', expected_amount: nsfasBooks / 2,
        expected_date: s.date, status: 'expected',
      })
    }
  }

  if (rows.length > 0) {
    await supabase.from('nsfas_disbursements')
      .upsert(rows, { onConflict: 'user_id,period,type', ignoreDuplicates: true })
  }
}
