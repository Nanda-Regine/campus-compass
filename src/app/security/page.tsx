import type { Metadata } from 'next'
import Link from 'next/link'
import { AmbientImage } from '@/components/ui/AmbientImage'

export const metadata: Metadata = {
  title: 'Security',
  description: 'VarsityOS Security Trust Center — how we protect your data, our architecture, compliance, and responsible disclosure.',
}

const SHIELDS = [
  {
    icon: '🔐',
    label: 'Authentication',
    color: '#818CF8',
    items: [
      'PKCE auth flow — prevents authorization code interception',
      'Supabase Row-Level Security (RLS) — your data is invisible to other users at database level',
      'HTTP-only session cookies — JavaScript cannot read your session token',
      'Middleware session refresh on every request',
      'No plaintext passwords stored — bcrypt hashing via Supabase Auth',
    ],
  },
  {
    icon: '🛡️',
    label: 'Network Security',
    color: '#4ecf9e',
    items: [
      'Arcjet DDoS shield + bot detection — blocks automated attacks in real time',
      'Sliding window rate limits: 60 req/min (general), 10 req/min (AI routes)',
      'Upstash Redis distributed rate limiting — survives multi-region deployments',
      'HSTS preloaded: max-age=63072000 (2 years) — forces HTTPS for all visitors',
      'Strict Content-Security-Policy blocks XSS and data injection attacks',
      'X-Frame-Options: DENY — prevents clickjacking in iframes',
      'X-Content-Type-Options: nosniff — prevents MIME-type confusion attacks',
    ],
  },
  {
    icon: '🔒',
    label: 'Data Protection',
    color: '#f59e0b',
    items: [
      'AES-256 encryption at rest (Supabase/AWS)',
      'TLS 1.3 encryption in transit — end-to-end for all connections',
      'API keys never exposed to browsers — server-only env vars',
      'Supabase service role key strictly confined to server-side code',
      'No third-party access to raw user data',
      'Source maps hidden from production builds (prevents reverse engineering)',
    ],
  },
  {
    icon: '🧹',
    label: 'Input Validation',
    color: '#fb923c',
    items: [
      'All user inputs sanitized — HTML tags stripped before storage',
      'CSRF origin header validation on all POST/PUT/PATCH/DELETE routes',
      'Payload size limit: 1 MB per request',
      'Malicious pattern detection: XSS, SQL injection, path traversal, SSRF',
      'JSON body scanning for nested attack payloads',
      'Email format validation (RFC-5321)',
      'Error messages never leak stack traces or secrets to clients',
    ],
  },
  {
    icon: '💳',
    label: 'Payment Security',
    color: '#fb7185',
    items: [
      'Paystack handles all card data — we never see or store card numbers',
      'Subscription webhooks are authenticated with a shared secret — forged callbacks are rejected',
      'Paystack is a PCI-DSS Level 1 compliant payment service provider',
      'Payment records retained 5 years for SARS tax compliance only',
    ],
  },
  {
    icon: '📱',
    label: 'Client & PWA',
    color: '#0ea5e9',
    items: [
      'Service worker isolates cached data — no cross-origin cache leaks',
      'IndexedDB data scoped per origin — other sites cannot read it',
      'Offline sync queue uses retry logic with max 3 attempts before drop',
      'Sensitive credentials never written to localStorage or sessionStorage',
      'Permissions-Policy: camera=(), microphone=(), geolocation=() — disabled',
    ],
  },
]

