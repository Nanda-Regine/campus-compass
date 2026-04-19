'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
  rightElement?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  hint,
  icon,
  rightElement,
  className,
  id,
  ...props
}, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block font-mono text-[0.6rem] tracking-[0.14em] uppercase text-white/40 mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3.5 py-2.5 rounded-xl text-base text-white',
            'bg-[var(--bg-base)] border transition-all duration-150',
            'placeholder:text-white/25 font-body',
            'focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20',
            error
              ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
              : 'border-white/10 hover:border-white/20',
            icon && 'pl-10',
            rightElement && 'pr-10',
            className
          )}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 font-mono text-[0.6rem] text-red-400">{error}</p>
      )}
      {hint && !error && (
        <p className="mt-1 font-mono text-[0.6rem] text-white/30">{hint}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'
export default Input
