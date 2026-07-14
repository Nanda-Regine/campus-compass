import type { Metadata } from 'next'
import Link from 'next/link'
import { AmbientImage } from '@/components/ui/AmbientImage'

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'VarsityOS Terms and Conditions of Use — South African law compliant.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-white/80" style={{ position: 'relative', overflowX: 'hidden' }}>
      <AmbientImage zone="impasto" opacity={0.30} blurPx={2} saturation={1.4} />
      <div className="relative z-[1] border-b border-white/8 px-4 py-4 flex items-center gap-3">
        <Link href="/" className="text-teal-400 font-mono text-xs hover:text-teal-300 transition-colors">
          ← Back
        </Link>
        <span className="text-white/45 font-mono text-xs">|</span>
        <span className="font-mono text-xs text-white/65 uppercase tracking-widest">Legal</span>
      </div>

      <div className="relative z-[1] max-w-2xl mx-auto my-8 px-6 py-8 rounded-2xl border border-white/10 bg-[rgba(10,9,23,0.85)] backdrop-blur-xl">
        <div className="mb-10">
          <p className="font-mono text-[0.6rem] text-teal-400/70 uppercase tracking-widest mb-2">VarsityOS</p>
          <h1 className="font-display font-black text-3xl text-white mb-2">Terms &amp; Conditions</h1>
          <p className="font-mono text-xs text-white/55">Last updated: 19 March 2026 · Governed by the laws of South Africa</p>
        </div>

        <div className="space-y-8 font-mono text-sm leading-relaxed text-white/85">

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">1. Parties and Agreement</h2>
            <p>These Terms &amp; Conditions (&quot;Terms&quot;) constitute a binding agreement between <strong className="text-white">Mirembe Muse Pty Ltd</strong> (&quot;we&quot;, &quot;us&quot;, &quot;VarsityOS&quot;) and you (&quot;User&quot;, &quot;you&quot;), a person accessing or using the VarsityOS platform.</p>
            <p className="mt-2">By creating an account or using the platform you confirm that you:</p>
            <ul className="list-disc list-inside text-white/55 mt-1 space-y-1">
              <li>Are at least 18 years old and legally capable of entering a binding agreement</li>
              <li>Are a university student or prospective student in South Africa</li>
              <li>Have read, understood, and agree to be bound by these Terms and our Privacy Policy</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">2. Description of Service</h2>
            <p>VarsityOS is a digital student support platform providing tools including academic planning, flexible wallet tracking, savings goals, AI-powered assistance (Nova), meal planning, group assignment management, and part-time work management. The platform works offline via PWA technology.</p>
            <p className="mt-2">The platform is offered on a freemium basis:</p>
            <ul className="list-disc list-inside text-white/55 mt-1 space-y-1">
              <li><strong className="text-white/75">Free tier:</strong> All features + 20 Nova AI messages per month — no credit card required</li>
              <li><strong className="text-white/75">Nova Scholar (R29/month):</strong> 150 Nova messages per month, AI Recipe Generator, AI Budget Coach, AI Study Plans, priority support</li>
              <li><strong className="text-white/75">Nova Unlimited (R89/month):</strong> Unlimited Nova messages, CSV data export, first access to new Nova capabilities, direct feedback channel to the builder</li>
            </ul>
            <p className="mt-2 text-xs text-white/65">We process your personal information in compliance with POPIA (Act 4 of 2013). Mirembe Muse (Pty) Ltd POPIA Registration No.: <strong className="text-white/60">2026-005658</strong>.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">3. User Obligations</h2>
            <p className="mb-2">You agree to:</p>
            <ul className="list-disc list-inside text-white/55 space-y-1">
              <li>Provide accurate, truthful information when creating your account and profile</li>
              <li>Keep your login credentials confidential and notify us immediately of any unauthorised access</li>
              <li>Use the platform only for lawful purposes consistent with South African law</li>
              <li>Not attempt to bypass, hack, reverse-engineer, or exploit any part of the platform</li>
              <li>Not use the AI (Nova) to generate harmful, illegal, or abusive content</li>
              <li>Not share your account with others or create multiple accounts</li>
              <li>Not use automated scripts, bots, or tools to interact with the platform</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">4. AI Disclaimer (Nova) — Important</h2>
            <p className="mb-2">Nova is an <strong className="text-white">AI companion, not a licensed professional</strong>. Specifically:</p>
            <ul className="list-disc list-inside text-white/55 space-y-1.5">
              <li>Nova is <strong className="text-white/75">not a licensed therapist, psychologist, financial advisor, or legal advisor</strong></li>
              <li>Nothing Nova says constitutes professional mental health advice, financial advice, or legal advice. Nova&apos;s responses are for general informational and supportive purposes only.</li>
              <li>In a mental health crisis, please contact <strong className="text-white/75">SADAG (0800 567 567)</strong> or <strong className="text-white/75">Lifeline SA (0861 322 322)</strong> immediately — do not rely solely on Nova</li>
              <li>Financial information provided by Nova is for general guidance only — consult a qualified financial advisor for important decisions</li>
              <li>AI responses may contain errors. Always verify important information from official sources (NSFAS, your university, SARS)</li>
              <li>Nova uses Anthropic&apos;s Claude AI — by using Nova you accept Anthropic&apos;s terms of service. We process your data under POPIA (Registration No. 2026-005658).</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">5. Payments and Subscriptions</h2>
            <p className="mb-2">Premium subscriptions are processed by <strong className="text-white">Paystack</strong>, a PCI-DSS Level 1 compliant payment service provider.</p>
            <ul className="list-disc list-inside text-white/55 space-y-1.5">
              <li>All prices are in South African Rand (ZAR) and are inclusive of VAT where applicable</li>
              <li>Subscriptions are billed monthly and renew automatically unless cancelled</li>
              <li>You may cancel at any time; cancellation takes effect at the end of the current billing period</li>
              <li><strong className="text-white/75">Refund policy:</strong> Refunds are available within 7 days of initial purchase if the service is materially defective. Contact support to request a refund. No refunds for partial months of use.</li>
              <li>We reserve the right to change pricing with 30 days&apos; written notice</li>
              <li>Your premium status will lapse if a recurring payment fails — you will be notified by email</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">6. Referral Program</h2>
            <ul className="list-disc list-inside text-white/55 space-y-1.5">
              <li>Referral rewards are XP (experience points) that climb your level and unlock badges — not cash or real premium status</li>
              <li>XP is awarded only when a referred user successfully creates and verifies an account (referrer +250 XP, new user +100 XP)</li>
              <li>Each user may only benefit from one referral (as a referred user)</li>
              <li>We reserve the right to reverse referral credits if abuse or fraud is detected</li>
              <li>Referral credits have no monetary value and cannot be transferred or redeemed for cash</li>
              <li>We may modify or discontinue the referral program at any time with reasonable notice</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">7. Intellectual Property</h2>
            <p>All content, design, code, and features of VarsityOS are the intellectual property of Mirembe Muse Pty Ltd, protected under South African copyright law. You may not reproduce, distribute, or create derivative works without our written consent.</p>
            <p className="mt-2">You retain ownership of all content you create in the platform (tasks, notes, budget entries). By using the platform you grant us a limited licence to process and store this content to provide the service.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">8. Limitation of Liability</h2>
            <p className="mb-2">To the maximum extent permitted by South African law:</p>
            <ul className="list-disc list-inside text-white/55 space-y-1.5">
              <li>We are not liable for any loss of data, academic failure, financial loss, or other consequential damages arising from use of the platform</li>
              <li>The platform is provided &quot;as is&quot; without warranty of uninterrupted availability or error-free operation</li>
              <li>Our total liability to you in any 12-month period shall not exceed the amount you paid us in subscription fees during that period</li>
              <li>Nothing in these Terms excludes liability for gross negligence, fraud, or death/personal injury caused by our negligence, as these cannot be excluded under South African law</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">9. Service Availability</h2>
            <p>We aim for 99% uptime but do not guarantee uninterrupted service. Scheduled maintenance will be announced in advance where possible. We are not responsible for downtime caused by third-party providers (Supabase, Vercel, Anthropic, Paystack) or events outside our reasonable control (force majeure).</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">10. Account Termination</h2>
            <p className="mb-2">We may suspend or terminate your account immediately if you:</p>
            <ul className="list-disc list-inside text-white/55 space-y-1">
              <li>Breach these Terms</li>
              <li>Engage in fraudulent activity (including payment fraud or referral abuse)</li>
              <li>Use the platform to harm others or engage in illegal activity</li>
              <li>Attempt to circumvent usage limits or security measures</li>
            </ul>
            <p className="mt-2">You may delete your own account at any time. We will process deletion requests within 30 days. Financial records required by law will be retained for 5 years.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">11. Electronic Communications Act Compliance</h2>
            <p>This agreement is concluded electronically and is binding under the Electronic Communications and Transactions Act 25 of 2002 (ECTA). You agree that electronic communications constitute valid written notices for purposes of this agreement.</p>
            <p className="mt-2">Our full company registration details and registered address are available on request from <a href="mailto:legal@varsityos.co.za" className="text-teal-400 hover:text-teal-300">legal@varsityos.co.za</a>.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">12. Consumer Protection</h2>
            <p>Where you are a consumer as defined in the Consumer Protection Act 68 of 2008 (CPA), nothing in these Terms reduces or waives rights you have under the CPA. To lodge a CPA complaint contact the National Consumer Commission: <a href="https://www.thencc.gov.za" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:text-teal-300">www.thencc.gov.za</a>.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">13. Access to Information (PAIA)</h2>
            <p className="mb-2">
              Mirembe Muse (Pty) Ltd has compiled a Section 51 Manual under the <strong className="text-white/75">Promotion of Access to Information Act 2 of 2000 (&quot;PAIA&quot;)</strong>. This manual describes what records we hold, how to request access, applicable fees, and grounds for refusal.
            </p>
            <p className="text-white/55">
              To submit a PAIA request, download Form C from the Information Regulator, complete it, and email it with the R50 request fee to{' '}
              <a href="mailto:privacy@varsityos.co.za" className="text-teal-400 hover:text-teal-300">privacy@varsityos.co.za</a>.
              We respond within 30 days.
            </p>
            <p className="mt-2">
              <a href="/paia" className="text-teal-400 hover:text-teal-300 text-xs font-display font-bold">View PAIA Section 51 Manual →</a>
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">15. Governing Law and Disputes</h2>
            <p>These Terms are governed by the laws of South Africa. Any dispute shall be subject to the jurisdiction of the South African courts. We encourage resolution of disputes through good-faith negotiation before legal proceedings.</p>
            <p className="mt-2">For disputes under R200,000 you may approach the Small Claims Court. For larger disputes, the High Court of South Africa has jurisdiction.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">16. Changes to Terms</h2>
            <p>We may update these Terms. We will provide at least 30 days&apos; notice of material changes via email or prominent in-app notice. Continued use after the effective date constitutes acceptance. If you do not agree to the changes, you must stop using the platform and may request account deletion.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">17. Contact Us</h2>
            <div className="space-y-1 text-white/55">
              <p>General: <a href="mailto:hello@varsityos.co.za" className="text-teal-400 hover:text-teal-300">hello@varsityos.co.za</a></p>
              <p>Privacy: <a href="mailto:privacy@varsityos.co.za" className="text-teal-400 hover:text-teal-300">privacy@varsityos.co.za</a></p>
              <p>Legal: <a href="mailto:legal@varsityos.co.za" className="text-teal-400 hover:text-teal-300">legal@varsityos.co.za</a></p>
              <p>Support: <a href="mailto:support@varsityos.co.za" className="text-teal-400 hover:text-teal-300">support@varsityos.co.za</a></p>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
