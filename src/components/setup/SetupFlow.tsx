'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store'
import { SA_UNIVERSITIES, type FundingType, type ModuleColour } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

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

const FACULTIES = [
  'Engineering & Technology','Health Sciences','Humanities & Social Sciences',
  'Commerce & Business','Law','Education','Science','Arts & Design',
  'Agriculture','Built Environment','Other',
]

const FUNDING_OPTIONS: { key: FundingType; icon: string; name: string; desc: string }[] = [
  { key: 'nsfas',   icon: '🏛️', name: 'NSFAS',           desc: 'National Student Financial Aid Scheme' },
  { key: 'bursary', icon: '📜', name: 'Private Bursary',  desc: 'Company, foundation or trust funding' },
  { key: 'self',    icon: '💼', name: 'Self / Family',     desc: 'Personal or family support' },
  { key: 'loan',    icon: '🏦', name: 'Student Loan',      desc: 'Bank or institution loan' },
  { key: 'mixed',   icon: '🔀', name: 'Mixed funding',     desc: 'Combination of the above' },
]

const DIETS = ['No restrictions','Vegetarian','Vegan','Halaal','Kosher','Lactose-free','Gluten-free']

const MODULE_COLOURS: ModuleColour[] = ['teal','coral','purple','amber','blue','green']

interface StepProps {
  onNext: () => void
  onBack?: () => void
}

export default function SetupFlow() {
  const router = useRouter()
  const supabase = createClient()
  const { setProfile, setBudget } = useAppStore()

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [detectedUniversity, setDetectedUniversity] = useState<string | null>(null)

  // Auto-detect university from email domain on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user?.email) return
      const domain = user.email.split('@')[1]?.toLowerCase()
      const detected = domain ? UNIVERSITY_DOMAINS[domain] : null
      if (detected) {
        setDetectedUniversity(detected)
        setUniversity(detected)
      }
    })
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

  const totalSteps = 5

  const goNext = () => setStep(s => Math.min(s + 1, totalSteps - 1))
  const goBack = () => setStep(s => Math.max(s - 1, 0))

  const addModule = () => {
    const val = moduleInput.trim()
    if (!val || modules.includes(val)) return
    setModules(prev => [...prev, val])
    setModuleInput('')
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
      if (!user) throw new Error('Not authenticated')

      // Save profile
      const profileData = {
        name: name.trim(),
        emoji,
        university,
        year_of_study: year,
        faculty,
        funding_type: funding as FundingType,
        dietary_pref: diet,
        living_situation: living,
        setup_complete: true,
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id)
        .select()
        .single()

      if (profileError) throw profileError
      setProfile(profile)

      // Save budget
      const budgetData = {
        monthly_budget: parseFloat(monthlyBudget) || 0,
        food_budget:    parseFloat(foodBudget)    || 0,
        nsfas_enabled:  funding === 'nsfas',
        nsfas_living:   parseFloat(nsfasLiving)   || 0,
        nsfas_accom:    parseFloat(nsfasAccom)     || 0,
        nsfas_books:    parseFloat(nsfasBooks)     || 0,
      }

      const { data: budget, error: budgetError } = await supabase
        .from('budgets')
        .update(budgetData)
        .eq('user_id', user.id)
        .select()
        .single()

      if (budgetError) throw budgetError
      setBudget(budget)

      // Save initial modules
      if (modules.length > 0) {
        const moduleRows = modules.map((name, i) => ({
          user_id: user.id,
          name,
          colour: MODULE_COLOURS[i % MODULE_COLOURS.length],
        }))
        await supabase.from('modules').insert(moduleRows)
      }

      toast.success('All set! Welcome to VarsityOS 🎉')
      router.push('/dashboard')
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
    <div className="min-h-screen bg-[#080f0e] flex flex-col">
      {/* Header gradient */}
      <div
        className="px-5 pt-12 pb-8 text-center"
        style={{ background: 'linear-gradient(160deg, #0d9488 0%, #0f766e 60%, #134e4a 100%)' }}
      >
        <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur border border-white/25 flex items-center justify-center text-3xl mx-auto mb-4">
          🧭
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
              <div className="font-mono text-[0.58rem] text-coral uppercase tracking-widest mb-1">Step 1 of 5</div>
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
                  <div className="grid grid-cols-8 gap-1.5">
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
              <div className="font-mono text-[0.58rem] text-coral uppercase tracking-widest mb-1">Step 2 of 5</div>
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
                <Select
                  label="University / Institution"
                  value={university}
                  onChange={e => setUniversity(e.target.value)}
                  placeholder="Select your university…"
                  options={SA_UNIVERSITIES.map(u => ({ value: u, label: u }))}
                />
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
              <div className="font-mono text-[0.58rem] text-coral uppercase tracking-widest mb-1">Step 3 of 5</div>
              <h2 className="font-display font-black text-xl text-white mb-1">How are you funded?</h2>
              <p className="text-sm text-white/50 mb-5">We&apos;ll help you track every rand.</p>

              <div className="space-y-4">
                <div className="space-y-2">
                  {FUNDING_OPTIONS.map(f => (
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
                    <div className="font-mono text-[0.6rem] text-teal-400 uppercase tracking-wide">NSFAS Allowances</div>
                    <Input label="Monthly Living Allowance (R)" type="number" placeholder="e.g. 1500" value={nsfasLiving} onChange={e => setNsfasLiving(e.target.value)} />
                    <Input label="Accommodation Allowance (R)" type="number" placeholder="e.g. 2200" value={nsfasAccom}  onChange={e => setNsfasAccom(e.target.value)} />
                    <Input label="Books & Stationery (R)"      type="number" placeholder="e.g. 300"  value={nsfasBooks}  onChange={e => setNsfasBooks(e.target.value)} />
                  </div>
                )}

                <Input label="Monthly Budget / Pocket Money (R)" type="number" placeholder="e.g. 2000" value={monthlyBudget} onChange={e => setMonthlyBudget(e.target.value)} />
              </div>
            </div>
          )}

          {/* STEP 3 — Modules */}
          {step === 3 && (
            <div>
              <div className="font-mono text-[0.58rem] text-coral uppercase tracking-widest mb-1">Step 4 of 5</div>
              <h2 className="font-display font-black text-xl text-white mb-1">What are you studying?</h2>
              <p className="text-sm text-white/50 mb-5">Add your modules. You can edit these anytime.</p>

              <div className="space-y-4">
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
                        <button
                          type="button"
                          onClick={() => removeModule(m)}
                          className="text-white/25 hover:text-red-400 transition-colors text-sm ml-2"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Introduction to Psychology"
                    value={moduleInput}
                    onChange={e => setModuleInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addModule() } }}
                  />
                  <Button onClick={addModule} variant="teal" size="md" className="flex-shrink-0 px-4">
                    Add
                  </Button>
                </div>
                <p className="font-mono text-[0.6rem] text-white/25">
                  This step is optional — you can skip and add modules later.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4 — Food & living */}
          {step === 4 && (
            <div>
              <div className="font-mono text-[0.58rem] text-coral uppercase tracking-widest mb-1">Step 5 of 5</div>
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
        </div>

        {/* Nav buttons */}
        <div className="flex items-center justify-between mt-8">
          {step > 0 ? (
            <Button variant="outline" size="md" onClick={goBack}>
              ← Back
            </Button>
          ) : <div />}

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
  )
}
