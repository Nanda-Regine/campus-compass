'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store'
import { SA_UNIVERSITIES, type FundingType, type ModuleColour } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import PWAInstallBanner from '@/components/PWAInstallBanner'
import ExamPushBanner from '@/components/study/ExamPushBanner'
import ICSImportButton from '@/components/study/ICSImportButton'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import { dispatchXP } from '@/lib/xp-engine'

const TVET_N_PROGRAMS = [
  'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering',
  'Fitting & Turning', 'Boilermaking', 'Plumbing', 'Welding',
  'Business Studies', 'Finance', 'Management Assistant', 'Marketing',
  'Human Resources Management', 'Public Management', 'Legal Secretary',
  'Computer Science', 'Information Technology',
]

const TVET_NCV_PROGRAMS = [
  'Agriculture', 'Civil Construction', 'Electrical Infrastructure Construction',
  'Engineering Fabrication', 'Finance, Economics & Accounting',
  'Hospitality', 'Information & Communication Technology',
  'Management', 'Marketing', 'Office Administration',
  'Primary Agriculture', 'Transport & Logistics',
]

const TVET_N_LEVELS = ['N1','N2','N3','N4','N5','N6']
const TVET_NCV_LEVELS = ['NCV L2','NCV L3','NCV L4']

// Detect SA university from email domain
const UNIVERSITY_DOMAINS: Record<string, string> = {
  'uct.ac.za':   'University of Cape Town (UCT)',
  'wits.ac.za':  'University of the Witwatersrand (Wits)',
  'up.ac.za':    'University of Pretoria (UP)',
  'sun.ac.za':   'Stellenbosch University (SU)',
  'ukzn.ac.za':  'University of KwaZulu-Natal (UKZN)',
  'uj.ac.za':    'University of Johannesburg (UJ)',
  'uwc.ac.za':   'University of the Western Cape (UWC)',
  'nmu.ac.za':   'Nelson Mandela University (NMU)',
  'nmmu.ac.za':  'Nelson Mandela University (NMU)',
  'ru.ac.za':    'Rhodes University',
  'unisa.ac.za': 'University of South Africa (UNISA)',
  'dut.ac.za':   'Durban University of Technology (DUT)',
  'cput.ac.za':  'Cape Peninsula University of Technology (CPUT)',
  'tut.ac.za':   'Tshwane University of Technology (TUT)',
  'wsu.ac.za':   'Walter Sisulu University (WSU)',
  'ufh.ac.za':   'University of Fort Hare (UFH)',
  'unizulu.ac.za': 'University of Zululand (UniZulu)',
  'ul.ac.za':    'University of Limpopo (UL)',
  'nwu.ac.za':   'North-West University (NWU)',
  'univen.ac.za': 'University of Venda (UNIVEN)',
  'cut.ac.za':   'Central University of Technology (CUT)',
  'vut.ac.za':   'Vaal University of Technology (VUT)',
  'mut.ac.za':   'Mangosuthu University of Technology (MUT)',
  'spu.ac.za':   'Sol Plaatje University (SPU)',
  'ump.ac.za':   'University of Mpumalanga (UMP)',
}

const EMOJIS = ['🎓','😎','🌟','💪','🔥','✨','🦋','🌻','🎯','🚀','💡','🦁','🌈','⚡','🎵','🏆']

const YEARS = ['1st Year','2nd Year','3rd Year','Honours / 4th Year','Masters / PhD','Part-time / Short course']

const YEAR_MAP: Record<string, number> = {
  '1st Year': 1, '2nd Year': 2, '3rd Year': 3,
  'Honours / 4th Year': 4, 'Masters / PhD': 5, 'Part-time / Short course': 6,
}

const FACULTIES = [
  'Engineering & Technology','Health Sciences','Humanities & Social Sciences',
  'Commerce & Business','Law','Education','Science','Arts & Design',
  'Agriculture','Built Environment','Other',
]

