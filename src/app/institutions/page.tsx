'use client'

import { useState } from 'react'
import Link from 'next/link'

const PERKS = [
  { icon: '📊', title: 'Live student insights', body: 'Aggregate wellness, attendance, and study data across your campus — privacy-first, no PII.' },
  { icon: '💬', title: 'Nova AI for every student', body: 'SA-tuned AI companion covering NSFAS, exclusion risk, load-shedding, and mental health.' },
  { icon: '🎓', title: 'Graduation Optimizer', body: 'AI flags at-risk students before exclusion — gives your student affairs team time to intervene.' },
  { icon: '📣', title: 'Campus feed & events', body: 'Push announcements, events, and resources directly into students\' VarsityOS dashboard.' },
  { icon: '💳', title: 'Free for students', body: 'Scholar tier is free. Your institution can bulk-activate premium features for your students.' },
  { icon: '🇿🇦', title: 'Built for South Africa', body: 'NSFAS, N+ rule, load-shedding alerts, data-saver mode, and support for prepaid data budgets.' },
]

const SA_UNIS = [
  'University of the Witwatersrand',
  'University of Cape Town',
  'University of Pretoria',
  'Stellenbosch University',
  'University of KwaZulu-Natal',
  'Rhodes University',
  'Nelson Mandela University',
  'University of Johannesburg',
  'University of the Western Cape',
  'Walter Sisulu University',
  'Tshwane University of Technology',
  'Cape Peninsula University of Technology',
  'Durban University of Technology',
  'Vaal University of Technology',
  'Other / International',
]

