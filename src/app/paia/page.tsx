import type { Metadata } from 'next'
import Link from 'next/link'
import { AmbientImage } from '@/components/ui/AmbientImage'

export const metadata: Metadata = {
  title: 'PAIA Manual — VarsityOS',
  description: 'Mirembe Muse (Pty) Ltd PAIA Section 51 Manual — Promotion of Access to Information Act 2 of 2000. Information Officer, request procedure, fees, and annual report.',
}

export default function PaiaPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-white" style={{ position: 'relative', overflowX: 'hidden' }}>
      <AmbientImage zone="abstract-wall" opacity={0.30} blurPx={2} saturation={1.4} />
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
          <h1 className="font-display font-black text-3xl text-white mb-2">PAIA Manual</h1>
          <p className="font-mono text-xs text-white">Section 51 Manual · Promotion of Access to Information Act 2 of 2000</p>
          <p className="font-mono text-xs text-white mt-1">Last updated: 14 June 2026 · Reporting year: 1 April 2025 – 31 March 2026</p>
        </div>

        <div className="space-y-8 font-mono text-sm leading-relaxed text-white">

          {/* Compliance Banner */}
          <div className="rounded-xl border border-sky-600/20 bg-sky-600/5 px-4 py-3">
            <p className="font-display font-bold text-sky-400 text-sm mb-1">Section 51 Manual — Private Body</p>
            <p className="text-white text-xs leading-relaxed">
              This manual is compiled by <strong className="text-white">Mirembe Muse (Pty) Ltd</strong> in terms of Section 51 of the Promotion of Access to Information Act 2 of 2000 (&quot;PAIA&quot;). It describes how members of the public may request access to records held by the company.
            </p>
          </div>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">1. Details of the Private Body</h2>
            <div className="space-y-1.5 text-white">
              <p><strong className="text-white">Company name:</strong> Mirembe Muse (Pty) Ltd</p>
              <p><strong className="text-white">Trading as:</strong> VarsityOS (varsityos.co.za)</p>
              <p><strong className="text-white">Company type:</strong> Private company registered in South Africa</p>
              <p><strong className="text-white">POPIA Registration No.:</strong> 2026-005658 (Registration Date: 3 April 2026)</p>
              <div className="mt-3 border-t border-white/10 pt-3">
                <p className="font-display font-bold text-white text-xs uppercase tracking-widest mb-2">Information Officer</p>
                <p><strong className="text-white">Name:</strong> Nandawula Kabali-Kagwa</p>
                <p><strong className="text-white">Appointed:</strong> 28 August 2025</p>
                <p><strong className="text-white">Email:</strong> <a href="mailto:privacy@mirembemuse.co.za" className="text-teal-400 hover:text-teal-300">privacy@mirembemuse.co.za</a></p>
                <p><strong className="text-white">Alternate email:</strong> <a href="mailto:privacy@varsityos.co.za" className="text-teal-400 hover:text-teal-300">privacy@varsityos.co.za</a></p>
                <p className="mt-2 text-white text-xs">PAIA requests submitted to the Information Officer must be addressed in writing to the above email addresses. Postal and physical address available on written request.</p>
              </div>
              <div className="mt-3 border-t border-white/10 pt-3">
                <p className="font-display font-bold text-white text-xs uppercase tracking-widest mb-2">Information Regulator (Supervising Authority)</p>
                <p>The Information Regulator of South Africa oversees PAIA and POPIA compliance.</p>
                <p className="mt-1">Website: <a href="https://www.inforeg.org.za" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:text-teal-300">www.inforeg.org.za</a></p>
                <p>Email: <a href="mailto:inforeg@justice.gov.za" className="text-teal-400 hover:text-teal-300">inforeg@justice.gov.za</a></p>
                <p>Tel: 010 023 5200</p>
                <p className="text-white text-xs mt-1">Physical: JD House, 27 Stiemens Street, Braamfontein, Johannesburg, 2001</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">2. PAIA Guide</h2>
            <p className="text-white">
              The Information Regulator has published a PAIA Guide describing how to use the Act to request records from public and private bodies. The Guide is available free of charge from:
            </p>
            <ul className="list-disc list-inside text-white mt-2 space-y-1">
              <li>The Information Regulator website: <a href="https://www.inforeg.org.za" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:text-teal-300">www.inforeg.org.za</a></li>
              <li>The PAIA Unit, Department of Justice and Constitutional Development</li>
              <li>Any Public Library in South Africa</li>
            </ul>
            <p className="mt-2 text-white text-xs">The Guide is available in all 11 official languages of South Africa.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">3. Records Available Without a PAIA Request</h2>
            <p className="mb-2 text-white">The following documents are publicly available and do not require a formal PAIA request:</p>
            <ul className="list-disc list-inside text-white space-y-1.5">
              <li>This PAIA Section 51 Manual (<a href="/paia" className="text-teal-400 hover:text-teal-300">varsityos.co.za/paia</a>)</li>
              <li>Privacy Policy (<a href="/privacy" className="text-teal-400 hover:text-teal-300">varsityos.co.za/privacy</a>)</li>
              <li>Terms and Conditions (<a href="/terms" className="text-teal-400 hover:text-teal-300">varsityos.co.za/terms</a>)</li>
              <li>Product pricing and subscription tiers (available on our website)</li>
              <li>POPIA Registration confirmation (available on request, no fee)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">4. Records Available for Inspection</h2>
            <p className="mb-2 text-white">The following categories of records are available for inspection subject to payment of the prescribed fee and submission of a valid Form C request:</p>
            <ul className="list-disc list-inside text-white space-y-1.5">
              <li>Company registration documents (CIPC)</li>
              <li>POPIA registration certificate (Information Regulator)</li>
              <li>General corporate records required to be available by law</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">5. Categories of Records Held</h2>
            <p className="mb-3 text-white">Mirembe Muse (Pty) Ltd holds the following categories of records in the course of operating VarsityOS:</p>

            <div className="space-y-3">
              {[
                {
                  cat: 'User Account Records',
                  items: ['Names and email addresses of registered users', 'Authentication credentials (hashed passwords — not recoverable)', 'Account creation and last-login dates', 'Subscription tier and payment status'],
                },
                {
                  cat: 'Academic & Personal Records',
                  items: ['University, faculty, year of study, and module information voluntarily entered by the user', 'Study tasks, deadlines, timetable entries, and exam schedules entered by the user', 'AI conversation history with Nova (stored only for paid subscribers)'],
                },
                {
                  cat: 'Financial Records (User-Entered)',
                  items: ['Monthly budget allocations and expense records entered by the user', 'NSFAS allowance amounts entered by the user', 'Savings goals and stokvel contribution records entered by the user'],
                },
                {
                  cat: 'Health & Wellness Records',
                  items: ['Sleep logs, mood entries, and fitness records voluntarily entered by the user', 'Wellness check-in responses'],
                },
                {
                  cat: 'Payment & Transaction Records',
                  items: ['Subscription payment history (amounts, dates, transaction IDs)', 'Payment status records from Paystack', 'Refund records'],
                },
                {
                  cat: 'Technical & Security Records',
                  items: ['Server access logs (IP address, request timestamps)', 'Error logs and crash reports', 'Security event records (failed logins, suspicious activity flags)'],
                },
                {
                  cat: 'Corporate Records',
                  items: ['Contracts and agreements with suppliers and service providers', 'Employee and contractor records', 'Internal financial statements and tax records'],
                },
              ].map(({ cat, items }) => (
                <div key={cat} className="border border-white/8 rounded-lg p-3">
                  <p className="font-display font-bold text-white text-xs mb-2">{cat}</p>
                  <ul className="list-disc list-inside text-white text-xs space-y-0.5">
                    {items.map(i => <li key={i}>{i}</li>)}
                  </ul>
                </div>
              ))}
            </div>

            <p className="mt-3 text-white text-xs">Note: records held by third-party processors (Supabase, Anthropic, Paystack, Vercel) on our behalf are subject to their own PAIA/data access regimes. We will assist with directing requests to the relevant party where appropriate.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">6. How to Submit a PAIA Request</h2>
            <p className="mb-3 text-white">To request access to records held by Mirembe Muse (Pty) Ltd, follow these steps:</p>

            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="font-display font-black text-teal-400 text-lg leading-none mt-0.5">01</span>
                <div>
                  <p className="font-display font-bold text-white text-sm">Obtain Form C</p>
                  <p className="text-white text-xs mt-0.5">Download the prescribed Form C from the Information Regulator website (<a href="https://www.inforeg.org.za" target="_blank" rel="noopener noreferrer" className="text-teal-400">inforeg.org.za</a>) or request it from our Information Officer at no charge.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="font-display font-black text-teal-400 text-lg leading-none mt-0.5">02</span>
                <div>
                  <p className="font-display font-bold text-white text-sm">Complete Form C</p>
                  <p className="text-white text-xs mt-0.5">Provide your full name, contact details, a description of the records you require, and the reason for the request. Be as specific as possible to enable us to locate the relevant records.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="font-display font-black text-teal-400 text-lg leading-none mt-0.5">03</span>
                <div>
                  <p className="font-display font-bold text-white text-sm">Pay the Request Fee (R50)</p>
                  <p className="text-white text-xs mt-0.5">A non-refundable request fee of <strong className="text-white">R50.00</strong> is payable before we are required to process your request (Section 54(1) of PAIA). See the fees schedule in Section 7 below.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="font-display font-black text-teal-400 text-lg leading-none mt-0.5">04</span>
                <div>
                  <p className="font-display font-bold text-white text-sm">Submit to Information Officer</p>
                  <p className="text-white text-xs mt-0.5">Email completed Form C and proof of fee payment to <a href="mailto:privacy@varsityos.co.za" className="text-teal-400">privacy@varsityos.co.za</a>. Mark the subject line: <strong className="text-white">PAIA Request — [Your Name]</strong>.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="font-display font-black text-teal-400 text-lg leading-none mt-0.5">05</span>
                <div>
                  <p className="font-display font-bold text-white text-sm">Response Timeline</p>
                  <p className="text-white text-xs mt-0.5">We will respond within <strong className="text-white">30 days</strong> of receipt of a valid request (Section 56 of PAIA). If we need more time, we may extend by a further 30 days and will notify you in writing. If your request is granted in part or refused, we will provide written reasons.</p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-amber-600/15 bg-amber-600/5 px-4 py-3">
              <p className="font-display font-bold text-amber-400 text-xs mb-1">Important: PAIA vs POPIA Rights</p>
              <p className="text-white text-xs">
                If you are requesting access to your <strong className="text-white">own</strong> personal information held by us, you may also exercise your rights under <strong className="text-white">POPIA Section 23</strong> by emailing <a href="mailto:privacy@varsityos.co.za" className="text-teal-400">privacy@varsityos.co.za</a> directly — no Form C or request fee required. See our <Link href="/privacy" className="text-teal-400">Privacy Policy</Link> for details.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">7. Prescribed Fees Schedule</h2>
            <p className="mb-3 text-white text-xs">Fees are prescribed by the Minister of Justice under Section 54 of PAIA. The following fees apply (as per PAIA Regulations, last amended 2021):</p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 pr-4 font-display font-bold text-white text-xs uppercase tracking-wider">Item</th>
                    <th className="text-right py-2 font-display font-bold text-white text-xs uppercase tracking-wider">Fee</th>
                  </tr>
                </thead>
                <tbody className="text-white">
                  <tr className="border-b border-white/5"><td className="py-2 pr-4">Request fee (non-refundable, payable upfront)</td><td className="py-2 text-right text-white">R 50.00</td></tr>
                  <tr className="border-b border-white/5"><td className="py-2 pr-4">Search, preparation, and reproduction — per hour (first hour free)</td><td className="py-2 text-right text-white">R 30.00/hr</td></tr>
                  <tr className="border-b border-white/5"><td className="py-2 pr-4">Photocopy / printout — per A4 page</td><td className="py-2 text-right text-white">R 1.10/page</td></tr>
                  <tr className="border-b border-white/5"><td className="py-2 pr-4">Electronic file (PDF or similar) — per file</td><td className="py-2 text-right text-white">R 7.50/file</td></tr>
                  <tr className="border-b border-white/5"><td className="py-2 pr-4">USB flash drive or other storage medium</td><td className="py-2 text-right text-white">Actual cost</td></tr>
                  <tr className="border-b border-white/5"><td className="py-2 pr-4">Postage (if records sent by post)</td><td className="py-2 text-right text-white">At cost</td></tr>
                  <tr><td className="py-2 pr-4">Deposit — 1/3 of estimated access fee (if search time exceeds 6 hrs)</td><td className="py-2 text-right text-white">As calculated</td></tr>
                </tbody>
              </table>
            </div>

            <p className="mt-3 text-white text-xs">
              Requesters who demonstrate they are unable to afford fees may apply for waiver in terms of Section 54(8) of PAIA. Indigent requesters (including students who meet the criteria) may request fee exemption by providing supporting documentation.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">8. Grounds for Refusal</h2>
            <p className="mb-3 text-white">We may refuse a PAIA request on the following grounds (Sections 63–70 of PAIA):</p>
            <ul className="space-y-2 list-disc list-inside text-white">
              <li>The records contain the personal information of a third party who has not consented to disclosure (s63)</li>
              <li>Disclosure would constitute an unreasonable invasion of privacy of a third party (s63)</li>
              <li>The records contain confidential third-party commercial information (s64)</li>
              <li>The records contain confidential communications between the company and its legal advisors (s65)</li>
              <li>Disclosure of the records would endanger the safety or health of an individual (s66)</li>
              <li>The records contain internal deliberative processes that, if disclosed, could harm the company&apos;s decision-making functions (s67–68)</li>
              <li>Disclosure is prohibited under another law (s70)</li>
              <li>The request is manifestly frivolous or vexatious, or the disclosure of records would be an abuse of the right of access (s45)</li>
            </ul>
            <p className="mt-3 text-white text-xs">
              Any refusal will be provided in writing with reasons. You have the right to appeal a refusal internally (to our Information Officer) and thereafter to seek review by the Information Regulator or the court.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">9. Internal Remedies and Appeals</h2>
            <div className="space-y-3 text-white">
              <p>If we refuse your request or do not respond within the prescribed period:</p>
              <ul className="list-disc list-inside space-y-1.5">
                <li><strong className="text-white">Internal appeal:</strong> Submit a written appeal to the Information Officer at <a href="mailto:privacy@varsityos.co.za" className="text-teal-400 hover:text-teal-300">privacy@varsityos.co.za</a> within 180 days of the decision</li>
                <li><strong className="text-white">Complaint to the Information Regulator:</strong> Lodge a complaint at <a href="https://www.inforeg.org.za" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:text-teal-300">inforeg.org.za</a></li>
                <li><strong className="text-white">Court application:</strong> Apply to the High Court for an order compelling disclosure under Section 82 of PAIA</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">10. Annual Report — 2025/2026</h2>
            <p className="mb-2 text-white text-xs">
              Reporting period: <strong className="text-white">1 April 2025 – 31 March 2026</strong> · Submitted to the Information Regulator per Section 32(2) of PAIA.
            </p>

            <div className="overflow-x-auto mt-3">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 pr-4 font-display font-bold text-white text-xs uppercase tracking-wider">Category</th>
                    <th className="text-right py-2 font-display font-bold text-white text-xs uppercase tracking-wider">Count</th>
                  </tr>
                </thead>
                <tbody className="text-white">
                  <tr className="border-b border-white/5"><td className="py-2 pr-4">Total PAIA requests received</td><td className="py-2 text-right text-white font-bold">0</td></tr>
                  <tr className="border-b border-white/5"><td className="py-2 pr-4">Requests granted in full</td><td className="py-2 text-right">0</td></tr>
                  <tr className="border-b border-white/5"><td className="py-2 pr-4">Requests granted in part</td><td className="py-2 text-right">0</td></tr>
                  <tr className="border-b border-white/5"><td className="py-2 pr-4">Requests refused</td><td className="py-2 text-right">0</td></tr>
                  <tr className="border-b border-white/5"><td className="py-2 pr-4">Requests withdrawn by requester</td><td className="py-2 text-right">0</td></tr>
                  <tr className="border-b border-white/5"><td className="py-2 pr-4">Requests deemed refused (no response in time)</td><td className="py-2 text-right">0</td></tr>
                  <tr className="border-b border-white/5"><td className="py-2 pr-4">Requests pending at year-end</td><td className="py-2 text-right">0</td></tr>
                  <tr className="border-b border-white/5"><td className="py-2 pr-4">Internal appeals lodged</td><td className="py-2 text-right">0</td></tr>
                  <tr className="border-b border-white/5"><td className="py-2 pr-4">Appeals upheld</td><td className="py-2 text-right">0</td></tr>
                  <tr><td className="py-2 pr-4">Referrals to the Information Regulator</td><td className="py-2 text-right">0</td></tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 rounded-lg border border-white/8 bg-white/3 px-4 py-3 text-white text-xs space-y-1">
              <p><strong className="text-white">Reporting entity:</strong> Mirembe Muse (Pty) Ltd (VarsityOS)</p>
              <p><strong className="text-white">Information Officer:</strong> Nandawula Kabali-Kagwa</p>
              <p><strong className="text-white">Signature date:</strong> 14 June 2026</p>
              <p><strong className="text-white">Next report due:</strong> On or before 31 May 2027 (for period 1 April 2026 – 31 March 2027)</p>
              <p className="pt-2 border-t border-white/8 text-white">
                This report was submitted to the Information Regulator in terms of Section 32(2) of the Promotion of Access to Information Act 2 of 2000. Mirembe Muse (Pty) Ltd became operational in August 2025 and received no PAIA requests during its first reporting year.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">11. Updates to This Manual</h2>
            <p className="text-white">
              This manual will be reviewed and updated at least annually. Material changes will be reflected with an updated &quot;Last updated&quot; date. Mirembe Muse (Pty) Ltd will update this manual within 30 days of any change to its structure, records held, or fees schedule. The current version is always available at <a href="/paia" className="text-teal-400 hover:text-teal-300">varsityos.co.za/paia</a>.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-white text-lg mb-3">12. Related Legal Documents</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/privacy" className="flex-1 rounded-lg border border-white/8 bg-white/3 px-4 py-3 hover:bg-white/5 transition-colors no-underline">
                <p className="font-display font-bold text-teal-400 text-sm">Privacy Policy</p>
                <p className="text-white text-xs mt-1">POPIA compliance, your data rights, Information Officer contact</p>
              </Link>
              <Link href="/terms" className="flex-1 rounded-lg border border-white/8 bg-white/3 px-4 py-3 hover:bg-white/5 transition-colors no-underline">
                <p className="font-display font-bold text-teal-400 text-sm">Terms &amp; Conditions</p>
                <p className="text-white text-xs mt-1">Platform rules, subscriptions, SA law compliance</p>
              </Link>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
