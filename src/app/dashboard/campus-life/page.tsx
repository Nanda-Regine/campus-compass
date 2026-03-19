import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import TopBar from '@/components/layout/TopBar'

const GUIDES = [
  {
    id: 'friendships',
    icon: '👥',
    title: 'Making friends at varsity',
    subtitle: "It's harder than school — here's why and how",
    color: 'teal',
    prompt: "Tell me about making friends at university. It feels harder than school and I'm not sure why or what to do.",
  },
  {
    id: 'res-culture',
    icon: '🏠',
    title: 'Navigating res culture',
    subtitle: 'Your rights, how to report, how to find community',
    color: 'blue',
    prompt: 'Tell me about res culture at South African universities — my rights, what to do if something feels wrong, and how to find my people.',
  },
  {
    id: 'relationships',
    icon: '💙',
    title: 'Relationships and consent',
    subtitle: 'SA campus resources and honest conversation',
    color: 'purple',
    prompt: 'I want to talk about relationships and consent on campus. What should I know?',
  },
  {
    id: 'substances',
    icon: '🛡️',
    title: 'Substance use — honest talk',
    subtitle: 'Harm reduction, know your limits, campus clinic',
    color: 'amber',
    prompt: 'I want an honest conversation about substance use at university — not a lecture, just real information about staying safe.',
  },
  {
    id: 'imposter',
    icon: '🧠',
    title: 'Imposter syndrome',
    subtitle: "Feeling like you don't belong? You're not alone.",
    color: 'coral',
    prompt: "I feel like I don't belong at university — like everyone else knows something I don't. Can you help me understand imposter syndrome and what to do about it?",
  },
  {
    id: 'language',
    icon: '🗣️',
    title: 'Studying in a second language',
    subtitle: 'The cognitive load is real — here are strategies',
    color: 'green',
    prompt: "I study in English but it's not my first language. The cognitive load is exhausting on top of everything else. Can you help me with strategies for this?",
  },
  {
    id: 'help',
    icon: '🆘',
    title: 'When and who to ask for help',
    subtitle: 'Wellness, financial aid, SRC, safe spaces',
    color: 'teal',
    prompt: 'What support services are available to me at university? When should I go to student wellness, financial aid, or the SRC? How do I actually access these?',
  },
  {
    id: 'homesickness',
    icon: '🏡',
    title: 'Homesickness and distance',
    subtitle: 'Almost everyone feels it — here\'s what helps',
    color: 'purple',
    prompt: "I'm feeling really homesick. I miss my family and home. Can you talk me through this? It's affecting my ability to focus.",
  },
  {
    id: 'first-gen',
    icon: '🎓',
    title: 'First-generation student',
    subtitle: 'No blueprint, real pressure — strategies that work',
    color: 'blue',
    prompt: "I'm the first in my family to go to university and there's no blueprint. The pressure is real and nobody at home fully understands. Can you help me navigate this?",
  },
  {
    id: 'money-pride',
    icon: '💸',
    title: 'Money struggles and pride',
    subtitle: "What to do when you're too proud to ask for help",
    color: 'amber',
    prompt: "I'm struggling financially and too proud to ask for help. What resources actually exist at my university and how do I access them without shame?",
  },
]

const COLOR_MAP: Record<string, string> = {
  teal:   'bg-teal-600/10 border-teal-600/20 hover:border-teal-500/40',
  blue:   'bg-blue-500/10 border-blue-500/20 hover:border-blue-400/40',
  purple: 'bg-purple-500/10 border-purple-500/20 hover:border-purple-400/40',
  amber:  'bg-amber-500/10 border-amber-500/20 hover:border-amber-400/40',
  coral:  'bg-orange-500/10 border-orange-500/20 hover:border-orange-400/40',
  green:  'bg-green-500/10 border-green-500/20 hover:border-green-400/40',
}

export default async function CampusLifePage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <div className="min-h-screen bg-[#080f0e] pb-24">
      <TopBar title="Campus Life" />

      <div className="px-4 py-3 space-y-4 max-w-2xl mx-auto">

        {/* Header */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: 'linear-gradient(135deg, rgba(168,85,247,0.08) 0%, rgba(13,148,136,0.05) 100%)',
            border: '1px solid rgba(168,85,247,0.15)',
          }}
        >
          <div className="font-display font-black text-white text-lg mb-1">
            Real talk about varsity life 🏛️
          </div>
          <p className="font-body text-sm text-white/55 leading-relaxed">
            Things orientation day doesn&apos;t cover. Tap any guide to open a conversation with Nova — she&apos;s heard it all and won&apos;t judge.
          </p>
        </div>

        {/* Guides */}
        <div className="space-y-2.5">
          {GUIDES.map(guide => {
            const colorClass = COLOR_MAP[guide.color] ?? COLOR_MAP.teal
            const novaUrl = `/nova?prompt=${encodeURIComponent(guide.prompt)}`
            return (
              <Link
                key={guide.id}
                href={novaUrl}
                className={`flex items-center gap-4 rounded-2xl p-4 border transition-all hover:scale-[1.01] ${colorClass}`}
              >
                <div className="text-2xl flex-shrink-0">{guide.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold text-white text-sm">{guide.title}</div>
                  <div className="font-mono text-[0.58rem] text-white/40 mt-0.5 leading-snug">{guide.subtitle}</div>
                </div>
                <div className="font-mono text-[0.6rem] text-white/25 flex-shrink-0">→</div>
              </Link>
            )
          })}
        </div>

        {/* Crisis resources */}
        <div className="bg-[#111a18] border border-white/7 rounded-2xl p-4">
          <div className="font-mono text-[0.6rem] text-white/30 uppercase tracking-widest mb-3">
            Crisis support — free, 24/7
          </div>
          <div className="space-y-2.5">
            {[
              { label: 'SADAG (Depression & Anxiety)', number: '0800 567 567' },
              { label: 'LifeLine SA',                  number: '0861 322 322' },
              { label: 'SANCA (Substance Support)',    number: '0800 12 13 14' },
              { label: 'Suicide Crisis Line (SMS)',    number: '31393' },
            ].map(r => (
              <div key={r.number} className="flex items-center justify-between gap-3">
                <span className="font-body text-xs text-white/55 leading-tight">{r.label}</span>
                <a
                  href={`tel:${r.number.replace(/\s/g, '')}`}
                  className="font-mono text-xs text-teal-400 font-bold flex-shrink-0"
                >
                  {r.number}
                </a>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
