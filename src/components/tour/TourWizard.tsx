'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Lang = 'en' | 'zu' | 'xh' | 'af' | 'st' | 'tn'

const LANG_LABELS: Record<Lang, string> = {
  en: 'English', zu: 'isiZulu', xh: 'isiXhosa', af: 'Afrikaans', st: 'Sesotho', tn: 'Setswana',
}

interface TourStep { emoji: string; section: string; title: string; body: string; features: string[] }
interface LangPack { chooseLang: string; continueBtn: string; next: string; back: string; skip: string; done: string; steps: TourStep[] }

const CONTENT: Record<Lang, LangPack> = {
  en: {
    chooseLang: 'Choose your language', continueBtn: 'Continue in English',
    next: 'Next →', back: '← Back', skip: 'Skip tour', done: 'Enter VarsityOS →',
    steps: [
      { emoji: '📚', section: 'ACADEMIC', title: 'Study — Your Academic Brain',
        body: 'Everything for your studies in one room. Timetable, Pomodoro timers, Grades, Flashcards (spaced repetition), Exam Readiness, Attendance, and AI-matched Study Pods.',
        features: ['14 study tools in one tab', 'AI-matched study partners', 'Exam countdown & readiness score'] },
      { emoji: '💰', section: 'MONEY', title: 'Budget & Stokvel — Your Financial OS',
        body: 'Track every rand of your NSFAS allowance. Set categories, log expenses, see your burn rate. Join a Stokvel to save collectively with classmates — community banking at its best.',
        features: ['NSFAS allowance tracking', 'Stokvel community savings', 'Bursary & scholarship finder'] },
      { emoji: '🏡', section: 'LIFE', title: 'Life OS — Body, Safety & Wellbeing',
        body: 'Log meals with SA nutritional data, track sleep debt, build fitness habits, calm your nervous system in Regulate. Share your live location with friends for walk-home safety.',
        features: ['Meal & nutrition logging', 'Sleep & fitness tracking', 'Walk-home safety alerts'] },
      { emoji: '🚀', section: 'CAREER', title: 'Career & Growth — Your Future Path',
        body: 'Browse SA job listings, track your shifts in Work, build your business in Launch Pad. The Skills Academy teaches in-demand digital skills through bite-sized courses.',
        features: ['SA job board & applications', 'Hustle & business tracker', 'Digital Skills Academy'] },
      { emoji: '🤝', section: 'COMMUNITY', title: 'Community — Your People',
        body: 'The Social feed shows what\'s happening across campus. Find textbooks in Marketplace, get peer tutoring, share notes, report lost items, and stay updated via Broadcasts.',
        features: ['Campus social feed & events', 'Peer tutoring & notes sharing', 'Marketplace & Lost+Found'] },
      { emoji: '✨', section: 'NOVA AI', title: 'Nova — Your Personal AI',
        body: 'Nova knows your modules, finances, schedule, and wellbeing. Ask her anything — she gives advice in your context, not generic internet answers. She speaks your language.',
        features: ['Context-aware SA advice', 'Answers about your own data', 'Voice mode available'] },
    ],
  },
  zu: {
    chooseLang: 'Khetha ulimi lwakho', continueBtn: 'Qhubeka nge-isiZulu',
    next: 'Okulandelayo →', back: '← Emuva', skip: 'Yeqa uhambo', done: 'Ngena ku-VarsityOS →',
    steps: [
      { emoji: '📚', section: 'IZIFUNDO', title: 'Isifundo — Ubuchopho Bakho',
        body: 'Konke kwizifundo zakho endaweni eyodwa. Isikhathi, Pomodoro, Amanqaku, Ama-Flashcard, Ukulungiselela Izivivinyo, Ukuvaleleka, ne-Study Pods nge-AI.',
        features: ['Amathuluzi angu-14 ezifundweni', 'Iziqhwaga zokufunda ze-AI', 'Ikhawunta yezivivinyo'] },
      { emoji: '💰', section: 'IMALI', title: 'Isabelomali & Stokvel',
        body: 'Landelela i-rand ngayinye ye-NSFAS. Hlela izindleko, qakula izikhwama, bona izinga lenkokhelo. Joyina i-Stokvel ukonga nabane.',
        features: ['Ukuphatha i-NSFAS', 'Ukonga kwe-Stokvel', 'Umtholampilo we-Bursary'] },
      { emoji: '🏡', section: 'UKUPHILA', title: 'I-OS Yokuphila — Impilo Yakho',
        body: 'Bhala ukudla ngedatha yezokudla yase-SA, landela ukuntula kobuthongo, yenza imikhuba yokuzivocavoca, futhi unakekele isimo sakho se-nervous system.',
        features: ['Ukubhala ukudla nokudla', 'Ukulandela ukulala', 'Izexwayiso zokuphepha'] },
      { emoji: '🚀', section: 'UMSEBENZI', title: 'Imisebenzi & Ukukhula',
        body: 'Phequlula izithupha zemisebenzi yase-SA, qophela izigi zakho, sakhe ibhizinisi lakho. I-Skills Academy ifundisa amakhono edijithali adingekayo.',
        features: ['Ukubheka imisebenzi yase-SA', 'Ukulandela ibhizinisi', 'I-Digital Skills Academy'] },
      { emoji: '🤝', section: 'UMPHAKATHI', title: 'Umphakathi — Abantu Bakho',
        body: 'Ukulandelela kwe-Social kukubonisa okuenzeka e-campus. Thola futhi uthengise izincwadi, fumana umfundisi wabalinganayo, wabelane ngamanothi akho.',
        features: ['Izindaba ze-campus', 'Ukufundiswa nokuabelana', 'Ukuthenga ne-Lost+Found'] },
      { emoji: '✨', section: 'I-NOVA AI', title: 'I-Nova — I-AI Yakho',
        body: 'I-Nova iyazi izihloko zakho, izimali, uhlelo lwezikhathi, nempilo. Buza noma yini — izonikeza izeluleko ngomongo wakho, hhayi izimpendulo zomthi wekasi.',
        features: ['Izeluleko ezinawo umongo', 'Izimpendulo mayelana nedatha yakho', 'Ikhuluma izilimi zase-SA'] },
    ],
  },
  xh: {
    chooseLang: 'Khetha ulwimi lwakho', continueBtn: 'Qhubeka nge-isiXhosa',
    next: 'Okulandelayo →', back: '← Emva', skip: 'Yeyula uhambo', done: 'Ngena ku-VarsityOS →',
    steps: [
      { emoji: '📚', section: 'ISIFUNDO', title: 'Isifundo — Ubuchopho Bakho',
        body: 'Yonke into yezifundo zakho kwigumbi elinye. Igatya lokuFunda, Pomodoro, Amanqaku, Ikarti, UkuLungisa Iviwe, UkuMana, ne-Study Pods.',
        features: ['Izixhobo eziyi-14 zokufunda', 'Abalingane bokufunda be-AI', 'Ukubala iviwe'] },
      { emoji: '💰', section: 'IMALI', title: 'Isabelomali & Stokvel',
        body: 'Landela rand nganye ye-NSFAS yakho. Beka iindidi, bhala iindleko, ubone izinga lokuphuma. Joyina i-Stokvel ukonga kunye nabalingane bakho.',
        features: ['Ukulawula i-NSFAS', 'Ukonga kwe-Stokvel', 'Umfunzi we-Bursary'] },
      { emoji: '🏡', section: 'UBOMI', title: 'I-OS yoBomi — Impilo Yakho',
        body: 'Bhala ukutya ngeedatha zokutya zase-SA, landela ikho-la boroko, yakhela imikhwa yokuzilolonga, futhi zikhulule kwigumbi le-Regulate.',
        features: ['Ukubhala ukutya', 'Ukuqaphela boroko', 'Iingxaki zokhuseleko'] },
      { emoji: '🚀', section: 'UMSEBENZI', title: 'Umsebenzi & Ukukhula',
        body: 'Khangela imisebenzi yase-SA, beka amashifti akho, futhi wakhe ishishini lakho kwi-Launch Pad. I-Skills Academy ifundisa izakhono zedijithali.',
        features: ['Ukukhangela imisebenzi', 'Ukuphatha ishishini', 'I-Digital Skills Academy'] },
      { emoji: '🤝', section: 'ULUNTU', title: 'Uluntu — Abantu Bakho',
        body: 'I-Social feed ikubonisa okwenzekayo ekhampasini. Fumana uthengise izincwadi kwi-Marketplace, fumana umfundisi wabalinganayo, wabelane ngeenkcukacha zakho.',
        features: ['I-feed yobomi ekhampasini', 'Ukufundisana nokuarolelana', 'Ukuthenga ne-Lost+Found'] },
      { emoji: '✨', section: 'I-NOVA AI', title: 'I-Nova — I-AI Yakho',
        body: 'I-Nova iyazi izifundo zakho, imali, ipolisi lixesha, nempilo. Buza nantoni na — iza kunika ingcebiso ngomxholo wakho.',
        features: ['Ingcebiso enomxholo', 'Iimpendulo ngeedatha zakho', 'Ithetha iilwimi zase-SA'] },
    ],
  },
  af: {
    chooseLang: 'Kies jou taal', continueBtn: 'Gaan voort in Afrikaans',
    next: 'Volgende →', back: '← Terug', skip: 'Slaan toer oor', done: 'Gaan na VarsityOS →',
    steps: [
      { emoji: '📚', section: 'AKADEMIE', title: 'Studies — Jou Akademiese Brein',
        body: 'Alles vir jou studies in een kamer. Rooster, Pomodoro, Punte, Flitskaarte, Eksamengereedheid, Bywoning, en AI-gepaarde Studiegroepies.',
        features: ['14 studiegereedskap in een oortjie', 'AI-gepaarde studievennote', 'Eksamentelling en gereedheid'] },
      { emoji: '💰', section: 'GELD', title: 'Begroting & Stokvel',
        body: 'Volg elke rand van jou NSFAS-toelae op. Stel kategorieë, teken uitgawes aan, sien jou brandtempo. Sluit aan by \'n Stokvel om saam met klasmaats te spaar.',
        features: ['NSFAS-begroting opsporing', 'Stokvel-spaarkring', 'Beurs- en befondsingssoeker'] },
      { emoji: '🏡', section: 'LEWE', title: 'Lewe OS — Liggaam, Veiligheid & Welstand',
        body: 'Teken maaltye aan met SA-voedingsdata, volg slaapstekort, bou fiksheidsgewoontes, kalmeer jou senustelsel in Regulate. Deel jou ligging vir loop-huis-veiligheid.',
        features: ['Maaltyd en voeding', 'Slaap en fiksheidopsporing', 'Loop-huis-veiligheidsalarms'] },
      { emoji: '🚀', section: 'LOOPBAAN', title: 'Loopbaan & Groei',
        body: 'Blaai deur SA-werkaanbiedinge, volg jou skofte in Werk, bou jou besigheid in Lanseerder. Die Vaardigheidsakademie leer digitale vaardighede.',
        features: ['SA werkbord en aansoeke', 'Besigheidsopsporing', 'Digitale Vaardigheidsakademie'] },
      { emoji: '🤝', section: 'GEMEENSKAP', title: 'Gemeenskap — Jou Mense',
        body: 'Die Sosiale-voer toon wat oor kampus gebeur. Vind en verkoop handboeke, kry eweknie-onderrig, deel notas, en bly op hoogte via Uitsendings.',
        features: ['Kampus-sosiale voer', 'Eweknie-onderrig en notas-deel', 'Markplek en Verloor+Gevind'] },
      { emoji: '✨', section: 'NOVA KI', title: 'Nova — Jou Persoonlike KI',
        body: 'Nova ken jou modules, finansies, skedule en welstand. Vra haar enigiets — sy gee advies in jou konteks, nie generiese internet-antwoorde nie.',
        features: ['Konteks-bewuste advies', 'Antwoorde oor jou data', 'Praat SA-tale'] },
    ],
  },
  st: {
    chooseLang: 'Khetha puo ea hau', continueBtn: 'Tswela pele ka Sesotho',
    next: 'E latelang →', back: '← Morao', skip: 'Tlola leeto', done: 'Kena ho VarsityOS →',
    steps: [
      { emoji: '📚', section: 'THUTO', title: 'Thuto — Bongo ba Hau',
        body: 'Tsohle bakeng sa dithuto tsa hau kamoreng e le nngwe. Nako ea Thuto, Pomodoro, Manno, Dikarete, Boipokello ba Litlhahlobo le Study Pods.',
        features: ['Lisebelisoa tse 14 thutong', 'Metsoalle ea thuto ea AI', 'Lipalo tsa litlhahlobo'] },
      { emoji: '💰', section: 'CHELETE', title: 'Tekanyetso & Stokvel',
        body: 'Latela rand e nngwe le e nngwe ea NSFAS ea hau. Beha likarolo, ngola litsebi, bona sekhahla. Kenela Stokvel ho boloka le baithuti ba hau.',
        features: ['Ho laola NSFAS', 'Poloko ea Stokvel', 'Batlisiso ea Bursary'] },
      { emoji: '🏡', section: 'BOPHELO', title: 'I-OS ea Bophelo — Mmele le Polokeho',
        body: 'Ngola dijo ka data ea phepo ea SA, latela kadimo ea boroko, aha mikhwa ea boitlhaho, khutsa moriri oa hau kamoreng ea Regulate.',
        features: ['Ho ngola dijo le phepo', 'Latela boroko le boitlhaho', 'Marang-rang a polokeho'] },
      { emoji: '🚀', section: 'MOSEBETSI', title: 'Mosebetsi & Khoebo',
        body: 'Batla metsotso ea mosebetsi ea SA, ngola masete a hau, haha khoebo ea hau ho Launch Pad. Skills Academy e ruta bokgoni ba dijithale.',
        features: ['Sebaka sa mosebetsi ea SA', 'Ho laola khoebo', 'Skills Academy ea Dijithale'] },
      { emoji: '🤝', section: 'SECHABA', title: 'Sechaba — Batho Ba Hau',
        body: 'Tshebediso ea Social e u bontša se etsahalang campuseng. Fumana le rekisa dibuka, fumana moqeqi, arolelana manotse a hau.',
        features: ['Tshebediso ea setjhaba sa campus', 'Ho thuswa le ho arolelana', 'Marketplace le Ho lahlehelwa'] },
      { emoji: '✨', section: 'NOVA AI', title: 'Nova — AI ea Hau ya Botho',
        body: 'Nova e tseba libaka tsa hau, lichelete, nako, le bophelo ba hau. Botsa sengwe le sengwe — e tla fana ka keletso nng mokotleng oa hau.',
        features: ['Keletso e nang le maano', 'Diphetolo mabapi le data ea hau', 'E bua lipuo tsa SA'] },
    ],
  },
  tn: {
    chooseLang: 'Tlhopha puo ya gago', continueBtn: 'Tswelela ka Setswana',
    next: 'E e latelang →', back: '← Morago', skip: 'Tlola leeto', done: 'Tsena mo VarsityOS →',
    steps: [
      { emoji: '📚', section: 'THUTO', title: 'Thuto — Mogopolo wa Gago',
        body: 'Tsotlhe tsa dithuto tsa gago mo kaemong e le nngwe. Nako ya Thuto, Pomodoro, Manno, Dikarete, Boitekanelo jwa Ditshekatsheko le Study Pods.',
        features: ['Dithuso tse 14 mo thutong', 'Bagaetsho ba thuto ba AI', 'Dipalo tsa ditshekatsheko'] },
      { emoji: '💰', section: 'MADI', title: 'Tekanyetso & Stokvel',
        body: 'Leba rand nngwe le nngwe ya NSFAS ya gago. Baya dikgaolo, kwala ditšhenyo, bona seelo sa tiro. Tsena mo Stokvel go boloka mmogo le baakaademi ba gago.',
        features: ['Go laola NSFAS', 'Go boloka ka Stokvel', 'Batlhodi ya Bursary'] },
      { emoji: '🏡', section: 'BOTSHELO', title: 'I-OS ya Botshelo — Mmele le Polokeho',
        body: 'Kwala dijo ka data ya phepo ya SA, leba kadimo ya boroko, aga metlhale ya boitlhao, le go tlola manokonoko ya gago mo kaemong ya Regulate.',
        features: ['Go kwala dijo le phepo', 'Go leba boroko le boitlhao', 'Dikgakololo tsa polokeho'] },
      { emoji: '🚀', section: 'TIRO', title: 'Tiro & Kgolo',
        body: 'Batlha ditiro tsa SA, kwala dishifte tsa gago, le go aga kgwebo ya gago mo Launch Pad. Skills Academy e ruta bokgoni jwa dijithale.',
        features: ['Bataura tiro ya SA', 'Go laola kgwebo', 'Skills Academy ya Dijithale'] },
      { emoji: '🤝', section: 'SETŠHABA', title: 'Setšhaba — Batho Ba Gago',
        body: 'Social feed e bontsha se se diragalang khaemphase. Bona le rekisa dibuka, fumana morutwi, arolelana dinotse tsa gago.',
        features: ['Tiro ya setlhopha sa khaemphase', 'Go rutiwa le go arolelana', 'Marketplace le Go latlhegelwa'] },
      { emoji: '✨', section: 'NOVA AI', title: 'Nova — AI ya Gago ya Botho',
        body: 'Nova e itse dikgaolo tsa gago, madi, nako le boitekanelo. Botsa sengwe le sengwe — e tla naya kgakololo mo gongwe go ya ga gago.',
        features: ['Kgakololo e nang le sefa', 'Dikarabo ka data ya gago', 'E bua dipuo tsa SA'] },
    ],
  },
}

