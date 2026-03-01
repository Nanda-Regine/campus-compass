import { cn } from '@/lib/utils'

interface BadgeProps {
  variant?: 'teal' | 'coral' | 'amber' | 'red' | 'green' | 'purple' | 'blue' | 'muted'
  size?: 'sm' | 'md'
  children: React.ReactNode
  className?: string
}

export default function Badge({ variant = 'teal', size = 'sm', children, className }: BadgeProps) {
  const variants = {
    teal:   'bg-teal-600/15 text-teal-400 border border-teal-600/20',
    coral:  'bg-orange-500/15 text-orange-400 border border-orange-500/20',
    amber:  'bg-amber-500/15 text-amber-400 border border-amber-500/20',
    red:    'bg-red-500/15 text-red-400 border border-red-500/20',
    green:  'bg-green-500/15 text-green-400 border border-green-500/20',
    purple: 'bg-purple-500/15 text-purple-400 border border-purple-500/20',
    blue:   'bg-blue-500/15 text-blue-400 border border-blue-500/20',
    muted:  'bg-white/5 text-white/40 border border-white/10',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-[0.58rem]',
    md: 'px-2.5 py-1 text-[0.65rem]',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-mono font-medium tracking-wide uppercase',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  )
}