export default function InstitutionsPage() {
  const [form, setForm] = useState({
    name: '',
    domain: '',
    contact_name: '',
    contact_email: '',
    city: '',
    student_count_est: '',
  })
  const [status, setStatus]   = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errMsg, setErrMsg]   = useState('')

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrMsg('')
    try {
      const res = await fetch('/api/institutions/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          student_count_est: form.student_count_est ? Number(form.student_count_est) : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setErrMsg(data.error || 'Submission failed'); setStatus('error'); return }
      setStatus('done')
    } catch {
      setErrMsg('Network error. Please try again.')
      setStatus('error')
    }
  }

  return (
    <main style={{
      minHeight: '100vh', background: 'var(--bg-base, #080f0e)',
      color: 'var(--text-primary, #e2e8f0)',
      fontFamily: 'var(--font-sans, system-ui)',
    }}>

      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(8,15,14,0.85)', backdropFilter: 'blur(12px)',
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#0d9488' }}>
            VarsityOS
          </span>
        </Link>
        <Link href="/auth/login" style={{
          padding: '8px 16px', borderRadius: 8,
          background: 'rgba(13,148,136,0.15)', border: '1px solid rgba(13,148,136,0.4)',
          color: '#0d9488', fontSize: 13, fontWeight: 600, textDecoration: 'none',
        }}>
          Student login
        </Link>
      </nav>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 20px 80px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', padding: '64px 0 48px' }}>
          <div style={{
            display: 'inline-block', padding: '5px 14px', borderRadius: 20,
            background: 'rgba(13,148,136,0.12)', border: '1px solid rgba(13,148,136,0.3)',
            fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em',
            textTransform: 'uppercase', color: '#0d9488', marginBottom: 20,
          }}>
            For universities & SRCs
          </div>
          <h1 style={{
            fontSize: 'clamp(28px, 6vw, 46px)', fontFamily: 'var(--font-display)',
            fontWeight: 800, lineHeight: 1.15, margin: '0 0 16px',
          }}>
            Give every student a{' '}
            <span style={{ color: '#0d9488' }}>personal OS</span>
            {' '}— free.
          </h1>
          <p style={{
            fontSize: 16, color: 'var(--text-secondary, #94a3b8)',
            lineHeight: 1.7, maxWidth: 560, margin: '0 auto 32px',
          }}>
            VarsityOS is the free student super-app built for South African universities.
            Partner with us to give your students AI-powered study tools, NSFAS tracking,
            wellness monitoring, and campus safety — on any phone, even on 3G.
          </p>
          <a href="#apply" style={{
            display: 'inline-block', padding: '14px 28px', borderRadius: 10,
            background: 'linear-gradient(135deg, #0d9488, #0f766e)',
            color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none',
          }}>
            Apply for institutional access
          </a>
        </div>

        {/* Perks grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 14, marginBottom: 64,
        }}>
          {PERKS.map(p => (
            <div key={p.title} style={{
              padding: '18px 16px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14,
            }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{p.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{p.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.6 }}>{p.body}</div>
            </div>
          ))}
        </div>

        {/* Application form */}
        <div id="apply" style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 18, overflow: 'hidden',
        }}>
          <div style={{ height: 3, background: 'linear-gradient(90deg, #0d9488, #38BDF8)' }} />

          <div style={{ padding: '28px 24px' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: 20, marginBottom: 6,
            }}>
              Institutional access application
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary, #94a3b8)', marginBottom: 24, lineHeight: 1.6 }}>
              Fill in the form below and we&apos;ll be in touch within 2 business days.
              No cost, no commitment — just student value.
            </p>

            {status === 'done' ? (
              <div style={{
                padding: '24px', borderRadius: 12, textAlign: 'center',
                background: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.3)',
              }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>✅</div>
                <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Application received!</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.6 }}>
                  We&apos;ll review your application and reach out to {form.contact_email} within 2 business days.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                <Field label="Institution name" required>
                  <select
                    value={form.name}
                    onChange={set('name')}
                    required
                    style={selectStyle}
                  >
                    <option value="">Select your institution…</option>
                    {SA_UNIS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </Field>

                <Field label="Institutional email domain" hint="e.g. wits.ac.za" required>
                  <input
                    type="text" value={form.domain} onChange={set('domain')}
                    placeholder="wits.ac.za"
                    required style={inputStyle}
                  />
                </Field>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Field label="Your name" required>
                    <input
                      type="text" value={form.contact_name} onChange={set('contact_name')}
                      placeholder="Sipho Mthembu" required style={inputStyle}
                    />
                  </Field>
                  <Field label="Your email" required>
                    <input
                      type="email" value={form.contact_email} onChange={set('contact_email')}
                      placeholder="you@wits.ac.za" required style={inputStyle}
                    />
                  </Field>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Field label="City">
                    <input
                      type="text" value={form.city} onChange={set('city')}
                      placeholder="Johannesburg" style={inputStyle}
                    />
                  </Field>
                  <Field label="Estimated students">
                    <input
                      type="number" value={form.student_count_est} onChange={set('student_count_est')}
                      placeholder="e.g. 40000" min={0} style={inputStyle}
                    />
                  </Field>
                </div>

                {errMsg && (
                  <p style={{ fontSize: 13, color: '#ef4444', margin: 0 }}>{errMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  style={{
                    padding: '13px 0', borderRadius: 10, marginTop: 4,
                    background: 'linear-gradient(135deg, #0d9488, #0f766e)',
                    color: '#fff', fontWeight: 700, fontSize: 14,
                    border: 'none', cursor: status === 'loading' ? 'wait' : 'pointer',
                    opacity: status === 'loading' ? 0.7 : 1,
                  }}
                >
                  {status === 'loading' ? 'Submitting…' : 'Submit application'}
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </main>
  )
}

function Field({ label, hint, required, children }: {
  label: string; hint?: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: 12, fontWeight: 600,
        color: 'var(--text-secondary, #94a3b8)', marginBottom: 6,
        letterSpacing: '0.04em',
      }}>
        {label}{required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
        {hint && <span style={{ fontWeight: 400, marginLeft: 4, color: 'var(--text-muted, #64748b)' }}>— {hint}</span>}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 9,
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  color: 'var(--text-primary, #e2e8f0)', fontSize: 14, outline: 'none',
  boxSizing: 'border-box',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394a3b8' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: 32,
}
