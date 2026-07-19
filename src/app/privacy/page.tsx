import type { Metadata } from 'next'
import Link from 'next/link'
import { AmbientImage } from '@/components/ui/AmbientImage'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'VarsityOS Privacy Policy — POPIA compliant. How we collect, use, and protect your personal information.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-white" style={{ position: 'relative', overflowX: 'hidden' }}>
      <AmbientImage zone="digital" opacity={0.30} blurPx={2} saturation={1.4} />
      <div className="relative z-[1] border-b border-white/8 px-4 py-4 flex items-center gap-3">
        <Link href="/" className="text-teal-400 font-mono text-xs hover:text-teal-300 transition-colors">
          ← Back
        </Link>
        <span className="text-white font-mono text-xs">|</span>
        <span className="font-mono text-xs text-white uppercase tracking-widest">Legal</span>
      </div>

      <div className="relative z-[1] max-w-2xl mx-auto my-8 px-6 py-8 rounded-2xl border border-white/10 bg-[rgba(10,9,23,0.85)] backdrop-blur-xl">
        <div className="mb-10">
          <p className="font-mono text-[0.6rem] text-teal-400 uppercase tracking-widest mb-2">VarsityOS</p>
          <h1 className="font-display font-black text-3xl text-white mb-2">Privacy Policy</h1>
          <p className="font-mono text-xs text-white">Last updated: 19 July 2026 · Compliant with POPIA (Act 4 of 2013)</p>
        </div>

        <div className="space-y-8 font-mono text-sm leading-relaxed text-white">

          {/* POPIA Compliance Banner */}
          <div className="rounded-xl border border-teal-600/20 bg-teal-600/5 px-4 py-3 mb-2">
            <p className="font-display font-bold text-teal-400 text-sm mb-1">POPIA Compliance</p>
            <p className="text-white text-xs leading-relaxed">
              VarsityOS is operated by <strong className="text-white">Mirembe Muse (Pty) Ltd</strong>, registered with the Information Regulator of South Africa under <strong className="text-white">Registration No. 2026-005658</strong> (Registration Date: 3 April 2026).
              Our Information Officer is <strong className="text-white">Nandawula Kabali-Kagwa</strong> (appointed 28 August 2025), contactable at{' '}
              <a href="mailto:privacy@mirembemuse.co.za" className="text-teal-400 hover:text-teal-300">privacy@mirembemuse.co.za</a>.
            </p>
          </div>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">1. Who We Are (Responsible Party)</h2>
            <p>VarsityOS is operated by <strong className="text-white">Mirembe Muse (Pty) Ltd</strong>, a company registered in South Africa. We are the &quot;responsible party&quot; as defined in the Protection of Personal Information Act 4 of 2013 (&quot;POPIA&quot;). Our POPIA registration number is <strong className="text-white">2026-005658</strong>.</p>
            <p className="mt-2">Contact our Information Officer: <a href="mailto:privacy@mirembemuse.co.za" className="text-teal-400 hover:text-teal-300">privacy@mirembemuse.co.za</a></p>
            <p className="mt-2 text-white text-xs">We are required by POPIA to process your personal information lawfully, responsibly, and transparently. You have the right to access, correct, delete, or object to the processing of your personal information, and to lodge a complaint with the Information Regulator at <a href="https://inforeg.org.za" target="_blank" rel="noopener noreferrer" className="text-teal-400">inforeg.org.za</a>.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">2. What Personal Information We Collect</h2>
            <p className="mb-2">We collect only the minimum personal information necessary to provide our service (&quot;data minimisation&quot; as required by POPIA):</p>
            <ul className="space-y-1.5 list-disc list-inside text-white">
              <li><strong className="text-white">Identity &amp; contact:</strong> Name, email address (required to create an account)</li>
              <li><strong className="text-white">Academic profile:</strong> University, year of study, faculty, modules — used to personalise AI responses</li>
              <li><strong className="text-white">Financial data:</strong> Monthly budget, expense records, NSFAS allowance amounts you enter — stored securely, never shared</li>
              <li><strong className="text-white">Usage data:</strong> App interactions, AI message history, task completions — used to improve your experience</li>
              <li><strong className="text-white">Device &amp; technical data:</strong> IP address (for security and fraud prevention), browser type, crash logs</li>
              <li><strong className="text-white">Payment data:</strong> Payment status from Paystack (we do not store your card details — Paystack is the payment processor)</li>
            </ul>
            <p className="mt-3 text-white text-xs">We do NOT collect: South African ID numbers, bank account numbers, biometric data, or information about minors under 18.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">3. Purpose of Processing (Why We Collect Your Data)</h2>
            <p className="mb-2">Under POPIA, we may only process personal information for a specific, explicitly defined, and lawful purpose. We collect your information for the following purposes:</p>
            <ul className="space-y-1.5 list-disc list-inside text-white">
              <li>Providing and operating the VarsityOS platform (account management, feature access)</li>
              <li>Personalising your AI companion (Nova) using your academic and financial context</li>
              <li>Processing subscription payments via Paystack</li>
              <li>Sending service-related communications (account confirmations, payment receipts)</li>
              <li>Security and fraud prevention (rate limiting, suspicious activity detection)</li>
              <li>Improving our services through aggregate, anonymised analytics</li>
              <li>Complying with our legal obligations under South African law</li>
            </ul>
            <p className="mt-3">We will <strong className="text-white">not</strong> process your personal information for any purpose incompatible with those listed above without your explicit consent.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">4. Lawful Basis for Processing</h2>
            <p className="mb-2">We process your personal information on the following lawful grounds under POPIA s11:</p>
            <ul className="space-y-1.5 list-disc list-inside text-white">
              <li><strong className="text-white">Contractual necessity:</strong> Processing required to deliver the service you signed up for</li>
              <li><strong className="text-white">Legitimate interest:</strong> Security monitoring, fraud prevention, service improvement (always balanced against your rights)</li>
              <li><strong className="text-white">Legal obligation:</strong> Retaining payment records as required by tax law</li>
              <li><strong className="text-white">Consent:</strong> For any optional features, marketing, or uses beyond the above — we will ask explicitly</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">5. AI Processing (Nova) — Special Notice</h2>
            <p className="mb-2">VarsityOS uses Anthropic&apos;s Claude AI to power Nova. When you send a message to Nova:</p>
            <ul className="space-y-1.5 list-disc list-inside text-white">
              <li>Your message and relevant personal context (budget, tasks, exams) are sent to Anthropic&apos;s API for processing</li>
              <li>Anthropic processes this data under their own privacy policy and data processing agreement</li>
              <li>We have enabled <strong className="text-white">prompt caching</strong> — your base knowledge context is cached temporarily on Anthropic&apos;s infrastructure</li>
              <li>We do <strong className="text-white">not</strong> use your conversations to train AI models and we will never sell your conversation data</li>
              <li>Nova conversations are stored in our database and can be deleted on request</li>
              <li>Nova is an AI system and does not provide professional medical, psychological, legal, or financial advice. In a mental health crisis, contact SADAG (0800 567 567) or Lifeline SA (0861 322 322) immediately.</li>
            </ul>
            <p className="mt-2">By using Nova, you consent to this processing. You can opt out by not using Nova features.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">6. Data Sharing — Who Sees Your Data</h2>
            <p className="mb-2">We do <strong className="text-white">not sell your personal information</strong>. We share data only with:</p>
            <ul className="space-y-1.5 list-disc list-inside text-white">
              <li><strong className="text-white">Supabase (Supabase Inc.):</strong> Database and authentication infrastructure — data stored in the EU (Ireland) region</li>
              <li><strong className="text-white">Anthropic, PBC:</strong> AI processing for Nova responses — see Section 5</li>
              <li><strong className="text-white">Paystack:</strong> Payment processing — a PCI-DSS Level 1 compliant payment service provider</li>
              <li><strong className="text-white">Vercel Inc.:</strong> Application hosting and analytics — anonymised page view data only</li>
              <li><strong className="text-white">Google LLC (Analytics &amp; Tag Manager):</strong> Usage analytics — loaded only with your cookie consent (see Section 11)</li>
              <li><strong className="text-white">PostHog Inc.:</strong> Product analytics — loaded only with your cookie consent (see Section 11)</li>
              <li><strong className="text-white">Hotjar Ltd:</strong> Aggregate usage/session insights — loaded only with your cookie consent (see Section 11)</li>
              <li><strong className="text-white">Crisp IM SAS:</strong> In-app live chat support — active only if you use the chat widget</li>
              <li><strong className="text-white">Arcjet:</strong> Bot detection and abuse prevention — processes IP address and request metadata</li>
              <li><strong className="text-white">Upstash:</strong> Rate-limiting infrastructure — processes an IP address / identifier to prevent abuse</li>
              <li><strong className="text-white">Inngest:</strong> Background job processing (e.g. notifications and scheduled tasks)</li>
              <li><strong className="text-white">Law enforcement:</strong> Only when required by a valid legal order under South African law</li>
            </ul>
            <p className="mt-3 text-white text-xs">All third-party processors are bound by data processing agreements ensuring POPIA-equivalent protections.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">7. Cross-Border Data Transfers</h2>
            <p>Some of our service providers (Supabase, Anthropic, Vercel, Google, PostHog, Hotjar, Crisp, Arcjet, Upstash, Inngest) process data outside South Africa. Under POPIA s72, we may transfer personal information to foreign countries only where:</p>
            <ul className="space-y-1 list-disc list-inside text-white mt-2">
              <li>The recipient country has adequate data protection laws; or</li>
              <li>We have a binding data processing agreement in place with adequate protections; or</li>
              <li>You have consented to the transfer</li>
            </ul>
            <p className="mt-2">All our service providers maintain appropriate technical and organisational security measures.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">8. Your Rights Under POPIA</h2>
            <p className="mb-2">You have the following rights regarding your personal information (POPIA ss23–25):</p>
            <ul className="space-y-2 list-disc list-inside text-white">
              <li><strong className="text-white">Right of access:</strong> Request a copy of the personal information we hold about you</li>
              <li><strong className="text-white">Right to correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong className="text-white">Right to deletion:</strong> Request deletion of your personal information (subject to legal retention obligations)</li>
              <li><strong className="text-white">Right to object:</strong> Object to processing based on legitimate interest at any time</li>
              <li><strong className="text-white">Right to data portability:</strong> Receive your data in a structured, machine-readable format</li>
              <li><strong className="text-white">Right to withdraw consent:</strong> Where processing is based on consent, you may withdraw at any time without affecting prior processing</li>
              <li><strong className="text-white">Right to complain:</strong> Lodge a complaint with the Information Regulator of South Africa</li>
            </ul>
            <p className="mt-3">To exercise any right, email: <a href="mailto:privacy@varsityos.co.za" className="text-teal-400 hover:text-teal-300">privacy@varsityos.co.za</a>. We will respond within 30 days as required by POPIA.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">9. Data Retention</h2>
            <p className="mb-2">We retain personal information only as long as necessary for the purpose it was collected (POPIA s14):</p>
            <ul className="space-y-1.5 list-disc list-inside text-white">
              <li><strong className="text-white">Account data:</strong> Retained while your account is active + 12 months after deletion request</li>
              <li><strong className="text-white">Financial/academic data:</strong> Retained while account is active + 6 months after closure</li>
              <li><strong className="text-white">Nova conversations:</strong> 90 days for paying subscribers (Nova Scholar, Nova Unlimited); not stored beyond the session for free users</li>
              <li><strong className="text-white">Anonymous analytics:</strong> 24 months</li>
              <li><strong className="text-white">Payment records:</strong> 5 years (required by South African tax law — Income Tax Act)</li>
              <li><strong className="text-white">Security logs:</strong> 90 days</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">10. Security Measures</h2>
            <p className="mb-2">We implement appropriate technical and organisational measures to protect your personal information (POPIA s19), including:</p>
            <ul className="space-y-1 list-disc list-inside text-white">
              <li>Row-Level Security (RLS) — you can only access your own data in our database</li>
              <li>Encryption in transit (HTTPS/TLS) and at rest (AES-256)</li>
              <li>Rate limiting on all API endpoints to prevent abuse</li>
              <li>API keys never exposed to browsers or client-side code</li>
              <li>Secure, httpOnly session cookies</li>
              <li>IP whitelisting on payment webhooks</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">11. Cookies &amp; Analytics</h2>
            <p className="mb-2">We use <strong className="text-white">essential cookies</strong> (authentication and session management) that are required for the platform to work — these are always on and are cleared when you log out.</p>
            <p className="mb-2">With your consent, we also use <strong className="text-white">analytics cookies and tags</strong> to understand how the app is used so we can improve it:</p>
            <ul className="space-y-1.5 list-disc list-inside text-white">
              <li><strong className="text-white">Google Analytics 4 &amp; Google Tag Manager</strong> (IDs G-87QR50FJ7N, GT-PJ4PM27T, GTM-W7R77VP9) — usage and traffic analytics</li>
              <li><strong className="text-white">PostHog</strong> — product analytics (how features are used)</li>
              <li><strong className="text-white">Hotjar</strong> — aggregate usage and session insights</li>
              <li><strong className="text-white">Vercel Analytics</strong> — privacy-friendly, aggregated page-view data</li>
            </ul>
            <p className="mt-3">We implement <strong className="text-white">Google Consent Mode v2</strong>: all analytics and advertising storage defaults to <em>denied</em>, so no analytics cookies are set until you opt in. When you first visit, our cookie banner lets you choose <strong className="text-white">&quot;Accept all&quot;</strong> or <strong className="text-white">&quot;Essential only&quot;</strong>. Choosing &quot;Essential only&quot; keeps the analytics above disabled; you can change your choice at any time by clearing this site&apos;s data in your browser. We also offer optional <strong className="text-white">live chat support (Crisp)</strong>, which loads its own functional cookies only when you open the chat. We do <strong className="text-white">not</strong> use advertising or cross-site tracking cookies.</p>
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
            <h2 className="font-display font-bold text-white text-lg mb-3">14. Access to Records Under PAIA</h2>
            <p className="mb-2">
              In addition to your POPIA data rights, you may also request access to records held by Mirembe Muse (Pty) Ltd under the <strong className="text-white">Promotion of Access to Information Act 2 of 2000 (&quot;PAIA&quot;)</strong>.
            </p>
            <p className="mb-3 text-white">
              PAIA requests require a completed <strong className="text-white">Form C</strong> (from the Information Regulator) and payment of a non-refundable request fee of <strong className="text-white">R50</strong>. We must respond within 30 days. Our full PAIA manual covers request procedures, fees, grounds for refusal, and our annual report.
            </p>
            <div className="rounded-lg border border-sky-600/20 bg-sky-600/5 px-4 py-3">
              <p className="text-xs text-white mb-2">
                <strong className="text-sky-400">Tip:</strong> If you only want access to your <em>own</em> personal information (your account data, messages, entries), use your POPIA rights under Section 8 above — no Form C or fee required.
              </p>
              <Link href="/paia" className="text-teal-400 hover:text-teal-300 text-xs font-display font-bold">
                View PAIA Section 51 Manual &amp; Annual Report →
              </Link>
            </div>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">15. Changes to This Policy</h2>
            <p>We may update this policy. Material changes will be communicated via email or prominent in-app notice at least 30 days before they take effect. Continued use after the effective date constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">16. Contact &amp; Information Regulator</h2>
            <div className="space-y-2 text-white">
              <p><strong className="text-white">Information Officer:</strong> <a href="mailto:privacy@varsityos.co.za" className="text-teal-400 hover:text-teal-300">privacy@varsityos.co.za</a></p>
              <p><strong className="text-white">Company:</strong> Mirembe Muse (Pty) Ltd, South Africa</p>
              <p><strong className="text-white">POPIA Registration No.:</strong> 2026-005658</p>
              <p><strong className="text-white">Information Officer:</strong> Nandawula Kabali-Kagwa · <a href="mailto:privacy@mirembemuse.co.za" className="text-teal-400 hover:text-teal-300">privacy@mirembemuse.co.za</a></p>
              <p className="pt-2 border-t border-white/10"><strong className="text-white">Information Regulator of South Africa:</strong><br />
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
