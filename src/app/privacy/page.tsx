import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'VarsityOS Privacy Policy — how we collect, use, and protect your data.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#080f0e] text-white/80">
      {/* Header */}
      <div className="border-b border-white/8 px-4 py-4 flex items-center gap-3">
        <Link href="/" className="text-teal-400 font-mono text-xs hover:text-teal-300 transition-colors">
          ← Back
        </Link>
        <span className="text-white/20 font-mono text-xs">|</span>
        <span className="font-mono text-xs text-white/40 uppercase tracking-widest">Legal</span>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-10">
        <div className="mb-10">
          <p className="font-mono text-[0.6rem] text-teal-400/70 uppercase tracking-widest mb-2">VarsityOS</p>
          <h1 className="font-display font-black text-3xl text-white mb-2">Privacy Policy</h1>
          <p className="font-mono text-xs text-white/30">Last updated: 10 March 2026 · POPIA compliant</p>
        </div>

        <div className="space-y-8 font-mono text-sm leading-relaxed text-white/65">

          <section>
            <h2 className="font-display font-bold text-base text-white mb-3">1. Introduction</h2>
            <p>
              <strong className="text-white/85">Mirembe Muse (Pty) Ltd</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates VarsityOS. We are committed
              to protecting your personal information in accordance with the{' '}
              <strong className="text-white/85">Protection of Personal Information Act 4 of 2013 (POPIA)</strong> and other
              applicable South African privacy laws.
            </p>
            <p className="mt-3">
              This Policy explains what personal information we collect, why we collect it, how we use it, who we share it
              with, and what rights you have over it.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-base text-white mb-3">2. Information We Collect</h2>

            <div className="space-y-4">
              <div>
                <p className="text-white/85 font-bold mb-2">2.1 Account Information</p>
                <ul className="list-disc ml-5 space-y-1.5">
                  <li>Full name and email address (required to create an account)</li>
                  <li>University name and year of study (collected during setup)</li>
                  <li>Profile photo (optional, via Google OAuth)</li>
                </ul>
              </div>

              <div>
                <p className="text-white/85 font-bold mb-2">2.2 Study Planner Data</p>
                <ul className="list-disc ml-5 space-y-1.5">
                  <li>Tasks, assignments, and deadlines you create</li>
                  <li>Timetable entries and module names</li>
                  <li>Exam dates, venues, and preparation notes</li>
                </ul>
              </div>

              <div>
                <p className="text-white/85 font-bold mb-2">2.3 Financial Data</p>
                <ul className="list-disc ml-5 space-y-1.5">
                  <li>Monthly budget amounts and NSFAS allowance figures you enter</li>
                  <li>Expense records (category, amount, description, date)</li>
                  <li>NSFAS allowance breakdown (living, accommodation, books)</li>
                </ul>
                <p className="mt-2 text-white/45 text-xs">
                  We do not have access to your actual bank accounts or NSFAS portal — all figures are manually entered by you.
                </p>
              </div>

              <div>
                <p className="text-white/85 font-bold mb-2">2.4 Meal Plan Data</p>
                <ul className="list-disc ml-5 space-y-1.5">
                  <li>7-day meal plans you create</li>
                  <li>Grocery lists and budget preferences</li>
                  <li>Dietary preferences you disclose to the recipe generator</li>
                </ul>
              </div>

              <div>
                <p className="text-white/85 font-bold mb-2">2.5 Nova AI Conversation Data</p>
                <ul className="list-disc ml-5 space-y-1.5">
                  <li>Messages you send to Nova (stored in our database)</li>
                  <li>Nova&apos;s responses</li>
                  <li>Mood indicators you select</li>
                </ul>
                <p className="mt-2 text-white/45 text-xs">
                  Nova messages are sent to Anthropic&apos;s Claude API for processing. See Section 5 for more on third-party
                  processors. Your conversations are not used to train AI models.
                </p>
              </div>

              <div>
                <p className="text-white/85 font-bold mb-2">2.6 Payment Data</p>
                <ul className="list-disc ml-5 space-y-1.5">
                  <li>Payment confirmation records (amount, date, plan duration)</li>
                  <li>PayFast transaction ID</li>
                </ul>
                <p className="mt-2 text-white/45 text-xs">
                  We do not store card numbers, CVVs, or banking details. These are handled entirely by PayFast.
                </p>
              </div>

              <div>
                <p className="text-white/85 font-bold mb-2">2.7 Technical Data</p>
                <ul className="list-disc ml-5 space-y-1.5">
                  <li>Device type and browser (via Vercel Analytics — aggregated, anonymous)</li>
                  <li>Page views and feature usage (no individual profiling)</li>
                  <li>Error logs (no personal data in logs)</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-display font-bold text-base text-white mb-3">3. Why We Collect This Information</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 pr-4 text-white/50 font-normal">Purpose</th>
                    <th className="text-left py-2 text-white/50 font-normal">Legal basis (POPIA)</th>
                  </tr>
                </thead>
                <tbody className="space-y-1">
                  {[
                    ['Provide the VarsityOS service', 'Performance of a contract'],
                    ['Process Premium payments', 'Performance of a contract'],
                    ['Generate personalised AI insights', 'Consent (you trigger these)'],
                    ['Detect crisis signals in Nova chats', 'Legitimate interest (user safety)'],
                    ['Improve app performance', 'Legitimate interest'],
                    ['Comply with legal obligations', 'Legal obligation'],
                    ['Send account-related emails', 'Performance of a contract'],
                  ].map(([purpose, basis]) => (
                    <tr key={purpose} className="border-b border-white/5">
                      <td className="py-2 pr-4 text-white/65">{purpose}</td>
                      <td className="py-2 text-teal-400/70">{basis}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="font-display font-bold text-base text-white mb-3">4. How We Store Your Data</h2>
            <p>
              Your data is stored in <strong className="text-white/85">Supabase</strong> (hosted on AWS infrastructure).
              All tables have Row Level Security (RLS) enabled — you can only access your own data and no other user&apos;s data.
            </p>
            <p className="mt-3">
              Data is encrypted in transit (HTTPS/TLS) and at rest. We retain your data for as long as your account is
              active. If you delete your account, we will delete or anonymise your personal data within 30 days, except
              where we are required to retain it for legal or tax purposes (e.g., payment records for 5 years).
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-base text-white mb-3">5. Third-Party Services</h2>
            <p className="mb-3">We use the following sub-processors to provide the service:</p>

            <div className="space-y-3">
              {[
                {
                  name: 'Supabase',
                  purpose: 'Database, authentication, file storage',
                  location: 'AWS (South Africa region where available)',
                  privacy: 'supabase.com/privacy',
                },
                {
                  name: 'Anthropic',
                  purpose: 'Nova AI conversations and all AI-generated content',
                  location: 'United States',
                  privacy: 'anthropic.com/privacy',
                },
                {
                  name: 'Vercel',
                  purpose: 'App hosting, edge functions, analytics',
                  location: 'Global CDN',
                  privacy: 'vercel.com/legal/privacy-policy',
                },
                {
                  name: 'PayFast',
                  purpose: 'Payment processing',
                  location: 'South Africa',
                  privacy: 'payfast.io/privacy-policy',
                },
                {
                  name: 'Google',
                  purpose: 'Optional Google OAuth sign-in',
                  location: 'Global',
                  privacy: 'policies.google.com/privacy',
                },
              ].map(s => (
                <div key={s.name} className="bg-white/3 rounded-xl p-3 border border-white/6">
                  <p className="text-white/85 font-bold text-xs mb-1">{s.name}</p>
                  <p className="text-xs text-white/50">{s.purpose}</p>
                  <p className="text-xs text-white/35 mt-0.5">Location: {s.location}</p>
                </div>
              ))}
            </div>

            <p className="mt-4 text-white/45 text-xs">
              When data is transferred outside South Africa (e.g., to Anthropic in the US), we ensure appropriate
              safeguards are in place consistent with POPIA Section 72 requirements.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-base text-white mb-3">6. Cookies &amp; Local Storage</h2>
            <p>VarsityOS uses:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1.5">
              <li><strong className="text-white/85">Session cookies</strong> — set by Supabase Auth to keep you logged in (strictly necessary)</li>
              <li><strong className="text-white/85">Service Worker cache</strong> — stores app assets locally for offline access (no personal data)</li>
              <li><strong className="text-white/85">Zustand local state</strong> — temporary UI state, cleared on logout</li>
            </ul>
            <p className="mt-3">
              We do not use advertising cookies, tracking pixels, or third-party analytics cookies.
              Vercel Analytics is privacy-first and does not fingerprint individual users.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-base text-white mb-3">7. Your Rights Under POPIA</h2>
            <p>As a data subject, you have the right to:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1.5">
              <li><strong className="text-white/85">Access</strong> — request a copy of the personal information we hold about you</li>
              <li><strong className="text-white/85">Correction</strong> — request correction of inaccurate information</li>
              <li><strong className="text-white/85">Deletion</strong> — request deletion of your account and personal data</li>
              <li><strong className="text-white/85">Objection</strong> — object to processing based on legitimate interest</li>
              <li><strong className="text-white/85">Restriction</strong> — request that we limit processing of your data</li>
              <li><strong className="text-white/85">Portability</strong> — receive your data in a machine-readable format (CSV export available in Premium)</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, email us at{' '}
              <a href="mailto:hello@mirembemuse.co.za" className="text-teal-400 hover:text-teal-300">hello@mirembemuse.co.za</a>{' '}
              with the subject line &ldquo;POPIA Request&rdquo;. We will respond within 30 days.
            </p>
            <p className="mt-3">
              If you are unsatisfied with our response, you may lodge a complaint with the{' '}
              <strong className="text-white/85">Information Regulator of South Africa</strong> at{' '}
              <a href="mailto:complaints.IR@justice.gov.za" className="text-teal-400 hover:text-teal-300">complaints.IR@justice.gov.za</a>.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-base text-white mb-3">8. Children&apos;s Privacy</h2>
            <p>
              VarsityOS is not directed at children under 13. We do not knowingly collect personal information from
              children under 13. If you believe a child under 13 has provided us with personal information, contact us
              and we will delete it promptly.
            </p>
            <p className="mt-3">
              Users aged 13–17 should ensure a parent or guardian has reviewed and consented to these terms on their behalf.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-base text-white mb-3">9. Data Breaches</h2>
            <p>
              In the event of a personal information breach that poses a risk to your rights, we will notify you and the
              Information Regulator as required by POPIA Section 22, within 72 hours of becoming aware of the breach.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-base text-white mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will post the updated policy with a new effective
              date. For material changes, we will notify you via email at least 14 days before the change takes effect.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-base text-white mb-3">11. Contact &amp; Information Officer</h2>
            <div className="mt-2 space-y-1">
              <p><strong className="text-white/85">Mirembe Muse (Pty) Ltd</strong></p>
              <p>Information Officer: Nanda Regine</p>
              <p>East London, Eastern Cape, South Africa</p>
              <p>
                Email:{' '}
                <a href="mailto:hello@mirembemuse.co.za" className="text-teal-400 hover:text-teal-300">
                  hello@mirembemuse.co.za
                </a>
              </p>
            </div>
          </section>

        </div>

        <div className="mt-12 pt-6 border-t border-white/8 flex flex-wrap gap-4 justify-between items-center">
          <Link href="/terms" className="font-mono text-xs text-teal-400/70 hover:text-teal-400 transition-colors">
            Terms &amp; Conditions →
          </Link>
          <Link href="/" className="font-mono text-xs text-white/30 hover:text-white/60 transition-colors">
            Back to VarsityOS
          </Link>
        </div>
      </div>
    </div>
  )
}
