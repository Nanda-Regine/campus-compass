'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  hint,
  options,
  placeholder,
  className,
  id,
  ...props
}, ref) => {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block font-mono text-[0.6rem] tracking-[0.14em] uppercase text-white/40 mb-1.5"
        >
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={cn(
          'w-full px-3.5 py-2.5 rounded-xl text-sm text-white font-body',
          'bg-[#080f0e] border transition-all duration-150',
          'focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20',
          'appearance-none cursor-pointer',
          error
            ? 'border-red-500/50 focus:border-red-500'
            : 'border-white/10 hover:border-white/20',
          className
        )}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.3)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
          paddingRight: '2.5rem',
        }}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option
            key={opt.value}
            value={opt.value}
            style={{ background: '#111a18', color: 'white' }}
          >
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 font-mono text-[0.6rem] text-red-400">{error}</p>
      )}
      {hint && !error && (
        <p className="mt-1 font-mono text-[0.6rem] text-white/30">{hint}</p>
      )}
    </div>
  )
})

Select.displayName = 'Select'
export default Select
