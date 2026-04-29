import { forwardRef } from 'react'
import type { SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, error, className = '', children, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-text-secondary text-xs font-mono tracking-badge uppercase mb-1.5">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={`w-full bg-bg-surface border ${error ? 'border-red-DEFAULT' : 'border-border'} rounded-lg px-3 py-2 text-text-primary text-sm font-sans focus:outline-none focus:border-teal-muted transition-colors cursor-pointer ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-red-DEFAULT text-xs font-mono">{error}</p>}
    </div>
  )
})

Select.displayName = 'Select'
export default Select
