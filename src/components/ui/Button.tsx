import type { ReactNode, ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

export default function Button({ variant = 'primary', size = 'md', children, className = '', ...props }: ButtonProps) {
  const variants = {
    primary: 'bg-teal hover:bg-teal-dim text-bg-primary font-bold',
    ghost: 'bg-transparent hover:bg-teal-glow text-text-secondary hover:text-teal border border-border hover:border-teal/30',
    danger: 'bg-red-bg hover:bg-red-DEFAULT/20 text-red-DEFAULT border border-red-DEFAULT/30',
    secondary: 'bg-bg-surface hover:bg-bg-card text-text-primary border border-border',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-6 py-3 text-sm rounded-xl',
  }

  return (
    <button
      className={`inline-flex items-center gap-2 font-sans transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