const ACCENT = '#A855F7'
const TEAL   = '#00CFA0'

export default function TourWizard({ defaultLang }: { defaultLang: string }) {
  const router = useRouter()

  const validLang = (Object.keys(CONTENT) as Lang[]).includes(defaultLang as Lang) ? defaultLang as Lang : 'en'
  const [lang, setLang]     = useState<Lang>(validLang)
  const [step, setStep]     = useState(-1)  // -1 = language selection
  const [saving, setSaving] = useState(false)

  const t = CONTENT[lang]
  const totalSteps = t.steps.length

  const finish = useCallback(async (chosenLang: Lang) => {
    setSaving(true)
    try {
      const sb = createClient()
      const { data: { user } } = await sb.auth.getUser()
      if (user) {
        await sb.from('profiles').update({ preferred_language: chosenLang }).eq('id', user.id)
      }
    } finally {
      router.push('/dashboard')
    }
  }, [router])

  // ── Language screen ──────────────────────────────────────────────────────────
  if (step === -1) {
    return (
      <div style={{
        width: '100%', maxWidth: 440, margin: '0 auto', padding: '32px 24px',
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(148,111,255,0.18)',
        borderRadius: 20, boxShadow: '0 0 60px rgba(168,85,247,0.12)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🌍</div>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: 'rgba(168,85,247,0.7)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6 }}>
            Step 1
          </div>
          <h1 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 22, color: '#fff', margin: 0 }}>
            Khetha ulimi / Choose Language
          </h1>
          <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>
            Pick the language for your VarsityOS training tour
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          {(Object.entries(LANG_LABELS) as [Lang, string][]).map(([code, name]) => (
            <button key={code} onClick={() => setLang(code)} style={{
              padding: '14px 12px', borderRadius: 12, textAlign: 'center',
              background: lang === code ? `rgba(168,85,247,0.18)` : 'rgba(255,255,255,0.04)',
              border: `1px solid ${lang === code ? 'rgba(168,85,247,0.45)' : 'rgba(255,255,255,0.08)'}`,
              color: lang === code ? ACCENT : 'rgba(255,255,255,0.55)',
              fontFamily: 'DM Sans,sans-serif', fontSize: 14, fontWeight: lang === code ? 700 : 400,
              cursor: 'pointer', transition: 'all 140ms ease',
            }}>{name}</button>
          ))}
        </div>

        <button onClick={() => setStep(0)} style={{
          width: '100%', padding: '14px', borderRadius: 12, fontWeight: 700, fontSize: 14,
          background: `linear-gradient(135deg, ${ACCENT}, ${TEAL})`,
          border: 'none', color: '#fff', cursor: 'pointer',
          fontFamily: 'DM Sans,sans-serif',
        }}>
          {CONTENT[lang].continueBtn}
        </button>
      </div>
    )
  }

  // ── Tour step ────────────────────────────────────────────────────────────────
  const current = t.steps[step]
  const progress = ((step + 1) / totalSteps) * 100

  return (
    <div style={{ width: '100%', maxWidth: 480, margin: '0 auto', padding: '0 16px' }}>
      {/* Progress bar */}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginBottom: 28, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${ACCENT}, ${TEAL})`, transition: 'width 400ms ease', borderRadius: 2 }} />
      </div>

      {/* Card */}
      <div style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(148,111,255,0.18)',
        borderRadius: 20, padding: '28px 24px', boxShadow: '0 0 60px rgba(168,85,247,0.10)',
        marginBottom: 20,
      }}>
        {/* Section label */}
        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: 'rgba(168,85,247,0.7)', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 8 }}>
          {current.section} · {step + 1} / {totalSteps}
        </div>

        {/* Icon */}
        <div style={{ fontSize: 48, marginBottom: 14 }}>{current.emoji}</div>

        {/* Title */}
        <h2 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 20, color: '#fff', margin: '0 0 10px' }}>
          {current.title}
        </h2>

        {/* Body */}
        <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, margin: '0 0 18px' }}>
          {current.body}
        </p>

        {/* Feature list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {current.features.map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: TEAL, flexShrink: 0 }} />
              <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <button onClick={() => step > 0 ? setStep(s => s - 1) : setStep(-1)} style={{
          padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 500,
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
          color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif',
        }}>{t.back}</button>

        <button onClick={() => router.push('/dashboard')} style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)',
          fontSize: 11, fontFamily: '"JetBrains Mono",monospace', cursor: 'pointer', letterSpacing: '0.05em',
        }}>{t.skip}</button>

        {step < totalSteps - 1 ? (
          <button onClick={() => setStep(s => s + 1)} style={{
            padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700,
            background: `linear-gradient(135deg, rgba(168,85,247,0.22), rgba(0,207,160,0.15))`,
            border: '1px solid rgba(168,85,247,0.35)', color: ACCENT,
            cursor: 'pointer', fontFamily: 'DM Sans,sans-serif',
          }}>{t.next}</button>
        ) : (
          <button onClick={() => finish(lang)} disabled={saving} style={{
            padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700,
            background: `linear-gradient(135deg, ${ACCENT}, ${TEAL})`,
            border: 'none', color: '#fff', cursor: saving ? 'wait' : 'pointer',
            opacity: saving ? 0.7 : 1, fontFamily: 'DM Sans,sans-serif',
          }}>{saving ? '...' : t.done}</button>
        )}
      </div>
    </div>
  )
}
