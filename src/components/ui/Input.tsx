import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className = '', ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-text-secondary text-xs font-mono tracking-badge uppercase mb-1.5">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`w-full bg-bg-surface border ${error ? 'border-red-DEFAULT' : 'border-border'} rounded-lg px-3 py-2 text-text-primary text-sm font-sans placeholder-text-muted focus:outline-none focus:border-teal-muted transition-colors ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-red-DEFAULT text-xs font-mono">{error}</p>}
    </div>
  )
})

Input.displayName = 'Input'
export default Input
