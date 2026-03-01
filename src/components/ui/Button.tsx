'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'teal' | 'coral' | 'outline' | 'ghost' | 'danger' | 'amber' | 'purple'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  loading?: boolean
  fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'teal',
  size = 'md',
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}, ref) => {
  const base = 'inline-flex items-center justify-center gap-2 font-display font-bold rounded-xl transition-all duration-150 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:scale-[0.97] select-none'

  const variants = {
    teal:    'bg-teal-600 text-white hover:bg-teal-500 shadow-teal disabled:opacity-50',
    coral:   'bg-coral text-white hover:bg-coral-light disabled:opacity-50',
    outline: 'bg-transparent text-white border border-white/20 hover:border-teal-500 hover:text-teal-400 disabled:opacity-40',
    ghost:   'bg-transparent text-white/60 hover:text-white hover:bg-white/5 disabled:opacity-40',
    danger:  'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 disabled:opacity-40',
    amber:   'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 disabled:opacity-40',
    purple:  'bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 disabled:opacity-40',
  }

  const sizes = {
    sm:   'px-3 py-2 text-xs',
    md:   'px-4 py-2.5 text-sm',
    lg:   'px-6 py-3.5 text-base',
    icon: 'p-2.5',
  }

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        base,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Loading…</span>
        </>
      ) : children}
    </button>
  )
})

Button.displayName = 'Button'
export default Button
