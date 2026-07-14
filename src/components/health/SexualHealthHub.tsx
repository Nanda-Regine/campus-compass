'use client'

import { useState } from 'react'
import { AmbientImage } from '@/components/ui/AmbientImage'

type Tab = 'hiv_prep' | 'emergency' | 'gbv' | 'stis' | 'contraception'

const TABS: { id: Tab; label: string }[] = [
  { id: 'hiv_prep', label: 'HIV & PrEP' },
  { id: 'emergency', label: 'Emergency' },
  { id: 'gbv', label: 'GBV Support' },
  { id: 'stis', label: 'STIs' },
  { id: 'contraception', label: 'Contraception' },
]

const ACCENT = '#f472b6'

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
      <h3 style={{ color: ACCENT, fontWeight: 700, fontSize: '1rem', marginBottom: '10px' }}>{title}</h3>
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>{children}</div>
    </div>
  )
}

function HotlineLink({ number, label, note }: { number: string; label: string; note?: string }) {
  const cleaned = number.replace(/\s/g, '')
  return (
    <a
      href={`tel:${cleaned}`}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(244,114,182,0.08)', border: '1px solid rgba(244,114,182,0.2)', borderRadius: '12px', padding: '14px 16px', marginBottom: '10px', textDecoration: 'none', color: 'var(--text-secondary)' }}
    >
      <div>
        <div style={{ fontWeight: 700, color: ACCENT, fontSize: '1rem' }}>{label}</div>
        {note && <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>{note}</div>}
      </div>
      <div style={{ color: ACCENT, fontWeight: 700, fontSize: '1.1rem' }}>{number}</div>
    </a>
  )
}

function HivPrepTab() {
  return (
    <div>
      <Card title="HIV in SA">
        South Africa has the world&apos;s largest HIV epidemic — approximately 7.8 million people are living with HIV. With modern treatment, people live full, healthy lives. <strong style={{ color: ACCENT }}>Undetectable = Untransmittable (U=U)</strong>: if someone is on treatment and undetectable, they cannot transmit HIV sexually. Modern ARVs are a single pill taken daily.
      </Card>
      <Card title="Testing">
        Get tested every 6 months if you are sexually active. Campus clinics offer <strong style={{ color: ACCENT }}>free, confidential</strong> testing with rapid results in 20 minutes. Knowing your status is power — for you and your partners.
      </Card>
      <Card title="PrEP (Pre-Exposure Prophylaxis)">
        A daily pill that is <strong style={{ color: ACCENT }}>99% effective</strong> at preventing HIV. FREE at public clinics and most campus health centres. Ask for <strong style={{ color: '#fbbf24' }}>"TLD"</strong> — Tenofovir/Lamivudine/Dolutegravir. You do not need to be HIV-positive to take PrEP. It is for HIV-negative people who want protection.
      </Card>
      <Card title="Free Access — No Cost, No Judgment">
        All ARVs, PrEP, and HIV testing are <strong style={{ color: ACCENT }}>FREE</strong> at South African public clinics under the national health programme. No cost. No prescription fee. No judgment. Simply go to any public clinic or campus health centre and ask.
      </Card>
    </div>
  )
}

function EmergencyTab() {
  return (
    <div>
      <Card title="Emergency Contraception">
        Prevents pregnancy if taken within <strong style={{ color: ACCENT }}>72 hours</strong> of unprotected sex. More effective the sooner you take it.
        <ul style={{ marginTop: '10px', paddingLeft: '18px' }}>
          <li style={{ marginBottom: '8px' }}><strong style={{ color: '#fbbf24' }}>Postinor-2</strong> (levonorgestrel): available at any pharmacy for approximately R60 — no prescription needed. Also free at public clinics.</li>
          <li style={{ marginBottom: '8px' }}><strong style={{ color: '#a78bfa' }}>Ella</strong> (ulipristal): effective up to <strong style={{ color: ACCENT }}>120 hours</strong> after sex. Requires a prescription. More effective than Postinor-2 for larger body weight.</li>
          <li><strong style={{ color: '#34d399' }}>Copper IUD</strong>: most effective option at &gt;99%. Inserted by a doctor within 5 days. Also provides ongoing contraception for up to 10 years.</li>
        </ul>
      </Card>
      <Card title="Where to Get It">
        <ul style={{ paddingLeft: '18px' }}>
          <li style={{ marginBottom: '6px' }}>Any pharmacy — no prescription for Postinor-2</li>
          <li style={{ marginBottom: '6px' }}>Any public clinic — free of charge</li>
          <li style={{ marginBottom: '6px' }}>Marie Stopes: <a href="tel:0800117785" style={{ color: ACCENT }}>0800 11 77 85</a></li>
          <li>Campus health services</li>
        </ul>
      </Card>
      <Card title="EC is NOT the Same as Abortion">
        Emergency contraception <strong style={{ color: ACCENT }}>prevents fertilisation or implantation</strong>. It does not end an existing pregnancy. If you are already pregnant, EC will not affect the pregnancy.
      </Card>
    </div>
  )
}