const FUNDING_OPTIONS: { key: FundingType; icon: string; name: string; desc: string }[] = [
  { key: 'nsfas',       icon: '🏛️', name: 'NSFAS',           desc: 'National Student Financial Aid Scheme' },
  { key: 'bursary',     icon: '📜', name: 'Private Bursary',  desc: 'Company, foundation or trust funding' },
  { key: 'scholarship', icon: '🎓', name: 'Scholarship',      desc: 'Merit or institution scholarship' },
  { key: 'family',      icon: '👨‍👩‍👧', name: 'Family Support',  desc: 'Supported by family or guardian' },
  { key: 'self_funded', icon: '💼', name: 'Self-Funded',       desc: 'Personal savings or student loan' },
  { key: 'other',       icon: '🔀', name: 'Other / Mixed',     desc: 'Combination or other arrangement' },
]

const DIETS = ['No restrictions','Vegetarian','Vegan','Halaal','Kosher','Lactose-free','Gluten-free']

const MODULE_COLOURS: ModuleColour[] = ['teal','coral','purple','amber','blue','green']

export default function SetupFlow() {
  const router = useRouter()
  const supabase = createClient()
  const { setProfile } = useAppStore()

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [detectedUniversity, setDetectedUniversity] = useState<string | null>(null)
  const userIdRef = useRef<string>('')

  // Searchable institution combobox
  const [uniQuery, setUniQuery] = useState('')
  const [uniDropdownOpen, setUniDropdownOpen] = useState(false)
  const uniRef = useRef<HTMLDivElement>(null)

  // TVET-specific module state
  const [tvetLevel, setTvetLevel] = useState('')
  const [tvetProgram, setTvetProgram] = useState('')

  // Student status (citizenship / visa type)
  const [studentStatus, setStudentStatus] = useState<'sa_citizen'|'permanent_resident'|'sadc_citizen'|'international'>('sa_citizen')
  const [countryOfOrigin, setCountryOfOrigin] = useState('')

  // Auto-detect university from email domain on mount + load saved progress
  useEffect(() => {
    let mounted = true
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!mounted || !user) return
      userIdRef.current = user.id

      // Restore saved progress
      try {
        const saved = localStorage.getItem(`setup_progress_${user.id}`)
        if (saved) {
          const p = JSON.parse(saved)
          if (p.step  !== undefined) setStep(p.step)
          if (p.name)        setName(p.name)
          if (p.emoji)       setEmoji(p.emoji)
          if (p.university)  setUniversity(p.university)
          if (p.year)        setYear(p.year)
          if (p.faculty)     setFaculty(p.faculty)
          if (p.funding)     setFunding(p.funding)
          if (p.nsfasLiving) setNsfasLiving(p.nsfasLiving)
          if (p.nsfasAccom)  setNsfasAccom(p.nsfasAccom)
          if (p.nsfasBooks)  setNsfasBooks(p.nsfasBooks)
          if (p.monthlyBudget) setMonthlyBudget(p.monthlyBudget)
          if (p.foodBudget)  setFoodBudget(p.foodBudget)
          if (p.modules?.length) setModules(p.modules)
          if (p.living)      setLiving(p.living)
          if (p.diet)        setDiet(p.diet)
          if (p.icsImported) setIcsImported(p.icsImported)
          if (p.nextExamName) setNextExamName(p.nextExamName)
          if (p.nextExamDate) setNextExamDate(p.nextExamDate)
        }
      } catch { /* ignore corrupt data */ }

      if (!user.email) return
      const domain = user.email.split('@')[1]?.toLowerCase()
      const detected = domain ? UNIVERSITY_DOMAINS[domain] : null
      if (detected) {
        setDetectedUniversity(detected)
        setUniversity(prev => prev || detected)
      }
    })
    return () => { mounted = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Form state
  const [name,         setName]         = useState('')
  const [emoji,        setEmoji]        = useState('🎓')
  const [university,   setUniversity]   = useState('')
  const [year,         setYear]         = useState('')
  const [faculty,      setFaculty]      = useState('')
  const [funding,      setFunding]      = useState<FundingType | ''>('')
  const [nsfasLiving,  setNsfasLiving]  = useState('')
  const [nsfasAccom,   setNsfasAccom]   = useState('')
  const [nsfasBooks,   setNsfasBooks]   = useState('')
  const [monthlyBudget,setMonthlyBudget]= useState('')
  const [foodBudget,   setFoodBudget]   = useState('')
  const [modules,      setModules]      = useState<string[]>([])
  const [moduleInput,  setModuleInput]  = useState('')
  const [living,       setLiving]       = useState('')
  const [diet,         setDiet]         = useState('No restrictions')
  const [icsImported,  setIcsImported]  = useState(false)
  const [nextExamName, setNextExamName] = useState('')
  const [nextExamDate, setNextExamDate] = useState('')
  const [preferredLang, setPreferredLang] = useState('en')

  // Save progress to localStorage on every change
  useEffect(() => {
    const uid = userIdRef.current
    if (!uid) return
    try {
      localStorage.setItem(`setup_progress_${uid}`, JSON.stringify({
        step, name, emoji, university, year, faculty, funding,
        nsfasLiving, nsfasAccom, nsfasBooks, monthlyBudget, foodBudget,
        modules, living, diet, icsImported, nextExamName, nextExamDate,
      }))
    } catch { /* storage full or private mode */ }
  }, [step, name, emoji, university, year, faculty, funding,
      nsfasLiving, nsfasAccom, nsfasBooks, monthlyBudget, foodBudget,
      modules, living, diet, icsImported, nextExamName, nextExamDate])

  // Close combobox on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (uniRef.current && !uniRef.current.contains(e.target as Node)) {
        setUniDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const isTVET = university.includes('TVET')
  const tvetPrograms = tvetLevel.startsWith('NCV') ? TVET_NCV_PROGRAMS : TVET_N_PROGRAMS

  const institutionType: 'university' | 'tvet' | 'private' | 'unisa' =
    isTVET ? 'tvet'
    : university.includes('UNISA') ? 'unisa'
    : ['Varsity College','Rosebank College','MSC College','Pearson','Boston','MANCOSA','Monash','Regenesys','Da Vinci','AFDA','Vega','AAA School','Stadio','Richfield','Regent','Lyceum','Damelin','Eduvos'].some(p => university.includes(p)) ? 'private'
    : 'university'

  // Filter NSFAS from funding options for international students
  const availableFunding = FUNDING_OPTIONS.filter(f =>
    !(studentStatus === 'international' && f.key === 'nsfas')
  )

  const totalSteps = 6

  const goNext = () => setStep(s => Math.min(s + 1, totalSteps - 1))
  const goBack = () => setStep(s => Math.max(s - 1, 0))

  const addModule = () => {
    const val = moduleInput.trim()
    if (!val || modules.includes(val)) return
    setModules(prev => [...prev, val])
    setModuleInput('')
  }

  const addTvetModule = () => {
    if (!tvetLevel || !tvetProgram) { toast.error('Select a level and program'); return }
    const label = `${tvetLevel} — ${tvetProgram}`
    if (modules.includes(label)) return
    setModules(prev => [...prev, label])
    setTvetProgram('')
  }

  const removeModule = (m: string) => setModules(prev => prev.filter(x => x !== m))

  const validateStep = (): string | null => {
    if (step === 0 && !name.trim()) return 'Please enter your name'
    if (step === 1 && !university)  return 'Please select your university'
    if (step === 1 && !year)        return 'Please select your year of study'
    if (step === 2 && !funding)     return 'Please select your funding type'
    return null
  }

  const handleNext = () => {
    const err = validateStep()
    if (err) { toast.error(err); return }
    if (step === totalSteps - 1) {
      handleFinish()
    } else {
      goNext()
    }
  }

  const handleFinish = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Save profile — full data set for Nova context and onboarding gate
      const profileData = {
        name: name.trim(),
        full_name: name.trim(),
        emoji,
        university,
        faculty,
        year_of_study: YEAR_MAP[year] ?? 1,
        funding_type: funding as FundingType,
        nsfas_monthly_amount: funding === 'nsfas'
          ? (parseFloat(nsfasLiving) || 0) + (parseFloat(nsfasAccom) || 0) + (parseFloat(nsfasBooks) || 0)
          : null,
        accommodation_type: living || null,
        dietary_preferences: diet !== 'No restrictions' ? [diet] : [],
        dietary_pref: diet,
        living_situation: living || null,
        institution_type: institutionType,
        student_status: studentStatus,
        country_of_origin: countryOfOrigin.trim() || null,
        tvet_qualification: isTVET ? (tvetLevel.startsWith('NCV') ? 'ncv' : 'nated') : null,
        onboarding_complete: true,
        onboarding_completed: true,
        preferred_language: preferredLang,
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .upsert({ id: user.id, email: user.email, ...profileData })
        .select()
        .single()

      if (profileError) throw profileError
      setProfile(profile)

      // Save budget targets
      await supabase
        .from('budgets')
        .upsert({
          user_id: user.id,
          monthly_budget: parseFloat(monthlyBudget) || 0,
          food_budget:    parseFloat(foodBudget)    || 0,
          nsfas_enabled:  funding === 'nsfas',
          nsfas_living:   parseFloat(nsfasLiving)   || 0,
          nsfas_accom:    parseFloat(nsfasAccom)     || 0,
          nsfas_books:    parseFloat(nsfasBooks)     || 0,
        }, { onConflict: 'user_id' })

      // Save initial modules
      if (modules.length > 0) {
        const colours = MODULE_COLOURS
        const moduleRows = modules.map((modName, i) => ({
          user_id: user.id,
          module_name: modName,
          module_code: modName.replace(/\s+/g, '').slice(0, 8).toUpperCase(),
          color: colours[i % colours.length],
        }))
        await supabase.from('modules').insert(moduleRows)
      }

      // Save next exam if provided
      if (nextExamName.trim() && nextExamDate) {
        await supabase.from('exams').insert({
          user_id: user.id,
          module_id: null,
          exam_name: nextExamName.trim(),
          exam_date: nextExamDate,
          start_time: '09:00',
          venue: null,
          duration_minutes: null,
          exam_type: 'final', // CHECK constraint only allows test/mid_year/final/supplementary/assignment_deadline — 'exam' silently failed
          notes: null,
        })
      }

      // Award XP for completing onboarding
      dispatchXP('task_complete', 'Completed VarsityOS onboarding')

      try { localStorage.removeItem(`setup_progress_${user.id}`) } catch { /* ok */ }
      try { localStorage.setItem('varsityos-new-user', name || 'Student') } catch { /* ok */ }
      toast.success('All set! Welcome to VarsityOS 🎉')
      router.push('/tour')
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Progress pip colours
  const pipState = (i: number) =>
    i < step ? 'bg-teal-600' : i === step ? 'bg-coral' : 'bg-white/10'

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
      {/* Header gradient */}
      <div
        className="px-5 pt-12 pb-8 text-center"
        style={{ background: 'linear-gradient(160deg, #0d9488 0%, #0f766e 60%, #134e4a 100%)' }}
      >
        <div className="w-14 h-14 rounded-full bg-white/15 backdrop-blur border border-white/25 flex items-center justify-center mx-auto mb-4 overflow-hidden">
          <Image src="/favicon.jpg" alt="VarsityOS" width={56} height={56} className="object-contain" />
        </div>
        <div className="font-display font-black text-xl text-white">VarsityOS</div>
        <div className="font-mono text-[0.6rem] text-white/60 tracking-widest uppercase mt-1">
          Your varsity life, fully organised
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 max-w-sm mx-auto w-full px-5 py-6">
        {/* Progress */}
        <div className="flex gap-1.5 mb-6">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={cn('h-1 flex-1 rounded-full transition-all duration-300', pipState(i))} />
          ))}
        </div>

        <div className="animate-fade-up">
          {/* STEP 0 — Name & avatar */}
          {step === 0 && (
            <div>
              <div className="font-mono text-[0.58rem] text-coral uppercase tracking-widest mb-1">Step 1 of 6</div>
              <h2 className="font-display font-black text-xl text-white mb-1">Hey! What&apos;s your name?</h2>
              <p className="text-sm text-white/50 mb-5">Let&apos;s personalise your VarsityOS.</p>

              <div className="space-y-4">
                <Input
                  label="Your Name"
                  placeholder="e.g. Thandi Nkosi"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleNext()}
                />
                <div>
                  <div className="font-mono text-[0.6rem] tracking-[0.14em] uppercase text-white/40 mb-2">Pick your avatar</div>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {EMOJIS.map(e => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setEmoji(e)}
                        className={cn(
                          'aspect-square rounded-xl flex items-center justify-center text-xl transition-all',
                          emoji === e
                            ? 'bg-teal-600/20 border-2 border-teal-500 scale-105'
                            : 'bg-white/5 border border-white/10 hover:bg-white/10'
                        )}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 1 — University */}
          {step === 1 && (
            <div>
              <div className="font-mono text-[0.58rem] text-coral uppercase tracking-widest mb-1">Step 2 of 6</div>
              <h2 className="font-display font-black text-xl text-white mb-1">Where are you studying?</h2>
              <p className="text-sm text-white/50 mb-5">We&apos;ll customise your experience.</p>

              {detectedUniversity && (
                <div className="rounded-xl px-4 py-3 mb-4 flex items-center gap-3" style={{ background: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.25)' }}>
                  <span className="text-lg">🎓</span>
                  <div>
                    <p className="font-display font-bold text-teal-400 text-xs">Detected from your email</p>
                    <p className="font-mono text-[0.62rem] text-white/60">{detectedUniversity}</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {/* Searchable institution combobox */}
                <div>
                  <div className="font-mono text-[0.6rem] tracking-[0.14em] uppercase text-white/40 mb-2">
                    University / Institution
                  </div>
                  <div ref={uniRef} className="relative">
                    <input
                      type="text"
                      placeholder={university || 'Search 100+ institutions…'}
                      value={uniDropdownOpen ? uniQuery : (university || '')}
                      onFocus={() => { setUniDropdownOpen(true); setUniQuery('') }}
                      onChange={e => setUniQuery(e.target.value)}
                      className="w-full bg-[var(--bg-surface)] border border-white/10 hover:border-white/20 focus:border-teal-600 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition-all font-body"
                    />
                    {university && !uniDropdownOpen && (
                      <button
                        type="button"
                        onClick={() => { setUniversity(''); setUniQuery('') }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 text-xs"
                      >
                        ✕
                      </button>
                    )}
                    {uniDropdownOpen && (
                      <div className="absolute z-50 left-0 right-0 top-[calc(100%+4px)] bg-[#0f1412] border border-white/10 rounded-xl shadow-2xl max-h-52 overflow-y-auto">
                        {SA_UNIVERSITIES
                          .filter(u => u.toLowerCase().includes(uniQuery.toLowerCase()))
                          .slice(0, 40)
                          .map(u => (
                            <button
                              key={u}
                              type="button"
                              onMouseDown={() => {
                                setUniversity(u)
                                setUniQuery('')
                                setUniDropdownOpen(false)
                              }}
                              className={cn(
                                'w-full text-left px-4 py-2.5 text-sm font-body transition-colors',
                                university === u
                                  ? 'bg-teal-600/20 text-teal-400'
                                  : 'text-white/70 hover:bg-white/5 hover:text-white'
                              )}
                            >
                              {u}
                            </button>
                          ))
                        }
                        {SA_UNIVERSITIES.filter(u => u.toLowerCase().includes(uniQuery.toLowerCase())).length === 0 && (
                          <div className="px-4 py-3 font-mono text-[0.62rem] text-white/30">No match found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[0.6rem] tracking-[0.14em] uppercase text-white/40 mb-2">Year of Study</div>
                  <div className="flex flex-wrap gap-2">
                    {YEARS.map(y => (
                      <button
                        key={y}
                        type="button"
                        onClick={() => setYear(y)}
                        className={cn(
                          'px-3 py-2 rounded-xl text-xs font-display font-bold transition-all',
                          year === y
                            ? 'bg-teal-600/20 border border-teal-500 text-teal-400'
                            : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                        )}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
                <Select
                  label="Faculty / Field of Study"
                  value={faculty}
                  onChange={e => setFaculty(e.target.value)}
                  placeholder="Select faculty…"
                  options={FACULTIES.map(f => ({ value: f, label: f }))}
                />
              </div>
            </div>
          )}

          {/* STEP 2 — Funding & budget */}
          {step === 2 && (
            <div>
              <div className="font-mono text-[0.58rem] text-coral uppercase tracking-widest mb-1">Step 3 of 6</div>
              <h2 className="font-display font-black text-xl text-white mb-1">How are you funded?</h2>
              <p className="text-sm text-white/50 mb-5">We&apos;ll help you track every rand.</p>

              <div className="space-y-4">
                {/* Student status — determines funding options */}
                <div className="space-y-2">
                  <div className="font-mono text-[0.6rem] tracking-[0.14em] uppercase text-white/40 mb-1">Student status</div>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { key: 'sa_citizen',          label: '🇿🇦 SA Citizen' },
                      { key: 'permanent_resident',  label: '🏠 Permanent Resident' },
                      { key: 'sadc_citizen',        label: '🌍 SADC Citizen' },
                      { key: 'international',       label: '✈️ International Student' },
                    ] as const).map(s => (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => { setStudentStatus(s.key); if (s.key !== 'international') setCountryOfOrigin('') }}
                        className={cn(
                          'px-3 py-2.5 rounded-xl border text-left text-xs font-display font-bold transition-all',
                          studentStatus === s.key
                            ? 'bg-sky-500/15 border-sky-500/50 text-sky-300'
                            : 'bg-white/3 border-white/8 text-white/60 hover:bg-white/8'
                        )}
                      >{s.label}</button>
                    ))}
                  </div>
                  {studentStatus === 'international' && (
                    <input
                      value={countryOfOrigin}
                      onChange={e => setCountryOfOrigin(e.target.value)}
                      placeholder="Country of origin (e.g. Zimbabwe, Nigeria, Kenya)"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-sky-500/50 focus:outline-none mt-1"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  {availableFunding.map(f => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setFunding(f.key)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left',
                        funding === f.key
                          ? 'bg-teal-600/15 border-teal-500/50 text-white'
                          : 'bg-white/3 border-white/8 text-white/70 hover:bg-white/8 hover:text-white'
                      )}
                    >
                      <span className="text-xl flex-shrink-0">{f.icon}</span>
                      <div>
                        <div className="font-display font-bold text-sm">{f.name}</div>
                        <div className="font-mono text-[0.58rem] text-white/40">{f.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>

                {funding === 'nsfas' && (
                  <div className="space-y-3 p-4 bg-teal-900/20 border border-teal-600/20 rounded-xl">
                    <div className="font-mono text-[0.6rem] text-teal-400 uppercase tracking-wide">
                      {isTVET ? 'TVET NSFAS Allowances' : 'NSFAS Allowances'}
                    </div>
                    {isTVET && (
                      <p className="font-mono text-[0.58rem] text-teal-300/70 leading-relaxed">
                        TVET NSFAS: R1,625/month living · R2,400–R5,000/month accommodation · R455/month books (R5,460/year)
                      </p>
                    )}
                    <Input label="Monthly Living Allowance (R)" type="number" placeholder={isTVET ? '1625' : 'e.g. 1500'} value={nsfasLiving} onChange={e => setNsfasLiving(e.target.value)} />
                    <Input label="Accommodation Allowance (R)" type="number" placeholder={isTVET ? '2400' : 'e.g. 2200'} value={nsfasAccom}  onChange={e => setNsfasAccom(e.target.value)} />
                    <Input label="Books & Stationery (R/month)" type="number" placeholder={isTVET ? '455' : 'e.g. 300'}   value={nsfasBooks}  onChange={e => setNsfasBooks(e.target.value)} />
                  </div>
                )}

                <Input label="Monthly Budget / Pocket Money (R)" type="number" placeholder="e.g. 2000" value={monthlyBudget} onChange={e => setMonthlyBudget(e.target.value)} />
              </div>
            </div>
          )}

          {/* STEP 3 — Timetable & Modules */}
          {step === 3 && (
            <div>
              <div className="font-mono text-[0.58rem] text-coral uppercase tracking-widest mb-1">Step 4 of 6</div>
              <h2 className="font-display font-black text-xl text-white mb-1">
                {isTVET ? 'What are you studying at TVET?' : 'Subjects & timetable'}
              </h2>
              <p className="text-sm text-white/50 mb-5">
                {isTVET ? 'Select your N-level or NCV programme.' : 'Import your full timetable or add subjects manually.'}
              </p>

              <div className="space-y-4">
                {/* ICS Import — primary CTA for non-TVET */}
                {!isTVET && (
                  <div className={cn(
                    'rounded-xl border p-4 transition-all',
                    icsImported
                      ? 'border-teal-500/30 bg-teal-900/10'
                      : 'border-sky-500/20 bg-sky-500/5'
                  )}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <span className="font-mono text-[0.57rem] text-sky-400 uppercase tracking-widest">Fastest way</span>
                        <p className="font-display font-bold text-sm text-white mt-0.5">Import your university timetable</p>
                        <p className="font-mono text-[0.58rem] text-white/35 mt-0.5">Adds all classes + exams from a .ics calendar file</p>
                      </div>
                      {icsImported && (
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 text-xs font-bold">✓</span>
                      )}
                    </div>
                    {icsImported ? (
                      <p className="font-mono text-[0.62rem] text-teal-400">Timetable imported — your classes and exams are in VarsityOS.</p>
                    ) : (
                      <ICSImportButton onImported={() => setIcsImported(true)} />
                    )}
                  </div>
                )}

                {/* Divider (only before module list shows) */}
                {!isTVET && (
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-white/8" />
                    <span className="font-mono text-[0.57rem] text-white/25 uppercase">
                      {icsImported ? 'add extra subjects' : 'or add manually'}
                    </span>
                    <div className="h-px flex-1 bg-white/8" />
                  </div>
                )}

                {/* Existing modules list */}
                {modules.length > 0 && (
                  <div className="space-y-2">
                    {modules.map((m, i) => (
                      <div key={m} className="flex items-center justify-between bg-white/5 border border-white/8 rounded-xl px-3.5 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ background: ['#0d9488','#f97316','#a855f7','#f59e0b','#3b82f6','#22c55e'][i % 6] }}
                          />
                          <span className="text-sm text-white font-body">{m}</span>
                        </div>
                        <button type="button" onClick={() => removeModule(m)} className="text-white/25 hover:text-red-400 transition-colors text-sm ml-2">✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {isTVET ? (
                  /* TVET: level + program selectors */
                  <div className="space-y-3">
                    <div>
                      <div className="font-mono text-[0.6rem] tracking-[0.14em] uppercase text-white/40 mb-2">Study Level</div>
                      <div className="flex flex-wrap gap-2">
                        {[...TVET_N_LEVELS, ...TVET_NCV_LEVELS].map(lvl => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => { setTvetLevel(lvl); setTvetProgram('') }}
                            className={cn(
                              'px-3 py-1.5 rounded-xl text-xs font-mono border transition-all',
                              tvetLevel === lvl
                                ? 'bg-teal-600/20 border-teal-500/50 text-teal-400'
                                : 'bg-white/5 border-white/8 text-white/50 hover:text-white hover:bg-white/10'
                            )}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>
                    {tvetLevel && (
                      <div>
                        <div className="font-mono text-[0.6rem] tracking-[0.14em] uppercase text-white/40 mb-2">Programme</div>
                        <div className="flex flex-wrap gap-2">
                          {tvetPrograms.map(prog => (
                            <button
                              key={prog}
                              type="button"
                              onClick={() => setTvetProgram(prog)}
                              className={cn(
                                'px-3 py-1.5 rounded-xl text-xs font-body border transition-all',
                                tvetProgram === prog
                                  ? 'bg-coral/20 border-coral/50 text-orange-300'
                                  : 'bg-white/5 border-white/8 text-white/50 hover:text-white hover:bg-white/10'
                              )}
                            >
                              {prog}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <Button onClick={addTvetModule} variant="teal" size="md" className="w-full" disabled={!tvetLevel || !tvetProgram}>
                      + Add {tvetLevel && tvetProgram ? `${tvetLevel} — ${tvetProgram}` : 'programme'}
                    </Button>
                  </div>
                ) : (
                  /* University: free-text module input */
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. Introduction to Psychology"
                      value={moduleInput}
                      onChange={e => setModuleInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addModule() } }}
                    />
                    <Button onClick={addModule} variant="teal" size="md" className="flex-shrink-0 px-4">Add</Button>
                  </div>
                )}

                {/* Next exam quick-capture */}
                {!isTVET && (
                  <div className="pt-3 border-t border-white/8 space-y-3">
                    <div className="font-mono text-[0.6rem] text-white/40 uppercase tracking-wide">Next exam (optional)</div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g. Mathematics 201"
                        value={nextExamName}
                        onChange={e => setNextExamName(e.target.value)}
                      />
                      <input
                        type="date"
                        value={nextExamDate}
                        onChange={e => setNextExamDate(e.target.value)}
                        className="flex-shrink-0 w-36 bg-[var(--bg-surface)] border border-white/10 hover:border-white/20 focus:border-teal-600 rounded-xl px-3 text-sm text-white outline-none transition-all"
                      />
                    </div>
                    {nextExamName && nextExamDate && (
                      <p className="font-mono text-[0.6rem] text-teal-400">
                        VarsityOS will count down to this exam and prep your study plan.
                      </p>
                    )}
                  </div>
                )}

                <p className="font-mono text-[0.6rem] text-white/25">
                  This step is optional — you can skip and add subjects later.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4 — Food & living */}
          {step === 4 && (
            <div>
              <div className="font-mono text-[0.58rem] text-coral uppercase tracking-widest mb-1">Step 5 of 6</div>
              <h2 className="font-display font-black text-xl text-white mb-1">Food & living situation</h2>
              <p className="text-sm text-white/50 mb-5">Help us give you the most relevant tips.</p>

              <div className="space-y-4">
                <Select
                  label="Where do you stay?"
                  value={living}
                  onChange={e => setLiving(e.target.value)}
                  placeholder="Select…"
                  options={[
                    { value: 'On-campus residence',   label: 'On-campus residence' },
                    { value: 'Off-campus digs / flat', label: 'Off-campus digs / flat' },
                    { value: 'At home with family',    label: 'At home with family' },
                    { value: 'Student commune',        label: 'Student commune' },
                  ]}
                />

                <div>
                  <div className="font-mono text-[0.6rem] tracking-[0.14em] uppercase text-white/40 mb-2">Dietary preference</div>
                  <div className="flex flex-wrap gap-2">
                    {DIETS.map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDiet(d)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs font-mono transition-all border',
                          diet === d
                            ? 'bg-teal-600/20 border-teal-500/50 text-teal-400'
                            : 'bg-white/5 border-white/8 text-white/50 hover:text-white hover:bg-white/10'
                        )}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  label="Monthly food budget (R)"
                  type="number"
                  placeholder="e.g. 800"
                  value={foodBudget}
                  onChange={e => setFoodBudget(e.target.value)}
                />

              </div>
            </div>
          )}

          {/* STEP 5 — Notifications opt-in */}
          {step === 5 && (
            <div>
              <div className="font-mono text-[0.58rem] text-coral uppercase tracking-widest mb-1">Almost done!</div>
              <h2 className="font-display font-black text-xl text-white mb-1">Stay on track 🔔</h2>
              <p className="text-sm text-white/50 mb-5">
                Get exam reminders and wellness nudges — even when the app is closed.
              </p>

              {/* Language of training */}
              <div className="mb-5">
                <div className="font-mono text-[0.6rem] tracking-[0.14em] uppercase text-white/40 mb-2">Train me in</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {([['en','English'],['zu','isiZulu'],['xh','isiXhosa'],['af','Afrikaans'],['st','Sesotho'],['tn','Setswana']] as [string,string][]).map(([code, name]) => (
                    <button key={code} type="button" onClick={() => setPreferredLang(code)} className={cn(
                      'py-1.5 px-2 rounded-lg text-[0.62rem] font-mono transition-all border',
                      preferredLang === code
                        ? 'bg-teal-600/20 border-teal-500 text-teal-300'
                        : 'bg-white/4 border-white/8 text-white/40 hover:text-white/60'
                    )}>{name}</button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <ExamPushBanner />

                <div className="p-4 bg-white/3 border border-white/8 rounded-xl space-y-2.5">
                  {([
                    ['📚', '3 days before each exam'],
                    ['⚡', '24 hours before exam day'],
                    ['💚', 'Evening wellness check-in nudge'],
                  ] as [string, string][]).map(([icon, text]) => (
                    <div key={text} className="flex items-center gap-3">
                      <span className="text-base">{icon}</span>
                      <span className="font-mono text-[0.62rem] text-white/50">{text}</span>
                    </div>
                  ))}
                </div>

                <p className="font-mono text-[0.57rem] text-white/25">
                  You can turn these off any time in your Profile settings.
                </p>

                <div className="pt-1">
                  <PWAInstallBanner variant="card" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Nav buttons */}
        <div className="flex items-center justify-between mt-8">
          {step > 0 ? (
            <Button variant="outline" size="md" onClick={goBack}>
              ← Back
            </Button>
          ) : <div />}

          <div className="flex items-center gap-4">
            {step >= 3 && step < totalSteps - 1 && (
              <button
                type="button"
                onClick={goNext}
                className="font-mono text-[0.65rem] text-white/30 hover:text-white/50 transition-colors"
              >
                Skip →
              </button>
            )}
            <Button
              variant={step === totalSteps - 1 ? 'coral' : 'teal'}
              size="md"
              onClick={handleNext}
              loading={saving}
            >
              {step === totalSteps - 1 ? '🚀 Launch VarsityOS' : 'Continue →'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
