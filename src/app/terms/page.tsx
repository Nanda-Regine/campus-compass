import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'VarsityOS Terms and Conditions of Use — South African law compliant.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#080f0e] text-white/80">
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
          <h1 className="font-display font-black text-3xl text-white mb-2">Terms &amp; Conditions</h1>
          <p className="font-mono text-xs text-white/30">Last updated: 19 March 2026 · Governed by the laws of South Africa</p>
        </div>

        <div className="space-y-8 font-mono text-sm leading-relaxed text-white/65">

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
            <p>VarsityOS is a digital student support platform providing tools including academic planning, budget tracking, AI-powered assistance (Nova), meal planning, group assignment management, and part-time work management.</p>
            <p className="mt-2">The platform is offered on a freemium basis:</p>
            <ul className="list-disc list-inside text-white/55 mt-1 space-y-1">
              <li><strong className="text-white/75">Free tier:</strong> Core features with 10 Nova AI messages per month</li>
              <li><strong className="text-white/75">Scholar (R39/month):</strong> 75 Nova messages per month plus AI Recipe Generator and priority support</li>
              <li><strong className="text-white/75">Premium (R79/month):</strong> 200 Nova messages per month, all Scholar features, CSV data export, and early access to new features</li>
            </ul>
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
              <li>Nothing Nova says constitutes professional mental health advice, financial advice, or legal advice</li>
              <li>In a mental health emergency, call SADAG (0800 21 4446) or your university counselling centre — do not rely solely on Nova</li>
              <li>Financial information provided by Nova is for general guidance only — consult a qualified financial advisor for important decisions</li>
              <li>AI responses may contain errors. Always verify important information from official sources</li>
              <li>Nova uses Anthropic&apos;s Claude AI — by using Nova you accept Anthropic&apos;s terms of service</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">5. Payments and Subscriptions</h2>
            <p className="mb-2">Premium subscriptions are processed by <strong className="text-white">PayFast (DPO PayGate (Pty) Ltd)</strong>, a registered payment service provider in South Africa.</p>
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
              <li>Referral credits are bonus Nova messages, not cash or real premium status</li>
              <li>Credits are awarded only when a referred user successfully creates and verifies an account</li>
              <li>Each user may only benefit from one referral credit (as a referred user)</li>
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
            <p>We aim for 99% uptime but do not guarantee uninterrupted service. Scheduled maintenance will be announced in advance where possible. We are not responsible for downtime caused by third-party providers (Supabase, Vercel, Anthropic, PayFast) or events outside our reasonable control (force majeure).</p>
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
            <h2 className="font-display font-bold text-white text-lg mb-3">13. Governing Law and Disputes</h2>
            <p>These Terms are governed by the laws of South Africa. Any dispute shall be subject to the jurisdiction of the South African courts. We encourage resolution of disputes through good-faith negotiation before legal proceedings.</p>
            <p className="mt-2">For disputes under R200,000 you may approach the Small Claims Court. For larger disputes, the High Court of South Africa has jurisdiction.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">14. Changes to Terms</h2>
            <p>We may update these Terms. We will provide at least 30 days&apos; notice of material changes via email or prominent in-app notice. Continued use after the effective date constitutes acceptance. If you do not agree to the changes, you must stop using the platform and may request account deletion.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">15. Contact Us</h2>
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
