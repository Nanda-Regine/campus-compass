import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'VarsityOS Terms and Conditions of Use',
}

export default function TermsPage() {
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
          <h1 className="font-display font-black text-3xl text-white mb-2">Terms &amp; Conditions</h1>
          <p className="font-mono text-xs text-white/30">Last updated: 10 March 2026 · Effective immediately</p>
        </div>

        <div className="space-y-8 font-mono text-sm leading-relaxed text-white/65">

          <section>
            <h2 className="font-display font-bold text-base text-white mb-3">1. About These Terms</h2>
            <p>
              These Terms and Conditions (&ldquo;Terms&rdquo;) govern your use of VarsityOS, a mobile web application
              (&ldquo;the App&rdquo;) operated by <strong className="text-white/85">Mirembe Muse (Pty) Ltd</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;), a company registered in South Africa.
            </p>
            <p className="mt-3">
              By creating an account or using the App, you agree to these Terms in full. If you do not agree, please do not
              use VarsityOS.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-base text-white mb-3">2. Who Can Use VarsityOS</h2>
            <p>You may use VarsityOS if you:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1.5">
              <li>Are at least 13 years old.</li>
              <li>Are a student or prospective student at a South African university or TVET college.</li>
              <li>Provide accurate registration information.</li>
              <li>Agree to use the App only for lawful purposes.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-base text-white mb-3">3. Your Account</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials. Notify us immediately at{' '}
              <a href="mailto:hello@mirembemuse.co.za" className="text-teal-400 hover:text-teal-300">hello@mirembemuse.co.za</a>{' '}
              if you suspect unauthorised access to your account.
            </p>
            <p className="mt-3">
              We reserve the right to suspend or terminate accounts that violate these Terms or that have been inactive for
              more than 12 months.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-base text-white mb-3">4. Free vs. Premium Access</h2>
            <p>VarsityOS offers a free tier and a Premium tier.</p>
            <div className="mt-3 space-y-3">
              <div>
                <p className="text-white/85 font-bold">Free tier includes:</p>
                <ul className="list-disc ml-5 mt-1 space-y-1">
                  <li>Study planner (tasks, timetable, exams, modules)</li>
                  <li>Budget tracker and expense logging</li>
                  <li>7-day meal planner</li>
                  <li>10 Nova AI messages per month</li>
                </ul>
              </div>
              <div>
                <p className="text-white/85 font-bold">Premium tier adds:</p>
                <ul className="list-disc ml-5 mt-1 space-y-1">
                  <li>Unlimited Nova AI conversations</li>
                  <li>AI Recipe Generator</li>
                  <li>AI Budget Coach</li>
                  <li>AI Study Plans &amp; Exam Prep</li>
                  <li>CSV Export Reports</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-display font-bold text-base text-white mb-3">5. Payments &amp; Refunds</h2>
            <p>
              Premium plans are <strong className="text-white/85">once-off payments</strong> — there is no automatic
              renewal or subscription billing. You choose a plan duration (1 month or 3 months) and pay once. Your Premium
              access expires at the end of that period.
            </p>
            <p className="mt-3">
              All payments are processed securely by <strong className="text-white/85">PayFast</strong>, a South African
              payment gateway. We do not store your card details.
            </p>
            <p className="mt-3">
              <strong className="text-white/85">Refund policy:</strong> Due to the digital nature of the service and immediate
              access to Premium features upon payment, we do not offer refunds once Premium access has been activated. If you
              experience a technical issue that prevents you from accessing Premium features you paid for, contact us within
              7 days at{' '}
              <a href="mailto:hello@mirembemuse.co.za" className="text-teal-400 hover:text-teal-300">hello@mirembemuse.co.za</a>{' '}
              and we will investigate and resolve it.
            </p>
            <p className="mt-3">
              Prices are in South African Rand (ZAR) and inclusive of VAT where applicable.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-base text-white mb-3">6. Nova AI Companion — Important Disclaimer</h2>
            <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-4 mb-3">
              <p className="text-amber-300/90 text-xs leading-relaxed">
                <strong>Nova is an AI assistant, not a mental health professional.</strong> Conversations with Nova are
                for informational and emotional support purposes only. Nova is not a substitute for professional
                psychological, psychiatric, or medical advice, diagnosis, or treatment.
              </p>
            </div>
            <p>
              If you are in crisis or need urgent support, please contact:
            </p>
            <ul className="list-disc ml-5 mt-2 space-y-1.5">
              <li><strong className="text-white/85">SADAG (South African Depression and Anxiety Group):</strong> 0800 456 789 (24-hour)</li>
              <li><strong className="text-white/85">Lifeline SA:</strong> 0861 322 322</li>
              <li><strong className="text-white/85">Emergency services:</strong> 10111 (Police) / 10177 (Ambulance)</li>
            </ul>
            <p className="mt-3">
              Nova automatically surfaces crisis helpline information when distress signals are detected in your messages.
              This is a safety feature, not a diagnosis.
            </p>
            <p className="mt-3">
              Nova conversations are processed via the <strong className="text-white/85">Anthropic Claude API</strong>.
              By using Nova, you consent to your messages being sent to Anthropic for processing in accordance with
              Anthropic&apos;s usage policies. We do not use your Nova conversations to train AI models.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-base text-white mb-3">7. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1.5">
              <li>Use the App to harass, threaten, or harm others.</li>
              <li>Attempt to circumvent Premium access restrictions.</li>
              <li>Reverse-engineer, scrape, or exploit the App&apos;s AI features at scale.</li>
              <li>Share your account credentials with others.</li>
              <li>Use the App for any unlawful purpose under South African law.</li>
              <li>Upload malicious code or attempt to disrupt the App&apos;s infrastructure.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-base text-white mb-3">8. Intellectual Property</h2>
            <p>
              All content, design, code, and branding in VarsityOS is owned by Mirembe Muse (Pty) Ltd or its licensors.
              You may not copy, redistribute, or commercialise any part of the App without written permission.
            </p>
            <p className="mt-3">
              Content you create within the App (tasks, notes, budgets, meal plans) remains yours. You grant us a limited,
              non-exclusive licence to store and process this content solely to provide you with the service.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-base text-white mb-3">9. Service Availability</h2>
            <p>
              We aim for high availability but cannot guarantee uninterrupted access. The App may be unavailable during
              maintenance windows, load shedding events affecting our infrastructure, or circumstances beyond our control.
            </p>
            <p className="mt-3">
              AI-powered features depend on third-party APIs (Anthropic). Their availability affects these features. We will
              not issue refunds due to temporary third-party API outages.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-base text-white mb-3">10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by South African law, Mirembe Muse (Pty) Ltd shall not be liable for:
            </p>
            <ul className="list-disc ml-5 mt-2 space-y-1.5">
              <li>Loss of data due to circumstances outside our reasonable control.</li>
              <li>Decisions made based on AI-generated content (budgets, study plans, recipe costs).</li>
              <li>Financial loss resulting from inaccurate AI outputs.</li>
              <li>Harm arising from reliance on Nova&apos;s responses instead of professional advice.</li>
            </ul>
            <p className="mt-3">
              Our total liability to you for any claim shall not exceed the amount you paid for Premium access in the
              preceding 3 months.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-base text-white mb-3">11. Governing Law</h2>
            <p>
              These Terms are governed by the laws of the Republic of South Africa. Any disputes shall be subject to the
              exclusive jurisdiction of the courts of South Africa.
            </p>
            <p className="mt-3">
              The Consumer Protection Act 68 of 2008 and the Protection of Personal Information Act 4 of 2013 (POPIA)
              apply where relevant.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-base text-white mb-3">12. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify you of significant changes via email or an
              in-app notice at least 14 days before they take effect. Continued use of the App after changes constitutes
              acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-base text-white mb-3">13. Contact Us</h2>
            <p>For any questions about these Terms:</p>
            <div className="mt-3 space-y-1">
              <p><strong className="text-white/85">Mirembe Muse (Pty) Ltd</strong></p>
              <p>East London, Eastern Cape, South Africa</p>
              <p>
                Email:{' '}
                <a href="mailto:hello@mirembemuse.co.za" className="text-teal-400 hover:text-teal-300">
                  hello@mirembemuse.co.za
                </a>
              </p>
              <p>
                Website:{' '}
                <a href="https://creativelynanda.co.za" className="text-teal-400 hover:text-teal-300" target="_blank" rel="noreferrer">
                  creativelynanda.co.za
                </a>
              </p>
            </div>
          </section>

        </div>

        <div className="mt-12 pt-6 border-t border-white/8 flex flex-wrap gap-4 justify-between items-center">
          <Link href="/privacy" className="font-mono text-xs text-teal-400/70 hover:text-teal-400 transition-colors">
            Privacy Policy →
          </Link>
          <Link href="/" className="font-mono text-xs text-white/30 hover:text-white/60 transition-colors">
            Back to VarsityOS
          </Link>
        </div>
      </div>
    </div>
  )
}
