'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, DollarSign, UtensilsCrossed, Star } from 'lucide-react'

const tabs = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/study', icon: BookOpen, label: 'Study' },
  { href: '/budget', icon: DollarSign, label: 'Budget' },
  { href: '/meals', icon: UtensilsCrossed, label: 'Meals' },
  { href: '/nova', icon: Star, label: 'Nova' },
]

// Show bottom nav only on authenticated app pages
const APP_PREFIXES = ['/dashboard', '/study', '/budget', '/meals', '/nova', '/profile', '/work', '/campus-life', '/groups', '/referral', '/streak', '/upgrade']

export function BottomNav() {
  const pathname = usePathname()
  const show = APP_PREFIXES.some(p => pathname.startsWith(p))
  if (!show) return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{
        background: 'rgba(18, 14, 10, 0.96)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
      }}
    >
      <div className="flex items-center justify-around h-16">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 px-3 py-2 transition-all"
              style={{ color: active ? '#2dd4bf' : 'rgba(255,255,255,0.35)' }}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span
                className="font-mono"
                style={{ fontSize: '0.6rem', letterSpacing: '0.05em', fontWeight: active ? 600 : 400 }}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
