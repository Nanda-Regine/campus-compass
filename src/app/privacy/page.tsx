import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'VarsityOS Privacy Policy — POPIA compliant. How we collect, use, and protect your personal information.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-white/80">
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
          <p className="font-mono text-xs text-white/30">Last updated: 19 March 2026 · Compliant with POPIA (Act 4 of 2013)</p>
        </div>

        <div className="space-y-8 font-mono text-sm leading-relaxed text-white/65">

          {/* POPIA Compliance Banner */}
          <div className="rounded-xl border border-teal-600/20 bg-teal-600/5 px-4 py-3 mb-2">
            <p className="font-display font-bold text-teal-400 text-sm mb-1">POPIA Compliance</p>
            <p className="text-white/55 text-xs leading-relaxed">
              VarsityOS is operated by <strong className="text-white/80">Mirembe Muse (Pty) Ltd</strong>, registered with the Information Regulator of South Africa under <strong className="text-white/80">Registration No. 2026-005658</strong> (Registration Date: 3 April 2026).
              Our Information Officer is <strong className="text-white/80">Nandawula Kabali-Kagwa</strong> (appointed 28 August 2025), contactable at{' '}
              <a href="mailto:privacy@mirembemuse.co.za" className="text-teal-400 hover:text-teal-300">privacy@mirembemuse.co.za</a>.
            </p>
          </div>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">1. Who We Are (Responsible Party)</h2>
            <p>VarsityOS is operated by <strong className="text-white">Mirembe Muse (Pty) Ltd</strong>, a company registered in South Africa. We are the &quot;responsible party&quot; as defined in the Protection of Personal Information Act 4 of 2013 (&quot;POPIA&quot;). Our POPIA registration number is <strong className="text-white/80">2026-005658</strong>.</p>
            <p className="mt-2">Contact our Information Officer: <a href="mailto:privacy@mirembemuse.co.za" className="text-teal-400 hover:text-teal-300">privacy@mirembemuse.co.za</a></p>
            <p className="mt-2 text-white/40 text-xs">We are required by POPIA to process your personal information lawfully, responsibly, and transparently. You have the right to access, correct, delete, or object to the processing of your personal information, and to lodge a complaint with the Information Regulator at <a href="https://inforeg.org.za" target="_blank" rel="noopener noreferrer" className="text-teal-400">inforeg.org.za</a>.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">2. What Personal Information We Collect</h2>
            <p className="mb-2">We collect only the minimum personal information necessary to provide our service (&quot;data minimisation&quot; as required by POPIA):</p>
            <ul className="space-y-1.5 list-disc list-inside text-white/55">
              <li><strong className="text-white/75">Identity &amp; contact:</strong> Name, email address (required to create an account)</li>
              <li><strong className="text-white/75">Academic profile:</strong> University, year of study, faculty, modules — used to personalise AI responses</li>
              <li><strong className="text-white/75">Financial data:</strong> Monthly budget, expense records, NSFAS allowance amounts you enter — stored securely, never shared</li>
              <li><strong className="text-white/75">Usage data:</strong> App interactions, AI message history, task completions — used to improve your experience</li>
              <li><strong className="text-white/75">Device &amp; technical data:</strong> IP address (for security and fraud prevention), browser type, crash logs</li>
              <li><strong className="text-white/75">Payment data:</strong> Payment status from PayFast (we do not store your card details — PayFast is the payment processor)</li>
            </ul>
            <p className="mt-3 text-white/40 text-xs">We do NOT collect: South African ID numbers, bank account numbers, biometric data, or information about minors under 18.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">3. Purpose of Processing (Why We Collect Your Data)</h2>
            <p className="mb-2">Under POPIA, we may only process personal information for a specific, explicitly defined, and lawful purpose. We collect your information for the following purposes:</p>
            <ul className="space-y-1.5 list-disc list-inside text-white/55">
              <li>Providing and operating the VarsityOS platform (account management, feature access)</li>
              <li>Personalising your AI companion (Nova) using your academic and financial context</li>
              <li>Processing subscription payments via PayFast</li>
              <li>Sending service-related communications (account confirmations, payment receipts)</li>
              <li>Security and fraud prevention (rate limiting, suspicious activity detection)</li>
              <li>Improving our services through aggregate, anonymised analytics</li>
              <li>Complying with our legal obligations under South African law</li>
            </ul>
            <p className="mt-3">We will <strong className="text-white/75">not</strong> process your personal information for any purpose incompatible with those listed above without your explicit consent.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">4. Lawful Basis for Processing</h2>
            <p className="mb-2">We process your personal information on the following lawful grounds under POPIA s11:</p>
            <ul className="space-y-1.5 list-disc list-inside text-white/55">
              <li><strong className="text-white/75">Contractual necessity:</strong> Processing required to deliver the service you signed up for</li>
              <li><strong className="text-white/75">Legitimate interest:</strong> Security monitoring, fraud prevention, service improvement (always balanced against your rights)</li>
              <li><strong className="text-white/75">Legal obligation:</strong> Retaining payment records as required by tax law</li>
              <li><strong className="text-white/75">Consent:</strong> For any optional features, marketing, or uses beyond the above — we will ask explicitly</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">5. AI Processing (Nova) — Special Notice</h2>
            <p className="mb-2">VarsityOS uses Anthropic&apos;s Claude AI to power Nova. When you send a message to Nova:</p>
            <ul className="space-y-1.5 list-disc list-inside text-white/55">
              <li>Your message and relevant personal context (budget, tasks, exams) are sent to Anthropic&apos;s API for processing</li>
              <li>Anthropic processes this data under their own privacy policy and data processing agreement</li>
              <li>We have enabled <strong className="text-white/75">prompt caching</strong> — your base knowledge context is cached temporarily on Anthropic&apos;s infrastructure</li>
              <li>We do <strong className="text-white/75">not</strong> use your conversations to train AI models and we will never sell your conversation data</li>
              <li>Nova conversations are stored in our database and can be deleted on request</li>
              <li>Nova is an AI system and does not provide professional medical, psychological, legal, or financial advice. In a mental health crisis, contact SADAG (0800 567 567) or Lifeline SA (0861 322 322) immediately.</li>
            </ul>
            <p className="mt-2">By using Nova, you consent to this processing. You can opt out by not using Nova features.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">6. Data Sharing — Who Sees Your Data</h2>
            <p className="mb-2">We do <strong className="text-white">not sell your personal information</strong>. We share data only with:</p>
            <ul className="space-y-1.5 list-disc list-inside text-white/55">
              <li><strong className="text-white/75">Supabase (Supabase Inc.):</strong> Database and authentication infrastructure — data stored in the EU (Ireland) region</li>
              <li><strong className="text-white/75">Anthropic, PBC:</strong> AI processing for Nova responses — see Section 5</li>
              <li><strong className="text-white/75">PayFast (DPO PayGate (Pty) Ltd):</strong> Payment processing — they are a registered payment service provider in South Africa</li>
              <li><strong className="text-white/75">Vercel Inc.:</strong> Application hosting and analytics — anonymised page view data only</li>
              <li><strong className="text-white/75">Law enforcement:</strong> Only when required by a valid legal order under South African law</li>
            </ul>
            <p className="mt-3 text-white/40 text-xs">All third-party processors are bound by data processing agreements ensuring POPIA-equivalent protections.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">7. Cross-Border Data Transfers</h2>
            <p>Some of our service providers (Supabase, Anthropic, Vercel) process data outside South Africa. Under POPIA s72, we may transfer personal information to foreign countries only where:</p>
            <ul className="space-y-1 list-disc list-inside text-white/55 mt-2">
              <li>The recipient country has adequate data protection laws; or</li>
              <li>We have a binding data processing agreement in place with adequate protections; or</li>
              <li>You have consented to the transfer</li>
            </ul>
            <p className="mt-2">All our service providers maintain appropriate technical and organisational security measures.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">8. Your Rights Under POPIA</h2>
            <p className="mb-2">You have the following rights regarding your personal information (POPIA ss23–25):</p>
            <ul className="space-y-2 list-disc list-inside text-white/55">
              <li><strong className="text-white/75">Right of access:</strong> Request a copy of the personal information we hold about you</li>
              <li><strong className="text-white/75">Right to correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong className="text-white/75">Right to deletion:</strong> Request deletion of your personal information (subject to legal retention obligations)</li>
              <li><strong className="text-white/75">Right to object:</strong> Object to processing based on legitimate interest at any time</li>
              <li><strong className="text-white/75">Right to data portability:</strong> Receive your data in a structured, machine-readable format</li>
              <li><strong className="text-white/75">Right to withdraw consent:</strong> Where processing is based on consent, you may withdraw at any time without affecting prior processing</li>
              <li><strong className="text-white/75">Right to complain:</strong> Lodge a complaint with the Information Regulator of South Africa</li>
            </ul>
            <p className="mt-3">To exercise any right, email: <a href="mailto:privacy@varsityos.co.za" className="text-teal-400 hover:text-teal-300">privacy@varsityos.co.za</a>. We will respond within 30 days as required by POPIA.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">9. Data Retention</h2>
            <p className="mb-2">We retain personal information only as long as necessary for the purpose it was collected (POPIA s14):</p>
            <ul className="space-y-1.5 list-disc list-inside text-white/55">
              <li><strong className="text-white/75">Account data:</strong> Retained while your account is active + 12 months after deletion request</li>
              <li><strong className="text-white/75">Financial/academic data:</strong> Retained while account is active + 6 months after closure</li>
              <li><strong className="text-white/75">Nova conversations:</strong> 90 days for paying subscribers (Scholar, Premium, Nova Unlimited); not stored beyond the session for free users</li>
              <li><strong className="text-white/75">Anonymous analytics:</strong> 24 months</li>
              <li><strong className="text-white/75">Payment records:</strong> 5 years (required by South African tax law — Income Tax Act)</li>
              <li><strong className="text-white/75">Security logs:</strong> 90 days</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">10. Security Measures</h2>
            <p className="mb-2">We implement appropriate technical and organisational measures to protect your personal information (POPIA s19), including:</p>
            <ul className="space-y-1 list-disc list-inside text-white/55">
              <li>Row-Level Security (RLS) — you can only access your own data in our database</li>
              <li>Encryption in transit (HTTPS/TLS) and at rest (AES-256)</li>
              <li>Rate limiting on all API endpoints to prevent abuse</li>
              <li>API keys never exposed to browsers or client-side code</li>
              <li>Secure, httpOnly session cookies</li>
              <li>IP whitelisting on payment webhooks</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">11. Cookies</h2>
            <p>We use only essential cookies (authentication session management). We do not use tracking cookies, advertising cookies, or third-party analytics cookies that identify you personally. Session cookies are deleted when you log out.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">12. Children&apos;s Privacy</h2>
            <p>VarsityOS is intended for university students aged 18 and older. We do not knowingly collect personal information from persons under 18. If you believe a minor has created an account, contact us immediately and we will delete the account.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">13. Breach Notification</h2>
            <p>In the event of a data breach that poses a risk of harm, we will notify the Information Regulator and affected data subjects within the timeframes prescribed by POPIA and as directed by the Regulator.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">14. Changes to This Policy</h2>
            <p>We may update this policy. Material changes will be communicated via email or prominent in-app notice at least 30 days before they take effect. Continued use after the effective date constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">15. Contact &amp; Information Regulator</h2>
            <div className="space-y-2 text-white/55">
              <p><strong className="text-white/75">Information Officer:</strong> <a href="mailto:privacy@varsityos.co.za" className="text-teal-400 hover:text-teal-300">privacy@varsityos.co.za</a></p>
              <p><strong className="text-white/75">Company:</strong> Mirembe Muse (Pty) Ltd, South Africa</p>
              <p><strong className="text-white/75">POPIA Registration No.:</strong> 2026-005658</p>
              <p><strong className="text-white/75">Information Officer:</strong> Nandawula Kabali-Kagwa · <a href="mailto:privacy@mirembemuse.co.za" className="text-teal-400 hover:text-teal-300">privacy@mirembemuse.co.za</a></p>
              <p className="pt-2 border-t border-white/10"><strong className="text-white/75">Information Regulator of South Africa:</strong><br />
                Website: <a href="https://inforeg.org.za" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:text-teal-300">inforeg.org.za</a><br />
                Email: <a href="mailto:complaints@inforeg.org.za" className="text-teal-400 hover:text-teal-300">complaints@inforeg.org.za</a><br />
                Tel: 010 023 5200
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