const COMPLIANCE = [
  { name: 'POPIA (Act 4 of 2013)', status: 'Compliant', detail: 'Registered with the Information Regulator. Reg No: 2026-005658', color: '#4ecf9e' },
  { name: 'PAIA (Act 2 of 2000)', status: 'Manual filed', detail: 'Section 51 Manual available at /paia — 2025/2026 annual report submitted', color: '#4ecf9e' },
  { name: 'HSTS Preload', status: 'Active', detail: 'max-age=2y, includeSubDomains, preload — force HTTPS for all visitors', color: '#4ecf9e' },
  { name: 'ECT Act (25 of 2002)', status: 'Compliant', detail: 'Electronic communications and transactions legally binding', color: '#4ecf9e' },
  { name: 'CPA (68 of 2008)', status: 'Compliant', detail: '7-day refund policy, 30-day change notice, consumer rights preserved', color: '#4ecf9e' },
  { name: 'NCA (34 of 2005)', status: 'N/A', detail: 'No credit products offered — Stokvel OS is informational only', color: 'rgba(255,255,255,0.25)' },
]

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-white/80" style={{ position: 'relative', overflowX: 'hidden' }}>
      <AmbientImage zone="alerts" opacity={0.30} blurPx={2} saturation={1.4} />
      <div className="relative z-[1] border-b border-white/8 px-4 py-4 flex items-center gap-3">
        <Link href="/" className="text-teal-400 font-mono text-xs hover:text-teal-300 transition-colors">
          ← Back
        </Link>
        <span className="text-white/20 font-mono text-xs">|</span>
        <span className="font-mono text-xs text-white/40 uppercase tracking-widest">Trust Centre</span>
      </div>

      <div className="relative z-[1] max-w-2xl mx-auto my-8 px-6 py-8 rounded-2xl border border-white/10 bg-[rgba(10,9,23,0.85)] backdrop-blur-xl">
        <div className="mb-10">
          <p className="font-mono text-[0.6rem] text-teal-400/70 uppercase tracking-widest mb-2">VarsityOS</p>
          <h1 className="font-display font-black text-3xl text-white mb-2">Security</h1>
          <p className="font-mono text-xs text-white/30">We protect 10,000+ students. Here&apos;s exactly how.</p>
        </div>

        <div className="space-y-8 font-mono text-sm leading-relaxed">

          {/* Architecture summary */}
          <div className="rounded-xl border border-teal-600/20 bg-teal-600/5 px-4 py-4">
            <p className="font-display font-bold text-teal-400 text-sm mb-2">Security-by-Design Architecture</p>
            <p className="text-white/55 text-xs leading-relaxed">
              VarsityOS is built on <strong className="text-white/75">Supabase</strong> (managed Postgres with RLS), hosted on <strong className="text-white/75">Vercel</strong> (SOC 2 Type II), and protected by <strong className="text-white/75">Arcjet</strong> at the edge. Every request passes through our security middleware before reaching your data. We follow a zero-trust model: each request is independently authenticated and rate-limited regardless of origin.
            </p>
          </div>

          {/* Security shields */}
          {SHIELDS.map(shield => (
            <section key={shield.label}>
              <h2 className="font-display font-bold text-white text-base mb-3 flex items-center gap-2">
                <span>{shield.icon}</span>
                {shield.label}
              </h2>
              <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                <ul className="space-y-2">
                  {shield.items.map(item => (
                    <li key={item} className="flex items-start gap-2.5 text-xs text-white/55">
                      <span style={{ color: shield.color, flexShrink: 0, marginTop: 1 }}>✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))}

          {/* Compliance table */}
          <section>
            <h2 className="font-display font-bold text-white text-base mb-3">⚖️ Legal Compliance</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 pr-4 font-display font-bold text-white/50 text-xs uppercase tracking-wider">Regulation</th>
                    <th className="text-left py-2 pr-4 font-display font-bold text-white/50 text-xs uppercase tracking-wider">Status</th>
                    <th className="text-left py-2 font-display font-bold text-white/50 text-xs uppercase tracking-wider hidden sm:table-cell">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPLIANCE.map(row => (
                    <tr key={row.name} className="border-b border-white/5">
                      <td className="py-2 pr-4 text-white/65 font-bold">{row.name}</td>
                      <td className="py-2 pr-4">
                        <span style={{ color: row.color, fontWeight: 700 }}>{row.status}</span>
                      </td>
                      <td className="py-2 text-white/40 hidden sm:table-cell">{row.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Third-party security */}
          <section>
            <h2 className="font-display font-bold text-white text-base mb-3">🏗️ Infrastructure Partners</h2>
            <div className="space-y-2 text-xs text-white/55">
              {[
                { name: 'Supabase', cert: 'SOC 2 Type II, GDPR, ISO 27001', role: 'Database, Auth, Storage' },
                { name: 'Vercel', cert: 'SOC 2 Type II, ISO 27001, PCI DSS SAQ A', role: 'Edge hosting, Functions, CDN' },
                { name: 'Arcjet', cert: 'Security middleware, bot detection, DDoS protection', role: 'Edge security' },
                { name: 'Upstash Redis', cert: 'SOC 2 Type II, GDPR', role: 'Distributed rate limiting' },
                { name: 'Anthropic', cert: 'SOC 2 Type II, enterprise data processing agreement', role: 'AI (Nova)' },
                { name: 'Paystack', cert: 'PCI-DSS Level 1 compliant payment service provider', role: 'Payment processing' },
                { name: 'Sentry', cert: 'SOC 2 Type II, GDPR', role: 'Error monitoring (no PII in error events)' },
              ].map(p => (
                <div key={p.name} className="flex items-start gap-3 rounded-lg border border-white/6 bg-white/[0.015] px-3 py-2.5">
                  <span className="text-teal-400 font-bold flex-shrink-0" style={{ minWidth: 100 }}>{p.name}</span>
                  <div>
                    <p className="text-white/70 text-[10px] font-bold mb-0.5">{p.role}</p>
                    <p className="text-white/35 text-[10px]">{p.cert}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* AI-specific security */}
          <section>
            <h2 className="font-display font-bold text-white text-base mb-3">✦ AI (Nova) Security</h2>
            <div className="rounded-xl border border-indigo-600/20 bg-indigo-600/5 px-4 py-4 text-xs text-white/55 space-y-2">
              <p>Your conversations with Nova are sent to Anthropic&apos;s Claude API over TLS. We have enabled <strong className="text-white/75">zero data retention</strong> — Anthropic does not use your messages to train models. Messages are stored in our database for paying subscribers (90 days) and deleted on request.</p>
              <p>Nova context is scoped to YOUR data only. Your profile, budget, and tasks are injected into prompts server-side — they are never visible to other users and are never logged in a way that could cross-contaminate sessions.</p>
              <p>Anthropic&apos;s API key is a server-only environment variable and is never exposed to browsers, source maps, or client-side bundles.</p>
            </div>
          </section>

          {/* Responsible disclosure */}
          <section>
            <h2 className="font-display font-bold text-white text-base mb-3">🔍 Responsible Disclosure</h2>
            <div className="rounded-xl border border-amber-600/20 bg-amber-600/5 px-4 py-4 text-xs text-white/55 space-y-3">
              <p>
                We take security reports seriously. If you discover a vulnerability in VarsityOS, please disclose it responsibly:
              </p>
              <ul className="space-y-1.5 list-disc list-inside">
                <li>Email: <a href="mailto:security@varsityos.co.za" className="text-teal-400 hover:text-teal-300">security@varsityos.co.za</a></li>
                <li>Subject line: <strong className="text-white/75">SECURITY DISCLOSURE — [brief description]</strong></li>
                <li>Include: affected URL, steps to reproduce, impact assessment, your contact details</li>
                <li>We will acknowledge within 48 hours and provide a fix timeline</li>
              </ul>
              <p className="text-white/40">
                Please do <strong className="text-white/60">not</strong> publicly disclose vulnerabilities before we have had reasonable time to fix them (we ask for a minimum 90-day window). We do not operate a bug bounty programme at this time, but we will credit researchers in our changelog.
              </p>
              <p className="text-white/40">
                Out of scope: social engineering, physical access attacks, denial-of-service attacks, spam.
              </p>
            </div>
          </section>

          {/* What we don't do */}
          <section>
            <h2 className="font-display font-bold text-white text-base mb-3">❌ What We Never Do</h2>
            <ul className="space-y-2 text-xs text-white/55">
              {[
                'Sell your personal information to advertisers or data brokers',
                'Store your payment card details (Paystack handles all card data)',
                'Use your Nova conversations to train AI models',
                'Share your academic or financial data with your institution without your consent',
                'Send unsolicited marketing without explicit opt-in',
                'Retain your data beyond the periods disclosed in our Privacy Policy',
                'Request your password via email or support chat (we will never ask for it)',
              ].map(item => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="text-rose-400 flex-shrink-0 mt-0.5">✗</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Related links */}
          <section className="border-t border-white/8 pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/privacy" className="flex-1 rounded-lg border border-white/8 bg-white/3 px-4 py-3 hover:bg-white/5 transition-colors no-underline">
                <p className="font-display font-bold text-teal-400 text-sm">Privacy Policy</p>
                <p className="text-white/40 text-xs mt-1">How we process your personal information under POPIA</p>
              </Link>
              <Link href="/paia" className="flex-1 rounded-lg border border-white/8 bg-white/3 px-4 py-3 hover:bg-white/5 transition-colors no-underline">
                <p className="font-display font-bold text-teal-400 text-sm">PAIA Manual</p>
                <p className="text-white/40 text-xs mt-1">Section 51 manual, records held, annual report</p>
              </Link>
              <Link href="/terms" className="flex-1 rounded-lg border border-white/8 bg-white/3 px-4 py-3 hover:bg-white/5 transition-colors no-underline">
                <p className="font-display font-bold text-teal-400 text-sm">Terms</p>
                <p className="text-white/40 text-xs mt-1">Platform rules, subscriptions, SA law</p>
              </Link>
            </div>
          </section>

          <p className="text-white/25 text-xs text-center pt-2">
            Questions? <a href="mailto:security@varsityos.co.za" className="text-teal-400 hover:text-teal-300">security@varsityos.co.za</a>
          </p>

        </div>
      </div>
    </div>
  )
}