const THUTHUZELA_CENTRES = [
  { city: 'Johannesburg', hospital: 'Charlotte Maxeke Hospital', phone: '011 488 4911' },
  { city: 'Soweto', hospital: 'Chris Hani Baragwanath Hospital', phone: '011 933 8000' },
  { city: 'Pretoria', hospital: 'Steve Biko Academic Hospital', phone: '012 354 1000' },
  { city: 'Cape Town', hospital: 'Groote Schuur Hospital', phone: '021 404 9111' },
  { city: 'Durban', hospital: 'Addington Hospital', phone: '031 327 2000' },
  { city: 'East London', hospital: 'Frere Hospital', phone: '043 709 2111' },
  { city: 'Port Elizabeth', hospital: 'Dora Nginza Hospital', phone: '041 406 4111' },
  { city: 'Bloemfontein', hospital: 'Universitas Hospital', phone: '051 405 1911' },
]

function GbvTab() {
  return (
    <div>
      <div style={{ background: 'rgba(244,114,182,0.1)', border: '1px solid rgba(244,114,182,0.3)', borderRadius: '16px', padding: '20px', marginBottom: '20px', textAlign: 'center' }}>
        <div style={{ color: ACCENT, fontWeight: 700, fontSize: '1.2rem', marginBottom: '6px' }}>You are believed.</div>
        <div style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '1rem' }}>This is not your fault.</div>
      </div>

      <Card title="First 72 Hours — What You Can Do">
        <ol style={{ paddingLeft: '18px' }}>
          <li style={{ marginBottom: '10px' }}>Get to a <strong style={{ color: ACCENT }}>safe place</strong> first.</li>
          <li style={{ marginBottom: '10px' }}>You do <strong style={{ color: ACCENT }}>NOT</strong> have to report to the police — that is entirely your choice.</li>
          <li style={{ marginBottom: '10px' }}>Medical care is critical within 72 hours for <strong style={{ color: '#fbbf24' }}>PEP</strong> (post-exposure HIV prevention) — FREE at any public hospital. It must be started within 72 hours to be effective.</li>
          <li style={{ marginBottom: '10px' }}><strong style={{ color: ACCENT }}>Thuthuzela Care Centres</strong> are one-stop centres that provide medical care, counselling, and police services in one place — you can access medical care without reporting if you prefer.</li>
          <li>Simply say: <em style={{ color: 'var(--text-tertiary)' }}>"I need medical care."</em> You will be helped.</li>
        </ol>
      </Card>

      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ color: ACCENT, fontWeight: 700, fontSize: '1rem', marginBottom: '12px' }}>Thuthuzela Care Centres</h3>
        <div className="grid grid-cols-1 gap-3">
          {THUTHUZELA_CENTRES.map(c => (
            <div key={c.city} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{c.city}</div>
                <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>{c.hospital}</div>
              </div>
              <a href={`tel:${c.phone.replace(/\s/g, '')}`} style={{ color: ACCENT, fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>{c.phone}</a>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 style={{ color: ACCENT, fontWeight: 700, fontSize: '1rem', marginBottom: '12px' }}>Emergency Hotlines</h3>
        <HotlineLink number="0800 428 428" label="GBV Command Centre" note="24/7 — FREE" />
        <HotlineLink number="021 447 9762" label="Rape Crisis" note="24/7" />
        <HotlineLink number="011 642 4345" label="POWA" />
        <HotlineLink number="10111" label="SAPS" note="Police emergency" />
        <HotlineLink number="010 590 5920" label="TEARS Foundation" />
        <HotlineLink number="0800 055 555" label="Childline" note="Under 18" />
        <HotlineLink number="0800 11 77 85" label="Marie Stopes" />
      </div>
    </div>
  )
}

const STIS = [
  { name: 'Chlamydia', color: '#a78bfa', body: 'Often no symptoms at all — which is why regular testing matters. Easily treated with a short course of antibiotics. Get tested if you are sexually active, even with no symptoms.' },
  { name: 'Gonorrhoea', color: '#fbbf24', body: 'Symptoms include discharge and burning during urination. Treated with antibiotics. Drug-resistant strains are increasing in SA — always complete the full course of treatment.' },
  { name: 'Syphilis', color: '#fb923c', body: 'Causes sores and rash. Treatable at any stage with penicillin. Important to test during pregnancy — syphilis can be passed to an unborn baby and cause serious harm.' },
  { name: 'Herpes (HSV)', color: '#f472b6', body: 'Extremely common. No cure, but very manageable with antiviral medication. Having herpes does not define you or limit your relationships. Millions of people live full lives with HSV.' },
  { name: 'HPV', color: '#34d399', body: 'The most common STI globally. Most infections clear naturally without any treatment. Some strains cause genital warts; others are linked to certain cancers. The Cervarix vaccine is available free for young women in the SA public health system.' },
]

function StisTab() {
  return (
    <div>
      <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '16px', marginBottom: '20px', color: 'var(--text-tertiary)', fontSize: '0.875rem', lineHeight: '1.6' }}>
        STIs are common and most are easily treated. Having an STI does not say anything about your character. Regular testing is a form of self-care and care for your partners.
      </div>
      {STIS.map(sti => (
        <div key={sti.name} style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid rgba(255,255,255,0.06)`, borderRadius: '16px', padding: '18px', marginBottom: '14px', borderLeft: `3px solid ${sti.color}` }}>
          <div style={{ color: sti.color, fontWeight: 700, fontSize: '1rem', marginBottom: '8px' }}>{sti.name}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.6' }}>{sti.body}</div>
        </div>
      ))}
    </div>
  )
}

function ContraceptionTab() {
  return (
    <div>
      <div style={{ background: 'rgba(244,114,182,0.08)', border: '1px solid rgba(244,114,182,0.2)', borderRadius: '16px', padding: '14px 18px', marginBottom: '20px', color: ACCENT, fontWeight: 600, fontSize: '0.9rem' }}>
        All of the following are FREE at South African public clinics. You do not need money or a prescription.
      </div>
      <Card title="Condoms (Male + Female)">
        The <strong style={{ color: ACCENT }}>only method that also prevents STIs and HIV</strong>. Available free at clinics, campus health centres, and many student residences. Male condoms are also free at most pharmacies through the public health programme.
      </Card>
      <Card title="Contraceptive Pill">
        Free at public clinics. Taken daily at the same time. Highly effective when used correctly. Good for period regulation and reducing cramps as well as preventing pregnancy.
      </Card>
      <Card title="Depo Injection">
        An injection given every 3 months. Free at any public clinic. A popular choice for students — simple to manage and highly effective. No daily pill to remember.
      </Card>
      <Card title="Implant (Implanon)">
        A small rod inserted under the skin of your upper arm. Lasts <strong style={{ color: ACCENT }}>3 years</strong>. Free at public clinics. The most convenient long-term option — once inserted you do not need to think about contraception. Can be removed at any time.
      </Card>
      <Card title="IUD (Intrauterine Device)">
        Copper or hormonal options. Inserted by a healthcare provider. Free at clinics. Copper IUD lasts up to 10 years; hormonal IUD 5 years. Over 99% effective. Can also be used as emergency contraception if inserted within 5 days.
      </Card>
      <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '14px 18px', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
        Campus health centres at most South African universities also offer free contraception. Visit your campus clinic or student health services for a confidential consultation.
      </div>
    </div>
  )
}

export default function SexualHealthHub({ userId }: { userId: string | null }) {
  const [activeTab, setActiveTab] = useState<Tab>('hiv_prep')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '0 0 80px 0', position: 'relative', overflowX: 'hidden' }}>
      <AmbientImage zone="wellness" opacity={0.32} blurPx={2} saturation={1.4} />
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 16px' }}>
        <div style={{ padding: '28px 0 20px' }}>
          <h1 style={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: '1.5rem', marginBottom: '6px' }}>Sexual & Reproductive Health</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Confidential information. All care described is free at public clinics.</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '16px', scrollbarWidth: 'none' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flexShrink: 0,
                padding: '8px 16px',
                borderRadius: '20px',
                border: activeTab === tab.id ? 'none' : '1px solid rgba(255,255,255,0.1)',
                background: activeTab === tab.id ? ACCENT : 'rgba(255,255,255,0.07)',
                color: activeTab === tab.id ? '#0a0a0f' : 'var(--text-tertiary)',
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: '0.8rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div>
          {activeTab === 'hiv_prep' && <HivPrepTab />}
          {activeTab === 'emergency' && <EmergencyTab />}
          {activeTab === 'gbv' && <GbvTab />}
          {activeTab === 'stis' && <StisTab />}
          {activeTab === 'contraception' && <ContraceptionTab />}
        </div>

        <div style={{ marginTop: '32px', padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textAlign: 'center', lineHeight: '1.5' }}>
            This is educational information. In a medical emergency call 10111 or go to your nearest emergency room.
          </p>
        </div>
      </div>
    </div>
  )
}
